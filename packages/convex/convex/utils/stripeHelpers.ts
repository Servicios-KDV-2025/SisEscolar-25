import Stripe from "stripe";
import { internal } from "../_generated/api";
import { stripe } from "../lib/stripe";

/**
 * Convierte una cantidad en MXN a centavos.
 * Stripe requiere todos los montos en la unidad más pequeña (centavos).
 *
 * @param amount - Monto en pesos mexicanos.
 * @returns Monto en centavos.
 */
export const amountToCents = (amount: number) => Math.round(amount * 100);

/**
 * Calcula la comisión de la plataforma (2%) en centavos.
 * Se aplica un fee adicional para Stripe Connect.
 *
 * @param amount - Monto original en pesos.
 * @returns Monto de comisión en centavos.
 */
export const calcFee = (amount: number) => Math.round(amount * 0.02 * 100);

/**
 * Construye el objeto metadata compartido entre SPEI y OXXO.
 * Esto permite identificar el pago dentro de Stripe.
 *
 * @param args - Argumentos proporcionados al endpoint de Convex.
 * @returns Objeto metadata para Stripe.
 */
export const buildMetadata = (args: any) => ({
  billingId: args.billingId,
  studentId: args.studentId,
  tutorId: args.tutorId,
  schoolId: args.schoolId,
  customerEmail: args.customerEmail,
  customerName: args.customerName,
});

/**
 * Valida que la escuela tenga un Stripe Connect Account configurado
 * y que haya completado el onboarding.
 *
 * @param ctx - Contexto de Convex.
 * @param schoolId - ID de la escuela.
 * @throws Error si la escuela no está lista para recibir pagos.
 * @returns Datos de la escuela.
 */
export async function validateSchool(ctx: any, schoolId: string) {
  const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
    schoolId,
  });

  if (!school.stripeAccountId) {
    throw new Error("La escuela no tiene una cuenta de Stripe configurada");
  }
  if (!school.stripeOnboardingComplete) {
    throw new Error("La escuela debe completar la configuración de Stripe");
  }

  return school;
}

/**
 * Crea un Customer en Stripe vinculado a la cuenta de la escuela (Stripe Connect).
 * Este Customer es necesario para métodos como SPEI (customer_balance).
 *
 * @param args - Argumentos con datos del cliente (nombre, correo, etc).
 * @param schoolAccountId - ID de la cuenta de Stripe Connect.
 * @returns El objeto `Stripe.Customer` creado.
 */
export async function createStripeCustomer(args: any, schoolAccountId: string) {
  return stripe.customers.create(
    {
      email: args.customerEmail,
      name: args.customerName,
      metadata: {
        studentId: args.studentId,
        tutorId: args.tutorId,
        schoolId: args.schoolId,
      },
    },
    { stripeAccount: schoolAccountId }
  );
}

/**
 * Crea y confirma un Payment Intent en la cuenta conectada de Stripe.
 * Confirmar el PI es necesario para generar instrucciones SPEI u OXXO.
 *
 * @param schoolAccountId - ID Stripe Connect de la escuela.
 * @param paymentIntentParams - Parámetros para `stripe.paymentIntents.create()`.
 * @param confirmParams - Parámetros para confirmar el PaymentIntent.
 * @returns El PaymentIntent confirmado.
 */
export async function createAndConfirmPaymentIntent(
  schoolAccountId: string,
  paymentIntentParams: Stripe.PaymentIntentCreateParams,
  confirmParams: Stripe.PaymentIntentConfirmParams
) {
  const pi = await stripe.paymentIntents.create(paymentIntentParams, {
    stripeAccount: schoolAccountId,
  });

  return stripe.paymentIntents.confirm(pi.id, confirmParams, {
    stripeAccount: schoolAccountId,
  });
}