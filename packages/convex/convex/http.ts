import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import Stripe from "stripe";

const http = httpRouter();

async function sendEmail(to: string, subject: string, html: string) {
  console.log("📤 Iniciando envío de correo a:", to);
  
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("❌ RESEND_API_KEY no está configurado");
    throw new Error("RESEND_API_KEY no está configurado");
  }

  console.log("🔑 API Key configurada, enviando a Resend...");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: 'Acme <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  console.log("📡 Respuesta de Resend:", response.status, response.statusText);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error("❌ Error en respuesta de Resend:", errorData);
    throw new Error(`Error al enviar correo: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  console.log("✅ Respuesta exitosa de Resend:", result);
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

  const subscriptionDetails = await stripe.subscriptions.retrieve(subscription as string);
  const plan = subscriptionDetails.items.data[0]?.price;
  console.log(session)
  
  await ctx.runMutation(internal.functions.schoolSubscriptions.saveSubscription, {
    schoolId: metadata.schoolId,
    userId: metadata.userId,
    stripeCustomerId: customer as string,
    stripeSubscriptionId: subscription as string,
    currency: plan?.currency || "usd",
    plan: plan?.id || "unknown",
    status: "trialing",
    currentPeriodStart: subscriptionDetails.created,
    currentPeriodEnd: session.expires_at,
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

  const subscriptionData = await ctx.runQuery(internal.functions.schoolSubscriptions.getSubscriptionByStripeId, {
    stripeSubscriptionId: subscription.id
  });

  if (!subscriptionData) {
    console.error("No se encontró información de la suscripción");
    return;
  }

  const user = await ctx.runQuery(internal.functions.users.getUserById, {
    userId: subscriptionData.userId
  });

  const school = await ctx.runQuery(internal.functions.schools.getSchoolById, {
    schoolId: subscriptionData.schoolId
  });

  if (!user || !school) {
    console.error("No se pudo obtener información del usuario o la escuela");
    return;
  }

  const emailHtml = createPaymentSuccessEmail(user, school, subscriptionData, invoice);
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

function createPaymentSuccessEmail(user: any, school: any, subscription: any, invoice: any) {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pago Confirmado - ${school.name}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 300;
            }
            .header .subtitle {
                margin: 10px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 40px 30px;
            }
            .welcome-section {
                text-align: center;
                margin-bottom: 40px;
            }
            .welcome-section h2 {
                color: #2c3e50;
                font-size: 24px;
                margin-bottom: 15px;
            }
            .welcome-section p {
                color: #7f8c8d;
                font-size: 16px;
                margin: 0;
            }
            .payment-details {
                background-color: #f8f9fa;
                border-radius: 10px;
                padding: 25px;
                margin: 30px 0;
                border-left: 4px solid #27ae60;
            }
            .payment-details h3 {
                color: #2c3e50;
                margin: 0 0 20px 0;
                font-size: 18px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .detail-row:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            .detail-label {
                font-weight: 600;
                color: #6c757d;
            }
            .detail-value {
                color: #2c3e50;
                font-weight: 500;
            }
            .cta-section {
                text-align: center;
                margin: 40px 0;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
            }
            .footer {
                background-color: #2c3e50;
                color: white;
                text-align: center;
                padding: 30px;
                font-size: 14px;
            }
            .footer a {
                color: #3498db;
                text-decoration: none;
            }
            .success-icon {
                font-size: 48px;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Pago Confirmado!</h1>
                <p class="subtitle">Tu suscripción ha sido activada exitosamente</p>
            </div>
            
            <div class="content">
                <div class="welcome-section">
                    <div class="success-icon">🎉</div>
                    <h2>¡Bienvenido a ${school.name}!</h2>
                    <p>Hola ${user.name},</p>
                    <p>Nos complace confirmar que tu pago ha sido procesado exitosamente y tu suscripción está ahora activa.</p>
                </div>

                <div class="payment-details">
                    <h3>📋 Detalles de la Transacción</h3>
                    <div class="detail-row">
                        <span class="detail-label">Escuela:</span>
                        <span class="detail-value">${school.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Usuario:</span>
                        <span class="detail-value">${invoice.customer_email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Detalles:</span>
                        <span class="detail-value">${invoice.lines?.data?.[0]?.description || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Inicio:</span>
                        <span class="detail-value">${invoice.lines?.data?.[0]?.period?.start ? new Date(invoice.lines.data[0].period.start * 1000).toLocaleDateString('es-ES') : 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Expira:</span>
                        <span class="detail-value">${invoice.lines?.data?.[0]?.period?.end ? new Date(invoice.lines.data[0].period.end * 1000).toLocaleDateString('es-ES') : 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Plan:</span>
                        <span class="detail-value">${subscription.plan}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value" style="color: #27ae60; font-weight: 600;">✅ Activo</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Fecha de Activación:</span>
                        <span class="detail-value">${currentDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">ID de Suscripción:</span>
                        <span class="detail-value">${subscription.stripeSubscriptionId.slice(-8)}</span>
                    </div>
                </div>

                <div class="cta-section">
                    <h3>🚀 Comienza a usar tu cuenta</h3>
                    <p>Ya puedes acceder a todas las funcionalidades de ${school.name} desde tu panel de control.</p>
                    <a href="https://${school.subdomain}.sisescolar.com" class="cta-button">
                        Acceder a mi cuenta
                    </a>
                </div>

                <div style="background-color: #e8f5e8; border-radius: 10px; padding: 20px; margin: 30px 0;">
                    <h4 style="color: #27ae60; margin: 0 0 15px 0;">💡 Próximos pasos:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #2c3e50;">
                        <li>Configura tu perfil de usuario</li>
                        <li>Explora las funcionalidades disponibles</li>
                        <li>Revisa la documentación de ayuda</li>
                        <li>Contacta al soporte si tienes preguntas</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p>© ${new Date().getFullYear()} ${school.name}. Todos los derechos reservados.</p>
                <p>Si tienes alguna pregunta, no dudes en <a href="mailto:${school.email}">contactarnos</a>.</p>
                <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">
                    Este correo fue enviado automáticamente. Por favor, no respondas a esta dirección.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
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