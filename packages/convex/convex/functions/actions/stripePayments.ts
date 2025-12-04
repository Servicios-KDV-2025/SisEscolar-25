"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { api, internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import {
  amountToCents,
  buildMetadata,
  calcFee,
  createAndConfirmPaymentIntent,
  createStripeCustomer,
  validateSchool,
} from "../../utils/stripeHelpers";
import { sendPaymentSuccessEmail } from "../../http";

/**
 * Crea una sesión de Stripe Checkout para pagos únicos.
 *
 * Valida que la escuela tenga una cuenta conectada, configurada y que su onboarding esté completo.
 *
 * @returns Un objeto con el ID de la sesión y la URL para redirigir al cliente.
 */
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
    customerEmail: v.string(),
  },
  handler: async (ctx, args): Promise<{ sessionId: string; url: string | null }> => {
    const school = await validateSchool(ctx, args.schoolId);

    const session = await stripe.checkout.sessions.create(
      {
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
              unit_amount: amountToCents(args.amount),
            },
            quantity: 1,
          },
        ],
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        metadata: {
          billingId: args.billingId,
          studentId: args.studentId,
          tutorId: args.tutorId,
          schoolId: args.schoolId,
        },
        customer_email: args.customerEmail,
        payment_intent_data: {
          application_fee_amount: calcFee(args.amount),
          metadata: {
            billingId: args.billingId,
            studentId: args.studentId,
            tutorId: args.tutorId,
            schoolId: args.schoolId,
            studentName: args.studentName,
            paymentType: args.paymentType,
          },
        },
      },
      {
        stripeAccount: school.stripeAccountId,
      }
    );

    return {
      sessionId: session.id,
      url: session.url,
    };
  },
});

/**
 * Crea un PaymentIntent SPEI usando Stripe Connect, genera las instrucciones
 * bancarias y devuelve el client_secret para el frontend.
 *
 * Flujo:
 * 1. Validar que la escuela tenga Stripe Connect configurado.
 * 2. Crear un Customer obligatorio para SPEI.
 * 3. Crear PaymentIntent con `customer_balance`.
 * 4. Se confirma el PaymentIntent para generar instrucciones de la transferencia SPEI.
 *
 * @returns Información esencial del PaymentIntent SPEI:
 * - clientSecret
 * - paymentIntentId
 * - customerId
 * - status
 * - transferInstructions (instrucciones SPEI)
 */
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

  handler: async (ctx, args) => {
    const school = await validateSchool(ctx, args.schoolId);
    const customer = await createStripeCustomer(args, school.stripeAccountId);

    const confirmed = await createAndConfirmPaymentIntent(
      school.stripeAccountId,
      {
        amount: amountToCents(args.amount),
        currency: "mxn",
        customer: customer.id,
        description: args.description ?? "Pago con SPEI",
        payment_method_types: ["customer_balance"],
        payment_method_options: {
          customer_balance: {
            funding_type: "bank_transfer",
            bank_transfer: { type: "mx_bank_transfer" },
          },
        },
        application_fee_amount: calcFee(args.amount),
        metadata: buildMetadata(args),
      },
      {
        payment_method_data: { type: "customer_balance" },
      }
    );

    return {
      clientSecret: confirmed.client_secret,
      paymentIntentId: confirmed.id,
      customerId: customer.id,
      status: confirmed.status,
      transferInstructions: confirmed.next_action?.display_bank_transfer_instructions ?? null,
    };
  },
});

/**
 * Crea un PaymentIntent para pagos en OXXO usando Stripe Connect.
 * Genera el número de referencia y voucher URL.
 *
 * Flujo:
 * 1. Validar escuela.
 * 2. Crear Customer.
 * 3. Crear PaymentIntent con método OXXO.
 * 4. Se confirma el PaymentIntent para obtener el número OXXO.
 *
 * @returns Datos útiles para mostrar al usuario:
 * - clientSecret
 * - paymentIntentId
 * - customerId
 * - status
 * - oxxoNumber (número de referencia)
 * - expiresAt (fecha de expiración)
 * - hostedVoucherUrl (voucher imprimible)
 */
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
    const school = await validateSchool(ctx, args.schoolId);
    const customer = await createStripeCustomer(args, school.stripeAccountId);

    const confirmed = await createAndConfirmPaymentIntent(
      school.stripeAccountId,
      {
        amount: amountToCents(args.amount),
        currency: "mxn",
        customer: customer.id,
        description: args.description ?? "Pago por OXXO",
        payment_method_types: ["oxxo"],
        application_fee_amount: calcFee(args.amount),
        metadata: buildMetadata(args),
      },
      {
        payment_method_data: {
          type: "oxxo",
          billing_details: {
            name: args.customerName,
            email: args.customerEmail,
          },
        },
      }
    );

    const oxxo = confirmed.next_action?.oxxo_display_details;

    return {
      clientSecret: confirmed.client_secret,
      paymentIntentId: confirmed.id,
      customerId: customer.id,
      status: confirmed.status,
      oxxoNumber: oxxo?.number,
      expiresAt: oxxo?.expires_after,
      hostedVoucherUrl: oxxo?.hosted_voucher_url,
    };
  },
});

// Registrar pago en efectivo usando Stripe Invoices (sin comisión)
export const registerCashPaymentWithInvoice = action({
  args: {
    billingId: v.id("billing"),
    amount: v.number(),
    schoolId: v.id("school"),
    studentId: v.id("student"),
    createdBy: v.id("user"),
    receiptNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    paymentId: Id<"payments">;
    stripeInvoiceId: string;
    receiptNumber: string;
    invoiceUrl: string | null;
    newStatus: "Pago pendiente" | "Pago cumplido" | "Pago vencido" | "Pago parcial" | "Pago retrasado";
    message: string;
  }> => {
    console.log("💵 registerCashPaymentWithInvoice - Iniciando...");

    // Obtener la escuela y su cuenta conectada
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
      schoolId: args.schoolId,
    });

    if (!school.stripeAccountId) {
      throw new Error("La escuela no tiene una cuenta de Stripe configurada");
    }

    if (!school.stripeOnboardingComplete) {
      throw new Error("La escuela debe completar la configuración de Stripe");
    }

    // Obtener información del estudiante y tutor
    const studentData = await ctx.runQuery(internal.functions.payments.getStudentWithTutor, {
      studentId: args.studentId,
    });
    if (!studentData) {
      throw new Error("Estudiante no encontrado");
    }
    const { student, tutor } = studentData;

    // Obtener información del billing y config
    const billingData = await ctx.runQuery(internal.functions.payments.getBillingWithConfig, {
      billingId: args.billingId,
    });
    if (!billingData) {
      throw new Error("Billing no encontrado");
    }
    const { billing, billingConfig } = billingData;

    const receiptNumber = args.receiptNumber || `REC-${Date.now()}-${args.studentId.substring(0, 6)}`;

    console.log("📄 Creando Invoice en Stripe...");

    // 1. Crear o buscar Customer en Stripe
    let customer: Stripe.Customer;
    try {
      // Buscar si ya existe un customer con este email
      const existingCustomers = await stripe.customers.list(
        {
          email: tutor?.email || undefined,
          limit: 1,
        },
        {
          stripeAccount: school.stripeAccountId,
        }
      );

      const existingCustomer = existingCustomers.data[0];
      if (existingCustomer) {
        customer = existingCustomer;
        console.log("✅ Customer existente encontrado:", customer.id);
      } else {
        // Crear nuevo customer
        customer = await stripe.customers.create(
          {
            name: tutor ? `${tutor.name} ${tutor.lastName || ""}` : `Tutor de ${student.name}`,
            email: tutor?.email || undefined,
            phone: tutor?.phone || undefined,
            metadata: {
              studentId: args.studentId,
              studentName: `${student.name} ${student.lastName || ""}`,
              schoolId: args.schoolId,
              tutorId: student.tutorId,
            },
          },
          {
            stripeAccount: school.stripeAccountId,
          }
        );
        console.log("✅ Nuevo Customer creado:", customer.id);
      }
    } catch (error) {
      console.error("Error al crear/buscar customer:", error);
      throw new Error("No se pudo crear el registro del cliente en Stripe");
    }

    // 2. Crear Invoice con los items
    const invoice = await stripe.invoices.create(
      {
        customer: customer.id,
        collection_method: "send_invoice", // No cobrar automáticamente
        days_until_due: 0, // Ya está pagado
        auto_advance: false, // Control manual
        description: `${billingConfig?.type || "Pago"} - ${student.name} ${student.lastName || ""}`,
        metadata: {
          billingId: args.billingId,
          studentId: args.studentId,
          schoolId: args.schoolId,
          paymentMethod: "cash",
          receiptNumber: receiptNumber,
          processedBy: args.createdBy,
          notes: args.notes || "",
        },
        footer: `Recibo: ${receiptNumber}\nPago recibido en efectivo\n${args.notes || ""}`,
      },
      {
        stripeAccount: school.stripeAccountId,
      }
    );

    console.log("✅ Invoice creado:", invoice.id);
    console.log("   Status inicial:", invoice.status);

    // 3. Agregar item(s) al invoice
    try {
      const invoiceItem = await stripe.invoiceItems.create(
        {
          customer: customer.id,
          invoice: invoice.id,
          amount: Math.round(args.amount * 100), // Convertir a centavos
          currency: "mxn",
          description: billingConfig?.type || "Pago de colegiatura",
          metadata: {
            billingConfigId: billing.billingConfigId,
            billingType: billingConfig?.type || "Colegiatura",
          },
        },
        {
          stripeAccount: school.stripeAccountId,
        }
      );

      console.log("✅ Item agregado al invoice:", invoiceItem.id);
      console.log("   Monto del item:", invoiceItem.amount / 100, "MXN");
    } catch (error) {
      console.error("❌ Error agregando item al invoice:", error);
      throw new Error(`Error agregando item: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Verificar invoice antes de finalizar
    const invoiceBeforeFinalize = await stripe.invoices.retrieve(invoice.id, {
      stripeAccount: school.stripeAccountId,
    });
    console.log("📋 Invoice antes de finalizar:");
    console.log("   Total:", invoiceBeforeFinalize.total / 100, "MXN");
    console.log("   Status:", invoiceBeforeFinalize.status);

    // 4. Finalizar el invoice
    let finalizedInvoice;
    try {
      finalizedInvoice = await stripe.invoices.finalizeInvoice(
        invoice.id,
        {
          auto_advance: false,
        },
        {
          stripeAccount: school.stripeAccountId,
        }
      );

      console.log("✅ Invoice finalizado");
      console.log("   Status después de finalizar:", finalizedInvoice.status);
      console.log("   Total final:", finalizedInvoice.total / 100, "MXN");
    } catch (error) {
      console.error("❌ Error finalizando invoice:", error);
      throw new Error(`Error finalizando invoice: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // 5. Marcar como pagado (CLAVE: paid_out_of_band = SIN COMISIÓN)
    let paidInvoice;
    try {
      paidInvoice = await stripe.invoices.pay(
        invoice.id,
        {
          paid_out_of_band: true, // ⭐ Esto evita la comisión
        },
        {
          stripeAccount: school.stripeAccountId,
        }
      );

      console.log("✅ Invoice marcado como pagado (sin comisión)");
      console.log("   Status final:", paidInvoice.status);
      console.log("   Invoice URL:", paidInvoice.hosted_invoice_url);
    } catch (error) {
      console.error("❌ Error marcando invoice como pagado:", error);
      console.error("   Invoice ID:", invoice.id);
      console.error("   Status actual:", finalizedInvoice.status);
      throw new Error(`Error marcando como pagado: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // 6. Registrar en la base de datos
    const result = await ctx.runMutation(internal.functions.payments.confirmPayment, {
      paymentIntentId: paidInvoice.id, // Usar el invoice ID
      billingId: args.billingId,
      studentId: args.studentId,
      amount: args.amount,
      createdBy: args.createdBy,
      paymentMethod: "cash",
      // Note: Invoices paid_out_of_band no generan charge en Stripe
    });

    console.log("✅ Pago registrado en base de datos:", result.paymentId);

    // Verificar estado final del invoice en Stripe
    const finalInvoiceCheck = await stripe.invoices.retrieve(paidInvoice.id, {
      stripeAccount: school.stripeAccountId,
    });
    console.log("🔍 Estado FINAL del invoice en Stripe:");
    console.log("   ID:", finalInvoiceCheck.id);
    console.log("   Status:", finalInvoiceCheck.status);
    console.log("   Amount paid:", finalInvoiceCheck.amount_paid / 100, "MXN");
    console.log("   URL:", finalInvoiceCheck.hosted_invoice_url);

    return {
      success: true,
      paymentId: result.paymentId,
      stripeInvoiceId: paidInvoice.id,
      receiptNumber: receiptNumber,
      invoiceUrl: paidInvoice.hosted_invoice_url || null,
      newStatus: result.newStatus,
      message: "Pago en efectivo registrado exitosamente en Stripe (sin comisión)",
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
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
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

// Crear un Payment Intent para pagos con tarjeta directos
export const createPaymentIntent = action({
  args: {
    billingId: v.id("billing"),
    amount: v.number(),
    schoolId: v.id("school"),
    studentId: v.id("student"),
    tutorId: v.id("user"),
    description: v.string(),
    metadata: v.optional(
      v.object({
        paymentType: v.string(),
        studentName: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Obtener la escuela y su cuenta conectada
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
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

/**
 * Orquesta el procesamiento de un pago en efectivo y la notificación por correo. Ejecuta
 * la mutación transaccional y, tras confirmar el resultado, envía el correo al tutor.
 */
export const processPaymentAction = action({
  args: {
    schoolId: v.id("school"),
    billingId: v.id("billing"),
    tutorId: v.id("user"),
    studentId: v.id("student"),
    method: v.union(v.literal("cash"), v.literal("bank_transfer"), v.literal("card"), v.literal("other")),
    amount: v.number(),
    createdBy: v.id("user"),
  },

  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    paymentId: Id<"payments">;
    billing: {
      id: Id<"billing">;
      previousStatus: string;
      newStatus: string;
      previousTotalAmount: number;
      newTotalAmount: number;
      amount: number;
      remaining: number;
      overpayment: number;
    };
    student: {
      id: Id<"student">;
      previousCredit: number;
      newCredit: number;
      paymentAmount: number;
      creditAdded: number;
    };
  }> => {
    const result = await ctx.runMutation(internal.functions.billing.processPayment, args);

    try {
      await sendPaymentSuccessEmail(ctx, result.metadata, result.payment, args.amount, args.method);
    } catch (emailError) {
      console.error("Error enviando correo con recibo:", emailError);
    }

    return {
      success: result.success,
      paymentId: result.payment._id,
      billing: result.billing,
      student: result.student,
    };
  },
});
