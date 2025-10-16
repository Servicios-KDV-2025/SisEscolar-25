import { v } from "convex/values";
import { action, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: "2025-07-30.basil",
  apiVersion: "2025-09-30.clover",
});

// Crear una Checkout Session para pago con tarjeta
export const createCheckoutSession = action({
  args: {
    billingId: v.id("billing"),
    amount: v.number(),
    schoolId: v.id("school"),
    studentId: v.id("student"),
    tutorId: v.id("user"),
    studentName: v.string(),
    paymentType: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ sessionId: string; url: string | null }> => {
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

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: args.paymentType,
              description: `Pago de ${args.studentName}`,
            },
            unit_amount: Math.round(args.amount * 100), // Convierte  a centavos
          },
          quantity: 1,
        },
      ],
      // Transferir automáticamente el dinero a la cuenta de la escuela (solucion temporal)
      payment_intent_data: {
        transfer_data: {
          destination: school.stripeAccountId,
        },
        metadata: {
          billingId: args.billingId,
          studentId: args.studentId,
          tutorId: args.tutorId,
          schoolId: args.schoolId,
          studentName: args.studentName,
          paymentType: args.paymentType,
        },
      },
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        billingId: args.billingId,
        studentId: args.studentId,
        tutorId: args.tutorId,
        schoolId: args.schoolId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
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
      description: args.description || "Transferencia de pago",
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
    paymentMethod: v.optional(v.union(v.literal("cash"), v.literal("bank_transfer"), v.literal("card"), v.literal("other"))),
  },
  handler: async (ctx, args) => {
    console.log("💾 confirmPayment - Iniciando...");
    console.log("   paymentIntentId:", args.paymentIntentId);
    console.log("   billingId:", args.billingId);
    console.log("   studentId:", args.studentId);
    console.log("   amount:", args.amount);
    console.log("   createdBy:", args.createdBy);
    console.log("   paymentMethod:", args.paymentMethod || "card (default)");

    const now = Date.now();

    // Obtener el billing actual
    console.log("🔍 Buscando billing...");
    const billing = await ctx.db.get(args.billingId);
    if (!billing) {
      console.error("❌ Registro de cobro no encontrado:", args.billingId);
      throw new Error("Registro de cobro no encontrado");
    }
    console.log("✅ Billing encontrado:", billing._id);
    console.log("   Status actual:", billing.status);
    console.log("   Amount:", billing.amount);
    console.log("   Total amount:", billing.totalAmount);

    // Obtener el estudiante
    console.log("🔍 Buscando estudiante...");
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      console.error("❌ Estudiante no encontrado:", args.studentId);
      throw new Error("Estudiante no encontrado");
    }
    console.log("✅ Estudiante encontrado:", student._id);
    console.log("   Credit actual:", student.credit || 0);

    // 🚨 NUEVA VERIFICACIÓN: Verificar si ya existe un pago con este Payment Intent
    console.log("🔍 Verificando si ya existe un pago con este Payment Intent...");
    const existingPayment = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("stripePaymentIntentId"), args.paymentIntentId))
      .first();

    if (existingPayment) {
      console.log("⚠️ Ya existe un pago con este Payment Intent:", existingPayment._id);
      console.log("   Payment Intent ID:", args.paymentIntentId);
      console.log("   Pago existente ID:", existingPayment._id);
      console.log("   Monto existente:", existingPayment.amount);
      console.log("   Fecha existente:", new Date(existingPayment.createdAt).toISOString());
      
      // Retornar el pago existente sin crear uno nuevo
      return {
        success: true,
        paymentId: existingPayment._id,
        newStatus: billing.status, // Status actual del billing
        message: "Pago ya procesado anteriormente"
      };
    }

    console.log("✅ No existe pago previo, procediendo a crear nuevo registro");

    // Crear el registro de pago con información de Stripe
    console.log("💳 Creando registro de pago...");
    const paymentId = await ctx.db.insert("payments", {
      billingId: args.billingId,
      studentId: args.studentId,
      method: args.paymentMethod || "card", // Usar el método detectado o default a card
      amount: args.amount,
      createdBy: args.createdBy,
      stripePaymentIntentId: args.paymentIntentId,
      stripeChargeId: args.stripeChargeId,
      stripeTransferId: args.stripeTransferId,
      createdAt: now,
      updatedAt: now,
    });
    console.log("✅ Pago registrado con ID:", paymentId);

    // Actualizar el billing (misma lógica que processPayment existente)
    const previousTotalAmount = billing.totalAmount || billing.amount;
    const newTotalAmount = previousTotalAmount - args.amount;
    console.log("📊 Calculando nuevo total:");
    console.log("   Previous total:", previousTotalAmount);
    console.log("   Pago:", args.amount);
    console.log("   New total:", newTotalAmount);

    let newStatus: typeof billing.status;
    let paidAt: number | undefined;
    let creditToAdd = 0;

    if (newTotalAmount === 0) {
      newStatus = "Pago cumplido";
      paidAt = now;
      console.log("✅ Pago completado exacto");
    } else if (newTotalAmount < 0) {
      newStatus = "Pago cumplido";
      paidAt = now;
      creditToAdd = Math.abs(newTotalAmount);
      console.log("✅ Pago completado con crédito extra:", creditToAdd);
    } else {
      newStatus = "Pago parcial";
      paidAt = undefined;
      console.log("⚠️ Pago parcial, falta:", newTotalAmount);
    }

    console.log("📝 Actualizando billing...");
    await ctx.db.patch(args.billingId, {
      status: newStatus,
      totalAmount: Math.max(0, newTotalAmount),
      paidAt: paidAt,
      updatedAt: now,
    });
    console.log("✅ Billing actualizado - Nuevo status:", newStatus);

    // Actualizar el credit del estudiante
    const currentCredit = student.credit || 0;
    const newCredit = currentCredit + creditToAdd;

    if (creditToAdd > 0) {
      console.log("💰 Actualizando crédito del estudiante:");
      console.log("   Crédito anterior:", currentCredit);
      console.log("   Crédito a agregar:", creditToAdd);
      console.log("   Nuevo crédito:", newCredit);
      
      await ctx.db.patch(args.studentId, {
        credit: newCredit,
        updatedAt: now,
      });
      console.log("✅ Crédito actualizado");
    }

    console.log("✅ confirmPayment - Completado exitosamente");
    return {
      success: true,
      paymentId,
      newStatus,
    };
  },
});

// Crear un Payment Intent para pagos con tarjeta directos
export const createPaymentIntent = action({
  args: {
    billingId: v.id("billing"),
    amount: v.number(),
    schoolId: v.id("school"),
    studentId: v.id("student"),
    tutorId: v.id("user"),
    description: v.string(),
    metadata: v.optional(v.object({
      paymentType: v.string(),
      studentName: v.string(),
    })),
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

    // Crear Payment Intent con transferencia automática a la cuenta de la escuela
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(args.amount * 100), // Convertir a centavos
      currency: "mxn",
      description: args.description,
      payment_method_types: ["card"],
      transfer_data: {
        destination: school.stripeAccountId,
      },
      metadata: {
        billingId: args.billingId,
        studentId: args.studentId,
        tutorId: args.tutorId,
        schoolId: args.schoolId,
        ...(args.metadata || {}),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  },
});

export const createPaymentIntentWithSPEI = action({
  args: {
    billingId: v.id("billing"),
    amount: v.number(),
    schoolId: v.id("school"),
    studentId: v.id("student"),
    tutorId: v.id("user"),
    description: v.optional(v.string()),
    customerEmail: v.string(),
    customerName: v.string(),
  },
  handler : async (ctx, args) => {
    const school = await ctx.runQuery(internal.functions.stripeConnect.getSchoolForConnect, {
      schoolId: args.schoolId,
    });

    if (!school.stripeAccountId) {
      throw new Error("La escuela no tiene una cuenta de Stripe configurada");
    }

    if (!school.stripeOnboardingComplete) {
      throw new Error("La escuela debe completar la configuración de Stripe");
    }

    // Crear o recuperar un Customer en Stripe
    // Esto es requerido para customer_balance (SPEI)
    const customer = await stripe.customers.create({
      email: args.customerEmail,
      name: args.customerName,
      metadata: {
        studentId: args.studentId,
        tutorId: args.tutorId,
        schoolId: args.schoolId,
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(args.amount * 100),
      currency: "mxn",
      customer: customer.id,
      description: args.description || `Pago de colegiatura`,
      payment_method_types: ["customer_balance"],  // SPEI
      payment_method_options: {
        customer_balance: {
          funding_type: "bank_transfer",
          bank_transfer: {
            type: "mx_bank_transfer",  // Transferencia bancaria mexicana
          },
        },
      },
      transfer_data: {
        destination: school.stripeAccountId,
      },
      metadata: {
        billingId: args.billingId,
        studentId: args.studentId,
        tutorId: args.tutorId,
        schoolId: args.schoolId,
        customerEmail: args.customerEmail,
        customerName: args.customerName,
      },
    });

    // Para SPEI, necesitamos confirmar el Payment Intent para generar las instrucciones
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method_data: {
        type: "customer_balance",
      },
    });


    return {
      clientSecret: confirmedPaymentIntent.client_secret,
      paymentIntentId: confirmedPaymentIntent.id,
      customerId: customer.id,
      status: confirmedPaymentIntent.status,
      transferInstructions: confirmedPaymentIntent.next_action?.display_bank_transfer_instructions || null,
    };
  }
});

export const createPaymentIntentWithOXXO = action({
  args: {
    billingId: v.id("billing"),
    amount: v.number(),
    schoolId: v.id("school"),
    studentId: v.id("student"),
    tutorId: v.id("user"),
    description: v.optional(v.string()),
    customerEmail: v.string(),
    customerName: v.string(),
  },
  handler: async (ctx, args) => {
    const school = await ctx.runQuery(internal.functions.stripeConnect.getSchoolForConnect, {
      schoolId: args.schoolId,
    });

    if (!school.stripeAccountId) {
      throw new Error("La escuela no tiene una cuenta de Stripe configurada");
    }

    if (!school.stripeOnboardingComplete) {
      throw new Error("La escuela debe completar la configuración de Stripe");
    }

    // Crear o recuperar un Customer en Stripe
    const customer = await stripe.customers.create({
      email: args.customerEmail,
      name: args.customerName,
      metadata: {
        studentId: args.studentId,
        tutorId: args.tutorId,
        schoolId: args.schoolId,
      },
    });

    // Crear Payment Intent con OXXO
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(args.amount * 100), // Convertir a centavos
      currency: "mxn",
      customer: customer.id,
      description: args.description || `Pago por OXXO`,
      payment_method_types: ["oxxo"],
      transfer_data: {
        destination: school.stripeAccountId,
      },
      metadata: {
        billingId: args.billingId,
        studentId: args.studentId,
        tutorId: args.tutorId,
        schoolId: args.schoolId,
        customerEmail: args.customerEmail,
        customerName: args.customerName,
      },
    });

    // Confirmar el Payment Intent para generar el número OXXO
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method_data: {
        type: "oxxo",
        billing_details: {
          name: args.customerName,
          email: args.customerEmail,
        },
      },
    });

    // Extraer los detalles de OXXO
    const oxxoDetails = confirmedPaymentIntent.next_action?.oxxo_display_details;

    return {
      clientSecret: confirmedPaymentIntent.client_secret,
      paymentIntentId: confirmedPaymentIntent.id,
      customerId: customer.id,
      status: confirmedPaymentIntent.status,
      oxxoNumber: oxxoDetails?.number,
      expiresAt: oxxoDetails?.expires_after,
      hostedVoucherUrl: oxxoDetails?.hosted_voucher_url,
    };
  }
});

