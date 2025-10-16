import { v } from "convex/values";
import { query } from "../_generated/server";

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

        // Obtener la URL del archivo de factura si existe
        let invoiceUrl = null;
        if (payment.invoiceId) {
          invoiceUrl = await ctx.storage.getUrl(payment.invoiceId as any);
        }

        return {
          id: payment._id,
          paymentId: payment._id,
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
            ? (payment.stripePaymentIntentId ? "OXXO" : "Efectivo")
            : payment.method === "bank_transfer" 
              ? (payment.stripePaymentIntentId ? "SPEI" : "Transferencia Bancaria")
              : payment.method === "card" 
                ? "Tarjeta"
                : "Otro",
          billingAmount: billing.amount,
          billingDeposit: payment.amount, // El monto de este pago específico
          // Calcular el remanente correctamente
          billingRemaining: Math.max(0, (billing.totalAmount || billing.amount) - payment.amount),
          paidAt: payment.createdAt,
          createdBy: createdByUser ? `${createdByUser.name} ${createdByUser.lastName || ""}` : "N/A",
          createdAt: payment.createdAt,
          invoiceId: payment.invoiceId || null,
          invoiceUrl: invoiceUrl,
          invoiceFilename: payment.invoiceFilename || null,
          invoiceMimeType: payment.invoiceMimeType || null,
        };
      })
    );

    // Filtrar nulls y ordenar por fecha de pago (más reciente primero)
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
