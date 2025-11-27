"use node";

import { v } from "convex/values";
import { action} from "../../_generated/server";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
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
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
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
    metadata: v.optional(v.object({
      paymentType: v.string(),
      studentName: v.string(),
    })),
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
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
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
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
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
  handler: async (ctx, args): Promise<{
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
      const existingCustomers = await stripe.customers.list({
        email: tutor?.email || undefined,
        limit: 1,
      }, {
        stripeAccount: school.stripeAccountId,
      });

      const existingCustomer = existingCustomers.data[0];
      if (existingCustomer) {
        customer = existingCustomer;
        console.log("✅ Customer existente encontrado:", customer.id);
      } else {
        // Crear nuevo customer
        customer = await stripe.customers.create({
          name: tutor ? `${tutor.name} ${tutor.lastName || ""}` : `Tutor de ${student.name}`,
          email: tutor?.email || undefined,
          phone: tutor?.phone || undefined,
          metadata: {
            studentId: args.studentId,
            studentName: `${student.name} ${student.lastName || ""}`,
            schoolId: args.schoolId,
            tutorId: student.tutorId,
          },
        }, {
          stripeAccount: school.stripeAccountId,
        });
        console.log("✅ Nuevo Customer creado:", customer.id);
      }
    } catch (error) {
      console.error("Error al crear/buscar customer:", error);
      throw new Error("No se pudo crear el registro del cliente en Stripe");
    }

    // 2. Crear Invoice con los items
    const invoice = await stripe.invoices.create({
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
    }, {
      stripeAccount: school.stripeAccountId,
    });

    console.log("✅ Invoice creado:", invoice.id);
    console.log("   Status inicial:", invoice.status);

    // 3. Agregar item(s) al invoice
    try {
      const invoiceItem = await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: Math.round(args.amount * 100), // Convertir a centavos
        currency: "mxn",
        description: billingConfig?.type || "Pago de colegiatura",
        metadata: {
          billingConfigId: billing.billingConfigId,
          billingType: billingConfig?.type || "Colegiatura",
        },
      }, {
        stripeAccount: school.stripeAccountId,
      });

      console.log("✅ Item agregado al invoice:", invoiceItem.id);
      console.log("   Monto del item:", invoiceItem.amount / 100, "MXN");
    } catch (error) {
      console.error("❌ Error agregando item al invoice:", error);
      throw new Error(`Error agregando item: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Error finalizando invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Error marcando como pagado: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

