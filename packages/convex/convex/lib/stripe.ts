import Stripe from "stripe";

/**
 * Instancia única de Stripe para todo el proyecto.
 * Se recomienda centralizar la configuración aquí
 * para evitar duplicación y mantener las mejores prácticas.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});