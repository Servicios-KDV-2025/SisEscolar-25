import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import Stripe from "stripe";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

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
      if (!sig) throw new Error("Falta la firma de Stripe");

      const body = await request.text();
      
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
      if (!webhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET no está configurado");
      }
      
      const event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        webhookSecret
      );

      console.log("✅ Evento Stripe recibido:", event.type);

      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(ctx, event.data.object);
          break;
        case "invoice.payment_succeeded":
          await handleInvoicePaymentSucceeded(ctx, event.data.object);
          break;
        case "customer.subscription.deleted":
          // await handleSubscriptionDeleted(ctx, event.data.object);
          break;
        case "customer.subscription.updated":
          // await handleSubscriptionUpdated(ctx, event.data.object);
          break;
        default:
          console.log(`⚠️ Evento no manejado: ${event.type}`);
      }

      return new Response(null, { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

async function handleCheckoutSessionCompleted(ctx: any, session: Stripe.Checkout.Session) {
  console.log("✅ checkout.session.completed");

  const { customer, subscription, metadata } = session;
  if (!metadata?.schoolId || !metadata?.userId || !subscription) {
    throw new Error("Faltan datos necesarios en checkout session");
  }

  // 1) Mapear Clerk ID -> Convex ID
  const userDoc = await ctx.db
    .query("user")
    .filter((q: any) => q.eq(q.field("clerkId"), metadata.userId)) // Clerk ID que mandaste en metadata
    .unique();

  if (!userDoc?._id) {
    throw new Error("Usuario de Convex no encontrado para ese Clerk ID");
  }

  // 2) Datos de la suscripción en Stripe
  const sub = (await stripe.subscriptions.retrieve(subscription as string)) as Stripe.Subscription;
  const plan = sub.items.data[0]?.price;

  const currentPeriodStart: number = (sub as any).current_period_start ?? 0; // epoch (s)
  const currentPeriodEnd: number   = (sub as any).current_period_end   ?? 0; // epoch (s)
  

  // 3) Guardar suscripción usando IDs de Convex (NO Clerk IDs)
  await ctx.runMutation(internal.functions.schoolSubscriptions.saveSubscription, {
    schoolId: metadata.schoolId as Id<"school">,
    userId: userDoc._id as Id<"user">,
    stripeCustomerId: customer as string,
    stripeSubscriptionId: subscription as string,
    currency: plan?.currency || "usd",
    plan: plan?.id || "unknown",
    status: sub.status ?? "trialing",
    currentPeriodStart,
    currentPeriodEnd
  });
}
async function handleInvoicePaymentSucceeded(ctx: any, invoice: Stripe.Invoice) {
  console.log("✅ invoice.payment_succeeded");
  console.log(invoice)
  if (!invoice.customer) throw new Error("Missing customer in invoice");

  const subscriptions = await stripe.subscriptions.list({
    customer: invoice.customer as string,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) throw new Error("No active subscription found");

  const subscription = subscriptions.data[0];

  await ctx.runMutation(internal.functions.schoolSubscriptions.updateSubscription, {
    stripeSubscriptionId: subscription.id,
    status: "active",
  });
}

// async function handleSubscriptionDeleted(ctx: any, subscription: Stripe.Subscription) {
//   await ctx.runMutation(internal["functions/schoolSubscriptions"].updateSubscription, {
//     stripeSubscriptionId: subscription.id,
//     status: "canceled",
//     updatedAt: Math.floor(Date.now() / 1000),
//   });
// }

// async function handleSubscriptionUpdated(ctx: any, subscription: Stripe.Subscription) {
//   await ctx.runMutation(internal["functions/schoolSubscriptions"].updateSubscription, {
//     stripeSubscriptionId: subscription.id,
//     status: subscription.status,
//     updatedAt: Math.floor(Date.now() / 1000),
//   });
// }


export default http;