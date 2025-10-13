import { v } from "convex/values";
import { action, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

// Crear un Payment Intent para un pago con Standard account
export const createPaymentIntent = action({
  args: {
    billingId: v.id("billing"),
    amount: v.number(),
    schoolId: v.id("school"),
    studentId: v.id("student"),
    tutorId: v.id("user"),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Obtener la escuela y su cuenta conectada
    const school = await ctx.runQuery(internal.functions.stripeConnect.getSchoolForConnect, {
      schoolId: args.schoolId,
    });

    if (!school.stripeAccountId) {
      throw new Error("La escuela no tiene una cuenta de Stripe configurada");
    }

    if (!school.stripeOnboardingComplete) {
      throw new Error("La escuela debe completar la configuración de Stripe");
    }

    // Para Standard accounts, el pago va directamente a su cuenta
    // y nosotros cobramos una comisión mediante application_fee
    const platformFee = Math.round(args.amount * 0.03 * 100); // 3% de comisión

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(args.amount * 100), // Convertir a centavos
        currency: "mxn",
        application_fee_amount: platformFee,
        description: args.description || `Pago de colegiatura`,
        metadata: {
          billingId: args.billingId,
          studentId: args.studentId,
          tutorId: args.tutorId,
          schoolId: args.schoolId,
          ...args.metadata,
        },
      },
      {
        stripeAccount: school.stripeAccountId, // ← Importante: especificar la cuenta conectada
      }
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  },
});

// Crear un Transfer directo (alternativa a Payment Intent)
export const createDirectTransfer = action({
  args: {
    billingId: v.id("billing"),
    amount: v.number(),
    schoolId: v.id("school"),
    studentId: v.id("student"),
    sourceTransaction: v.string(), // El charge ID del pago original
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const school = await ctx.runQuery(internal.functions.stripeConnect.getSchoolForConnect, {
      schoolId: args.schoolId,
    });

    if (!school.stripeAccountId) {
      throw new Error("La escuela no tiene una cuenta de Stripe configurada");
    }

    // Crear un transfer directo a la cuenta de la escuela
    const transfer = await stripe.transfers.create({
      amount: Math.round(args.amount * 100),
      currency: "mxn",
      destination: school.stripeAccountId,
      source_transaction: args.sourceTransaction,
      description: args.description || "Transferencia de pago de colegiatura",
      metadata: {
        billingId: args.billingId,
        studentId: args.studentId,
        schoolId: args.schoolId,
      },
    });

    return {
      transferId: transfer.id,
      amount: transfer.amount / 100,
    };
  },
});

// Confirmar un pago después de que se complete
export const confirmPayment = internalMutation({
  args: {
    paymentIntentId: v.string(),
    billingId: v.id("billing"),
    studentId: v.id("student"),
    amount: v.number(),
    createdBy: v.id("user"),
    stripeChargeId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Obtener el billing actual
    const billing = await ctx.db.get(args.billingId);
    if (!billing) {
      throw new Error("Registro de cobro no encontrado");
    }

    // Obtener el estudiante
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Estudiante no encontrado");
    }

    // Crear el registro de pago con información de Stripe
    const paymentId = await ctx.db.insert("payments", {
      billingId: args.billingId,
      studentId: args.studentId,
      method: "card", // Pago con tarjeta vía Stripe
      amount: args.amount,
      createdBy: args.createdBy,
      stripePaymentIntentId: args.paymentIntentId,
      stripeChargeId: args.stripeChargeId,
      stripeTransferId: args.stripeTransferId,
      createdAt: now,
      updatedAt: now,
    });

    // Actualizar el billing (misma lógica que processPayment existente)
    const previousTotalAmount = billing.totalAmount || billing.amount;
    const newTotalAmount = previousTotalAmount - args.amount;

    let newStatus: typeof billing.status;
    let paidAt: number | undefined;
    let creditToAdd = 0;

    if (newTotalAmount === 0) {
      newStatus = "Pago cumplido";
      paidAt = now;
    } else if (newTotalAmount < 0) {
      newStatus = "Pago cumplido";
      paidAt = now;
      creditToAdd = Math.abs(newTotalAmount);
    } else {
      newStatus = "Pago parcial";
      paidAt = undefined;
    }

    await ctx.db.patch(args.billingId, {
      status: newStatus,
      totalAmount: Math.max(0, newTotalAmount),
      paidAt: paidAt,
      updatedAt: now,
    });

    // Actualizar el credit del estudiante
    const currentCredit = student.credit || 0;
    const newCredit = currentCredit + creditToAdd;

    await ctx.db.patch(args.studentId, {
      credit: newCredit,
      updatedAt: now,
    });

    return {
      success: true,
      paymentId,
      newStatus,
    };
  },
});

