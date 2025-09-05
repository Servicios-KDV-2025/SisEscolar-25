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
  apiVersion: "2025-07-30.basil",
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
    serverUrl: process.env.NEXT_PUBLIC_SERVER_URL!
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


export default http;