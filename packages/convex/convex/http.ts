import { httpRouter } from "convex/server";
import { ActionCtx, httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import Stripe from "stripe";
import { Id } from "./_generated/dataModel";
import { paymentSuccessTemplate } from "./templates/paymentSuccess";

const http = httpRouter();

async function sendEmail(to: string, subject: string, html: string) {
  console.log("📧 Iniciando envío de correo a:", to);

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("❌ RESEND_API_KEY no está configurado");
    throw new Error("RESEND_API_KEY no está configurado");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
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
    console.error("❌ Error en respuesta de Resend:", errorData);
    throw new Error(`Error al enviar correo: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  return result;
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

// Stripe 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: "2025-07-30.basil",
  apiVersion: "2025-09-30.clover",
});
 
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
    stripeSubscriptionId: subscription?.id
  });

  if (!subscriptionData) {
    console.error("❌ No se encontró información de la suscripción");
    return;
  }

  const user = await ctx.runQuery(internal.functions.users.getUserByIdInternal, {
    userId: subscriptionData?.userId
  });

  const school = await ctx.runQuery(internal.functions.schools.getSchoolById, {
    schoolId: subscriptionData.schoolId
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
    serverUrl: process.env.NEXT_EMAIL_SERVER_URL!
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
        console.error("❌ Falta firma de Stripe");
        return new Response("Falta la firma de Stripe", { status: 400 });
      }

      const body = await request.text();
      console.log("📦 Body recibido (primeros 200 chars):", body.substring(0, 200));
      
      const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET?.trim();
      if (!webhookSecret) {
        console.error("❌ STRIPE_CONNECT_WEBHOOK_SECRET no configurado");
        throw new Error("STRIPE_CONNECT_WEBHOOK_SECRET no está configurado");
      }

      const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
      console.log("✅ Evento verificado:", event.type, "ID:", event.id);

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
        case "account.updated":
          console.log("👤 Procesando account.updated");
          await handleAccountUpdated(ctx, event.data.object);
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
      return new Response(JSON.stringify({ 
        error: "Internal server error",
        message: error.message 
      }), { status: 500 });
    }
  }),
});

async function handleCheckoutSessionCompletedForBilling(ctx: ActionCtx, session: Stripe.Checkout.Session) {
  console.log("✅ checkout.session.completed (billing):", session.id);
  console.log("📋 Session metadata:", JSON.stringify(session.metadata, null, 2));
  console.log("💰 Amount total:", session.amount_total);
  console.log("💳 Payment intent:", session.payment_intent);
  console.log("💵 Currency:", session.currency);
  console.log("👤 Customer:", session.customer);

  const metadata = session.metadata;
  
  if (!metadata?.billingId || !metadata?.studentId || !metadata?.tutorId) {
    console.error("❌ Metadata incompleta en Checkout Session");
    console.error("   billingId:", metadata?.billingId);
    console.error("   studentId:", metadata?.studentId);
    console.error("   tutorId:", metadata?.tutorId);
    console.error("   schoolId:", metadata?.schoolId);
    
    // Lanzar error en lugar de return para que el webhook devuelva 500
    throw new Error(`Metadata incompleta: billingId=${metadata?.billingId}, studentId=${metadata?.studentId}, tutorId=${metadata?.tutorId}`);
  }

  // Obtener el Payment Intent asociado
  const paymentIntentId = session.payment_intent as string;
  console.log("💳 Payment Intent ID extraído:", paymentIntentId);
  
  if (!paymentIntentId) {
    console.error("❌ No se encontró Payment Intent en la sesión");
    throw new Error("No se encontró Payment Intent en la sesión");
  }

  console.log("💾 Intentando confirmar pago en la base de datos...");
  console.log("   billingId:", metadata.billingId);
  console.log("   studentId:", metadata.studentId);
  console.log("   tutorId:", metadata.tutorId);
  console.log("   amount:", (session.amount_total || 0) / 100);

  // Confirmar el pago en la base de datos
  await ctx.runMutation(internal.functions.stripePayments.confirmPayment, {
    paymentIntentId: paymentIntentId,
    billingId: metadata.billingId as Id<"billing">,
    studentId: metadata.studentId as Id<"student">,
    amount: (session.amount_total || 0) / 100, // Convertir de centavos a pesos
    createdBy: metadata.tutorId as Id<"user">,
    stripeChargeId: paymentIntentId,
  });

  console.log("✅ Pago de billing confirmado en base de datos desde Checkout");
}

async function handlePaymentIntentSucceeded(ctx: ActionCtx, paymentIntent: Stripe.PaymentIntent) {
  console.log("✅ payment_intent.succeeded:", paymentIntent.id);
  console.log("📋 Payment Intent metadata:", JSON.stringify(paymentIntent.metadata, null, 2));
  console.log("💰 Amount:", paymentIntent.amount);
  console.log("💵 Currency:", paymentIntent.currency);
  console.log("💳 Latest charge:", paymentIntent.latest_charge);
  console.log("🎯 Status:", paymentIntent.status);

  const metadata = paymentIntent.metadata;
  
  if (!metadata.billingId || !metadata.studentId || !metadata.tutorId) {
    console.error("❌ Metadata incompleta en Payment Intent");
    console.error("   billingId:", metadata?.billingId);
    console.error("   studentId:", metadata?.studentId);
    console.error("   tutorId:", metadata?.tutorId);
    console.error("   schoolId:", metadata?.schoolId);
    
    // Lanzar error en lugar de return
    throw new Error(`Metadata incompleta en Payment Intent: billingId=${metadata?.billingId}, studentId=${metadata?.studentId}, tutorId=${metadata?.tutorId}`);
  }

  console.log("💾 Intentando confirmar pago en la base de datos...");
  console.log("   billingId:", metadata.billingId);
  console.log("   studentId:", metadata.studentId);
  console.log("   tutorId:", metadata.tutorId);
  console.log("   amount:", paymentIntent.amount / 100);

  // Confirmar el pago en la base de datos
  await ctx.runMutation(internal.functions.stripePayments.confirmPayment, {
    paymentIntentId: paymentIntent.id,
    billingId: metadata.billingId as Id<"billing">,
    studentId: metadata.studentId as Id<"student">,
    amount: paymentIntent.amount / 100, // Convertir de centavos a pesos
    createdBy: metadata.tutorId as Id<"user">,
    stripeChargeId: paymentIntent.latest_charge as string,
  });

  console.log("✅ Pago confirmado en base de datos desde Payment Intent");
}

async function handlePaymentIntentFailed(ctx: ActionCtx, paymentIntent: Stripe.PaymentIntent) {
  console.log("❌ payment_intent.failed:", paymentIntent.id);
  // Aquí puedes agregar lógica para notificar al usuario sobre el fallo
}

async function handleAccountUpdated(ctx: ActionCtx, account: Stripe.Account) {
  console.log("✅ account.updated:", account.id);
  // Puedes actualizar el estado de la cuenta en tu base de datos si lo necesitas
}
export default http;