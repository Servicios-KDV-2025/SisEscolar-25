import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "../_generated/server";

// Obtener historial de pagos por escuela y ciclo escolar
export const getPaymentHistory = query({
  args: {
    schoolId: v.id("school"),
    schoolCycleId: v.optional(v.id("schoolCycle")),
  },
  handler: async (ctx, args) => {
    // Obtener todos los pagos
    const allPayments = await ctx.db.query("payments").collect();

    // Filtrar pagos y obtener información relacionada
    const paymentsWithDetails = await Promise.all(
      allPayments.map(async (payment) => {
        // Obtener el billing relacionado
        const billing = await ctx.db.get(payment.billingId);
        if (!billing) return null;

        // Obtener el estudiante
        const student = await ctx.db.get(payment.studentId);
        if (!student || student.schoolId !== args.schoolId) return null;

        // Si se especifica un ciclo escolar, filtrar por él
        if (args.schoolCycleId && student.schoolCycleId !== args.schoolCycleId) {
          return null;
        }

        // Obtener el grupo del estudiante
        const group = await ctx.db.get(student.groupId);

        // Obtener la configuración de billing
        const billingConfig = await ctx.db.get(billing.billingConfigId);

        // Obtener el usuario que creó el pago
        const createdByUser = await ctx.db.get(payment.createdBy);

        return {
          id: payment._id,
          paymentId: payment._id,
          tutorId: createdByUser?._id,
          studentId: student._id,
          studentName: `${student.name} ${student.lastName || ""}`,
          studentEnrollment: student.enrollment,
          studentGrade: group?.grade || "N/A",
          studentGroup: group?.name || "N/A",
          billingId: billing._id,
          billingConfigId: billing.billingConfigId,
          paymentType: billingConfig?.type || "N/A",
          billingStatus: billing.status,
          amount: payment.amount,
          method: payment.method,
          methodLabel: payment.method === "cash"
            ? (payment.stripePaymentIntentId?.startsWith("pi_") ? "OXXO" : "Efectivo")
            : payment.method === "bank_transfer"
              ? (payment.stripePaymentIntentId?.startsWith("pi_") ? "SPEI" : "Transferencia Bancaria")
              : payment.method === "card"
                ? "Tarjeta"
                : "Otro",
          billingAmount: billing.amount,
          billingDeposit: payment.amount, 
          billingRemaining: Math.max(0, (billing.totalAmount || billing.amount) - payment.amount),
          paidAt: payment.createdAt,
          createdBy: createdByUser ? `${createdByUser.name} ${createdByUser.lastName || ""}` : "N/A",
          createdAt: payment.createdAt,
          facturapiInvoiceId: payment.facturapiInvoiceId || null,
          facturapiInvoiceNumber: payment.facturapiInvoiceNumber || null,
          facturapiInvoiceStatus: payment.facturapiInvoiceStatus || null,
        };
      })
    );

    return paymentsWithDetails
      .filter((p) => p !== null)
      .sort((a, b) => b!.paidAt - a!.paidAt);
  },
});

// Obtener estadísticas de pagos
export const getPaymentStats = query({
  args: {
    schoolId: v.id("school"),
    schoolCycleId: v.optional(v.id("schoolCycle")),
  },
  handler: async (ctx, args) => {
    // Obtener todos los pagos
    const allPayments = await ctx.db.query("payments").collect();

    // Filtrar pagos por escuela y ciclo
    const filteredPayments = await Promise.all(
      allPayments.map(async (payment) => {
        const student = await ctx.db.get(payment.studentId);
        if (!student || student.schoolId !== args.schoolId) return null;

        if (args.schoolCycleId && student.schoolCycleId !== args.schoolCycleId) {
          return null;
        }

        const billing = await ctx.db.get(payment.billingId);
        return { payment, billing };
      })
    );

    const validPayments = filteredPayments.filter((p) => p !== null);

    // Calcular estadísticas
    const totalPayments = validPayments.length;
    const totalAmountCollected = validPayments.reduce(
      (sum, p) => sum + p!.payment.amount,
      0
    );

    // Contar pagos por estado de billing
    const billingStatuses = validPayments.reduce(
      (acc, p) => {
        const status = p!.billing?.status || "unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Contar pagos por método
    const paymentMethods = validPayments.reduce(
      (acc, p) => {
        const method = p!.payment.method;
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalPayments,
      totalAmountCollected,
      paidPayments: billingStatuses["Pago cumplido"] || 0,
      partialPayments: billingStatuses["Pago parcial"] || 0,
      pendingPayments: billingStatuses["Pago pendiente"] || 0,
      overduePayments: billingStatuses["Pago vencido"] || 0,
      paymentMethods,
    };
  },
});

// Obtener pagos de un estudiante específico
export const getPaymentsByStudent = query({
  args: {
    studentId: v.id("student"),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const billing = await ctx.db.get(payment.billingId);
        const billingConfig = billing ? await ctx.db.get(billing.billingConfigId) : null;
        const createdBy = await ctx.db.get(payment.createdBy);

        return {
          ...payment,
          billing,
          billingConfig,
          createdBy,
        };
      })
    );

    return paymentsWithDetails;
  },
});

// Obtener pago por ID
export const getPaymentById = query({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentId);
  },
});

// Actualizar pago con información de Facturapi
export const updatePaymentWithFacturapi = mutation({
  args: {
    paymentId: v.id("payments"),
    facturapiInvoiceId: v.string(),
    facturapiInvoiceNumber: v.string(),
    facturapiInvoiceStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      facturapiInvoiceId: args.facturapiInvoiceId,
      facturapiInvoiceNumber: args.facturapiInvoiceNumber,
      facturapiInvoiceStatus: args.facturapiInvoiceStatus,
      updatedAt: Date.now(),
    });
  },
});

// Obtener pagos por billing
export const getPaymentsByBilling = query({
  args: {
    billingId: v.id("billing"),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_billing", (q) => q.eq("billingId", args.billingId))
      .collect();

    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const student = await ctx.db.get(payment.studentId);
        const createdBy = await ctx.db.get(payment.createdBy);

        return {
          ...payment,
          student,
          createdBy,
        };
      })
    );

    return paymentsWithDetails;
  },
});

// Internal queries para acceder a la DB desde actions
export const getStudentWithTutor = internalQuery({
  args: { studentId: v.id("student") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    const tutor = await ctx.db.get(student.tutorId);
    return { student, tutor };
  },
});

export const getBillingWithConfig = internalQuery({
  args: { billingId: v.id("billing") },
  handler: async (ctx, args) => {
    const billing = await ctx.db.get(args.billingId);
    if (!billing) return null;

    const billingConfig = await ctx.db.get(billing.billingConfigId);
    return { billing, billingConfig };
  },
});

export const getPaymentByPaymentIntentIdInternal = internalQuery({
  args: { paymentIntentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("stripePaymentIntentId"), args.paymentIntentId))
      .first();
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
    paymentMethod: v.optional(v.union(v.literal("cash"), v.literal("bank_transfer"), v.literal("card"), v.literal("oxxo"), v.literal("other"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const billing = await ctx.db.get(args.billingId);

    if (!billing) {
      console.error("Registro de cobro no encontrado:", args.billingId);
      throw new Error("Registro de cobro no encontrado");
    };

    const student = await ctx.db.get(args.studentId);
    if (!student) {
      console.error("Estudiante no encontrado:", args.studentId);
      throw new Error("Estudiante no encontrado");
    }
    const existingPayment = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("stripePaymentIntentId"), args.paymentIntentId))
      .first();

    if (existingPayment) {
      console.log("Ya existe un pago con este Payment Intent:", existingPayment._id);
      return {
        success: true,
        paymentId: existingPayment._id,
        newStatus: billing.status,
        message: "Pago ya procesado anteriormente"
      };
    }
    
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

    // Preparar para generación de factura con Facturapi (marcar como pendiente)
    try {
      console.log("📄 Preparando generación de factura con Facturapi...");

      // Obtener información necesaria para verificar si se puede generar factura
      const student = await ctx.db.get(args.studentId);
      const tutor = student ? await ctx.db.get(student.tutorId) : null;

      if (student && tutor) {
        // Marcar como pendiente para generación manual por el usuario
        await ctx.db.patch(paymentId, {
          facturapiInvoiceStatus: "pending",
          updatedAt: now,
        });
        console.log("✅ Factura preparada para generación manual");
      } else {
        console.log("⚠️ Información incompleta para factura, marcando como pendiente");
        await ctx.db.patch(paymentId, {
          facturapiInvoiceStatus: "pending",
          updatedAt: now,
        });
      }
    } catch (error) {
      console.error("❌ Error preparando factura:", error);
      // No fallar el pago por errores de factura
    }

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
