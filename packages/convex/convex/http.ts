import { httpRouter } from "convex/server";
import { ActionCtx, httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import Stripe from "stripe";
import { Id } from "./_generated/dataModel";
import { paymentSuccessTemplate } from "./templates/paymentSuccess";
import { schoolPaymentSuccessTemplate } from "./templates/schoolPaymentSuccess";
import { stripe } from "./lib/stripe";

const http = httpRouter();

/**
 * Función para enviar correos electrónicos usando Resend
 *
 * @param to - Dirección de correo del destinatario
 * @param subject - Asunto del correo
 * @param html - Contenido HTML del correo
 * @returns Resultado de la API de Resend
 * @throws Error si la configuración es inválida o el envío falla
 */
export async function sendEmail(to: string, subject: string, html: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY no está configurado");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    throw new Error("Dirección de correo inválida");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "sistema.escolar@ekardex.app",
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error al enviar correo: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const event = await validateRequest(request);
      if (!event) {
        console.error("Failed to validate webhook request");
        return new Response("Invalid webhook signature", { status: 401 });
      }

      console.log(`Processing Clerk webhook event: ${event.type}`);

      switch (event.type) {
        case "user.created":
        case "user.updated":
          await ctx.runMutation(internal.functions.users.upsertFromClerk, {
            data: event.data,
          });
          console.log(`Successfully processed ${event.type} for user: ${event.data.id}`);
          break;
        case "user.deleted": {
          const clerkUserId = event.data.id!;
          await ctx.runMutation(internal.functions.users.deleteFromClerk, { clerkUserId });
          console.log(`Successfully deleted user: ${clerkUserId}`);
          break;
        }
        default:
          console.log("Ignored Clerk webhook event", event.type);
      }
      return new Response(null, { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };

  // Verificar que todos los headers necesarios estén presentes
  if (!svixHeaders["svix-id"] || !svixHeaders["svix-timestamp"] || !svixHeaders["svix-signature"]) {
    console.error("Missing required svix headers");
    return null;
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

http.route({
  path: "/subscription-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const sig = request.headers.get("stripe-signature");
      if (!sig) {
        return new Response("Falta la firma de Stripe", { status: 400 });
      }

      const body = await request.text();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
      if (!webhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET no está configurado");
      }

      const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);

      if (!event.data || !event.data.object) {
        console.error("❌ Evento Stripe malformado - falta data.object:", event);
        return new Response("Evento malformado", { status: 400 });
      }

      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(ctx, event.data.object);
          break;
        case "invoice.payment_succeeded":
          await handleInvoicePaymentSucceeded(ctx, event.data.object);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(ctx, event.data.object);
          break;
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(ctx, event.data.object);
          break;
        default:
          console.log(`⚠️ Evento no manejado: ${event.type}`);
      }

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (error: any) {
      if (error.type === "StripeSignatureVerificationError") {
        console.error("❌ Firma Stripe inválida:", error);
        return new Response("Firma inválida", { status: 400 });
      }
      console.error("❌ Error interno procesando webhook:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

async function handleCheckoutSessionCompleted(ctx: ActionCtx, session: Stripe.Checkout.Session) {
  console.log("✅ checkout.session.completed");
  const { customer, subscription, metadata } = session;
  if (!metadata?.schoolId || !metadata?.userId || !subscription) {
    console.error("❌ Checkout session incompleta:", { metadata, subscription });
    throw new Error("Faltan datos necesarios en checkout session");
  }

  const user = await ctx.runQuery(api.functions.users.getUserByClerkId, {
    clerkId: metadata.userId,
  });

  const subscriptionDetails = await stripe.subscriptions.retrieve(subscription as string);
  const plan = subscriptionDetails.items.data[0]?.price;

  await ctx.runMutation(internal.functions.schoolSubscriptions.saveSubscription, {
    schoolId: metadata.schoolId as Id<"school">,
    userId: user?._id as Id<"user">,
    stripeCustomerId: customer as string,
    stripeSubscriptionId: subscription as string,
    currency: plan?.currency || "usd",
    plan: plan?.id || "unknown",
    status: subscriptionDetails.status || "inactive",
    currentPeriodStart: subscriptionDetails.created,
    currentPeriodEnd: session.expires_at,
  });
}

async function handleInvoicePaymentSucceeded(ctx: ActionCtx, invoice: Stripe.Invoice) {
  console.log("✅ invoice.payment_succeeded");
  if (!invoice.customer) throw new Error("Missing customer in invoice");

  const subscriptions = await stripe.subscriptions.list({
    customer: invoice.customer as string,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) throw new Error("No active subscription found");

  const subscription = subscriptions.data[0];

  if (!subscription?.id) {
    throw new Error("No se pudo obtener el ID de la suscripción");
  }

  await ctx.runMutation(internal.functions.schoolSubscriptions.updateSubscription, {
    stripeSubscriptionId: subscription.id,
    status: "active",
  });

  const subscriptionData = await ctx.runQuery(internal.functions.schoolSubscriptions.getSubscriptionByStripeId, {
    stripeSubscriptionId: subscription?.id,
  });

  if (!subscriptionData) {
    console.error("❌ No se encontró información de la suscripción");
    return;
  }

  const user = await ctx.runQuery(internal.functions.users.getUserByIdInternal, {
    userId: subscriptionData?.userId,
  });

  const school = await ctx.runQuery(internal.functions.schools.getSchoolById, {
    schoolId: subscriptionData.schoolId,
  });

  if (!user || !school) {
    console.error("❌ No se pudo obtener información del usuario o la escuela");
    return;
  }

  const emailHtml = paymentSuccessTemplate({
    school,
    user,
    invoice,
    currentDate: new Date().toLocaleDateString("es-ES"),
    serverUrl: process.env.NEXT_EMAIL_SERVER_URL!,
  });
  const emailSubject = `¡Bienvenido a ${school.name}! - Pago Confirmado`;

  try {
    const emailData = await sendEmail(user.email, emailSubject, emailHtml);
    console.log("✅ Correo enviado exitosamente:", emailData);
  } catch (emailError) {
    console.error("❌ Error al enviar correo:", emailError);
    if (emailError instanceof Error) {
      console.error("   - Detalles del error:", emailError.message);
    }
  }
}

async function handleSubscriptionDeleted(ctx: any, subscription: Stripe.Subscription) {
  await ctx.runMutation(internal.functions.schoolSubscriptions.updateSubscription, {
    stripeSubscriptionId: subscription.id,
    status: "canceled",
  });
}

async function handleSubscriptionUpdated(ctx: any, subscription: Stripe.Subscription) {
  await ctx.runMutation(internal.functions.schoolSubscriptions.updateSubscription, {
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
  });
}

// Webhook para Stripe Connect payments
http.route({
  path: "/stripe-connect-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    console.log("🔔 Webhook recibido en /stripe-connect-webhook");

    try {
      const sig = request.headers.get("stripe-signature");
      if (!sig) {
        console.error("Falta firma de Stripe");
        return new Response("Falta la firma de Stripe", { status: 400 });
      }

      const body = await request.text();

      let event;
      let usedSecret = "unknown";

      // Primero intentar con STRIPE_V2_WEBHOOK_SECRET (para invoices)
      const v2Secret = process.env.STRIPE_V2_WEBHOOK_SECRET?.trim();
      if (v2Secret) {
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, v2Secret);
          usedSecret = "v2";
        } catch (err) {
          console.log("V2 secret falló, intentando con Connect secret...");
        }
      }

      // Si V2 falló o no existe, intentar con STRIPE_CONNECT_WEBHOOK_SECRET
      if (!event) {
        const connectSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET?.trim();
        if (!connectSecret) {
          console.error("Ningún webhook secret configurado");
          throw new Error("Se requiere STRIPE_V2_WEBHOOK_SECRET o STRIPE_CONNECT_WEBHOOK_SECRET");
        }
        event = await stripe.webhooks.constructEventAsync(body, sig, connectSecret);
        usedSecret = "connect";
      }

      switch (event.type) {
        case "checkout.session.completed":
          console.log("🛒 Procesando checkout.session.completed");
          await handleCheckoutSessionCompletedForBilling(ctx, event.data.object);
          console.log("✅ Checkout procesado exitosamente");
          break;
        case "payment_intent.succeeded":
          console.log("💳 Procesando payment_intent.succeeded");
          await handlePaymentIntentSucceeded(ctx, event.data.object);
          console.log("✅ Payment intent procesado exitosamente");
          break;
        case "payment_intent.payment_failed":
          console.log("❌ Procesando payment_intent.payment_failed");
          await handlePaymentIntentFailed(ctx, event.data.object);
          break;
        case "charge.succeeded":
          console.log("💳 Procesando charge.succeeded");
          await handleChargeSucceeded(ctx, event.data.object);
          break;
        case "account.updated":
          console.log("👤 Procesando account.updated");
          await handleAccountUpdated(ctx, event.data.object);
          break;
        case "invoice.created":
          console.log("📄 Invoice creado - OK (no requiere acción)");
          break;
        case "invoice.finalized":
          console.log("📄 Invoice finalizado - OK (no requiere acción)");
          break;
        case "invoice.paid":
          console.log("💵 Invoice pagado - OK (ya procesado en registerCashPaymentWithInvoice)");
          break;
        default:
          console.log(`⚠️ Evento no manejado: ${event.type}`);
      }

      console.log("✅ Webhook procesado completamente");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (error: any) {
      console.error("❌ Error procesando webhook:", error);
      console.error("   Stack:", error.stack);
      console.error("   Message:", error.message);

      // Retornar 500 para que Stripe reintente
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error.message,
        }),
        { status: 500 }
      );
    }
  }),
});

/**
 * Procesa el evento `checkout.session.completed` para pagos escolares.
 *
 * Registra el pago, confirma el Payment Intent y actualiza la información
 * asociada a la cobranza del estudiante.
 *
 * @param ctx - Contexto de acción de Convex.
 * @param session - Sesión de checkout provista por Stripe.
 * @throws Error si falta metadata requerida o no existe un Payment Intent.
 */
async function handleCheckoutSessionCompletedForBilling(ctx: ActionCtx, session: Stripe.Checkout.Session) {
  const metadata = session.metadata;

  if (!metadata?.billingId || !metadata?.studentId || !metadata?.tutorId) {
    throw new Error(
      `Metadata incompleta: billingId=${metadata?.billingId}, studentId=${metadata?.studentId}, tutorId=${metadata?.tutorId}`
    );
  }

  const paymentIntentId = session.payment_intent as string;

  if (!paymentIntentId) throw new Error("No se encontró Payment Intent en la sesión");
  
  await ctx.runMutation(internal.functions.payments.confirmPayment, {
    paymentIntentId: paymentIntentId,
    billingId: metadata.billingId as Id<"billing">,
    studentId: metadata.studentId as Id<"student">,
    amount: (session.amount_total || 0) / 100, // Convertir de centavos a pesos
    createdBy: metadata.tutorId as Id<"user">,
    stripeChargeId: paymentIntentId,
  });
}

/**
 * Procesa el evento `payment_intent.succeeded`.
 *
 * Registra el pago, genera facturas con Facturapi y envía el correo de
 * confirmación cuando el pago se realiza con tarjeta.
 *
 * @param ctx - Contexto de Convex.
 * @param paymentIntent - Payment Intent confirmado.
 * @throws Error si falta metadata requerida.
 */
async function handlePaymentIntentSucceeded(ctx: ActionCtx, paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;

  if (!metadata?.billingId || !metadata?.studentId || !metadata?.tutorId || !metadata?.schoolId) {
    throw new Error(
      `Metadata incompleta en Payment Intent: billingId=${metadata?.billingId}, studentId=${metadata?.studentId}, tutorId=${metadata?.tutorId}, schoolId=${metadata?.schoolId}`
    );
  }

  let paymentMethod: "cash" | "bank_transfer" | "card" | "oxxo" | "other" = "other";
  if (paymentIntent.payment_method_types.includes("oxxo")) {
    paymentMethod = "oxxo"; 
  } else if (paymentIntent.payment_method_types.includes("customer_balance")) {
    paymentMethod = "bank_transfer";
  } else if (paymentIntent.payment_method_types.includes("card")) {
    paymentMethod = "card";
  }

  const payment = await ctx.runMutation(internal.functions.payments.confirmPayment, {
    paymentIntentId: paymentIntent.id,
    billingId: metadata.billingId as Id<"billing">,
    studentId: metadata.studentId as Id<"student">,
    amount: paymentIntent.amount / 100,
    createdBy: metadata.tutorId as Id<"user">,
    stripeChargeId: paymentIntent.latest_charge as string,
    paymentMethod: paymentMethod,
  });

  const facturapi = await ctx.runAction(api.functions.actions.facturapi.generateFacturapiInvoice, {
    paymentId: payment.paymentId as Id<"payments">,
    tutorId: metadata.tutorId as Id<"user">,
  });

  await ctx.runMutation(api.functions.payments.updatePaymentWithFacturapi, {
    paymentId: payment.paymentId as Id<"payments">,
    facturapiInvoiceId: String(facturapi.facturapiInvoiceId),
    facturapiInvoiceNumber: String(facturapi.facturapiInvoiceNumber),
    facturapiInvoiceStatus: String(facturapi.facturapiInvoiceStatus),
  });

  if (paymentMethod === "card") {
    try {
      await sendPaymentSuccessEmail(
        ctx,
        metadata,
        payment,
        paymentIntent.amount / 100,
        paymentMethod,
        paymentIntent.latest_charge as string
      );
    } catch (emailError) {
      console.error("Error enviando correo con recibo:", emailError);
    }
  }
}

/**
 * Procesa el evento `charge.succeeded`, útil para métodos asincrónicos
 * como SPEI u OXXO. Obtiene el pago relacionado y envía el correo de
 * confirmación con enlace al recibo de Stripe.
 *
 * @param ctx - Contexto de Convex.
 * @param charge - Objeto Charge de Stripe.
 */
async function handleChargeSucceeded(ctx: ActionCtx, charge: Stripe.Charge) {
  if (!charge.payment_intent) return;
  if (charge.payment_method === "card") return;

  const payment = await ctx.runQuery(internal.functions.payments.getPaymentByPaymentIntentIdInternal, {
    paymentIntentId: charge.payment_intent as string,
  });

  if (!payment) return console.error("Pago no encontrado para payment_intent:", charge.payment_intent);

  const studentTutor = await ctx.runQuery(internal.functions.payments.getStudentWithTutor, {
    studentId: payment.studentId,
  });

 if (!studentTutor?.student) return console.error("Estudiante no encontrado");

  const { student } = studentTutor;

  const metadata = {
    billingId: payment.billingId,
    studentId: payment.studentId,
    tutorId: payment.createdBy,
    schoolId: student.schoolId,
  };

  try {
    await sendPaymentSuccessEmail(
      ctx,
      metadata,
      payment,
      charge.amount / 100,
      payment?.method ?? "other",
      charge.receipt_url ?? ""
    );
  } catch (emailError) {
    console.error("Error enviando correo con recibo:", emailError);
  }
}

/**
 * Función para enviar un correo de confirmación de un pago exitoso
 * Maneja la preparación de datos y envío del correo usando la plantilla schoolPaymentSuccessTemplate
 *
 * @param ctx - Contexto de acción de Convex
 * @param metadata - Metadata con billingId, studentId, tutorId, schoolId
 * @param payment - Objeto de pago confirmado en la base de datos
 * @param paymentAmount - Monto del pago en pesos (ya convertido de centavos)
 * @param paymentMethod - Método de pago detectado
 * @param chargeId - ID del charge de Stripe para obtener recibo (opcional)
 */
export async function sendPaymentSuccessEmail(
  ctx: ActionCtx,
  metadata: any,
  payment: any,
  paymentAmount: number,
  paymentMethod: string,
  chargeId?: string
): Promise<void> {
  const studentTutor = await ctx.runQuery(internal.functions.payments.getStudentWithTutor, {
    studentId: metadata.studentId as Id<"student">,
  });

  const billingData = await ctx.runQuery(internal.functions.payments.getBillingWithConfig, {
    billingId: metadata.billingId as Id<"billing">,
  });

  const schoolData = await ctx.runQuery(internal.functions.schools.getSchoolById, {
    schoolId: metadata.schoolId as Id<"school">,
  });

  if (!studentTutor?.tutor || !billingData?.billingConfig || !billingData.billing || !schoolData) {
    throw new Error("Datos de pago incompletos");
  }

  const { student, tutor } = studentTutor;
  const { billingConfig, billing } = billingData;

  const now = Date.now();
  let dueDate: number;

  if (billingConfig?.endDate && billingConfig.endDate > 0) {
    dueDate = billingConfig.endDate;
  } else {
    dueDate = billing?.createdAt ? billing.createdAt + 30 * 24 * 60 * 60 * 1000 : now;
  }

  const daysLate = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

  const paymentType =
    billingConfig.type === "seguro-vida" ? "seguro"
    : billingConfig.type === "plan-alimenticio" ? "alimentación"
    : billingConfig.type === "material-escolar" ? "material"
    : (billingConfig.type ?? "otro");

  const serverUrl = process.env.NEXT_EMAIL_SERVER_URL || "https://ekardex.app";

  let invoiceUrl: string | undefined;

  if (chargeId) {
    try {
      if (chargeId.startsWith("ch_")) {
        const chargeData = await fetchStripeChargeAndReceipt(chargeId, schoolData.stripeAccountId ?? "");
        invoiceUrl = chargeData.invoiceUrl;
      } else {
        invoiceUrl = chargeId;
      }
    } catch (error) {
      console.error("Error obteniendo charge:", error);
    }
  } else {
    console.log("No hay charge ID disponible - email sin recibo");
  }

  const emailHtml = schoolPaymentSuccessTemplate({
    school: {
      name: schoolData.name || "Escuela",
      subdomain: schoolData.subdomain || "escuela",
      email: schoolData.email || "N/A",
      address: schoolData.address || "N/A",
      phone: schoolData.phone || "N/A",
      imgUrl: schoolData.imgUrl || "",
    },
    user: {
      name: `${tutor.name || "Tutor"} ${tutor.lastName || ""}`.trim(),
      email: tutor.email || "tutor@email.com",
    },
    payment: {
      id: payment.paymentId || "desconocido",
      amount: paymentAmount,
      baseAmount: billing?.amount ?? 0,
      method: paymentMethod,
      createdAt: Date.now(),
      totalAmount: billing?.totalAmount ?? 0,
      totalDiscount: billing?.totalDiscount,
      appliedDiscounts: billing?.appliedDiscounts,
      lateFee: billing?.lateFee,
      daysLate: daysLate,
      billingConfig: billingConfig
        ? {
            type: billingConfig.type,
          }
        : undefined,
      student: student
        ? {
            name: student.name || "Estudiante",
            lastName: student.lastName || "",
            enrollment: student.enrollment || "N/A",
          }
        : undefined,
    },
    serverUrl: serverUrl,
    paymentType: paymentType || billingConfig?.type,
    invoiceUrl,
  });

  const emailSubject = `¡Pago Confirmado! - ${schoolData.name}`;
  const recipientEmail = tutor.email;

  await sendEmail(recipientEmail, emailSubject, emailHtml);
  console.log("✅ Correo enviado exitosamente");
}

/**
 * Esta función realiza una petición HTTP a la API de Stripe para obtener
 * la URL del recibo de un cargo específico en una cuenta conectada.
 *
 * @param chargeId - ID del cargo de Stripe (debe comenzar con 'ch_')
 * @param connectedAccountId - ID de la cuenta conectada de Stripe
 * @returns La URL del recibo si está disponible
 */
export async function fetchStripeChargeAndReceipt(
  chargeId: string,
  connectedAccountId: string
): Promise<{
  invoiceUrl?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const chargeResp = await fetch(`https://api.stripe.com/v1/charges/${chargeId}`, {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Stripe-Account": connectedAccountId,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!chargeResp.ok) {
      const errorData = await chargeResp.json().catch(() => ({}));
      console.log("Charge no encontrado o error en Stripe:", errorData.message || chargeResp.status);
      return {};
    }

    const charge = await chargeResp.json();

    if (!charge || !charge.receipt_url) {
      console.log("Charge encontrado pero sin receipt_url");
      return {};
    }
    return {
      invoiceUrl: charge.receipt_url,
    };
  } catch (error) {
    console.log("Error obteniendo charge:", error);
    return {};
  }
}

async function handleAccountUpdated(ctx: ActionCtx, account: Stripe.Account) {
  console.log("✅ account.updated:", account.id);
  // Puedes actualizar el estado de la cuenta en tu base de datos si lo necesitas
}

async function handlePaymentIntentFailed(ctx: ActionCtx, paymentIntent: Stripe.PaymentIntent) {
  console.log("❌ payment_intent.failed:", paymentIntent.id);
  // Aquí puedes agregar lógica para notificar al usuario sobre el fallo
}

export default http;
