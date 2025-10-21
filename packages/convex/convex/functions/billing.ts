import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";



// Obtener configuraciones de pago por escuela y ciclo
export const getPaymentConfigsBySchoolAndCycle = query({
  args: {
    schoolId: v.id("school"),
    schoolCycleId: v.id("schoolCycle"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("billingConfig")
      .withIndex("by_schoolCycle", (q) => q.eq("schoolCycleId", args.schoolCycleId))
      .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
      .filter((q) => q.neq(q.field("status"), "inactive"))
      .collect();
  },
});

// Función auxiliar para determinar si un estudiante debe tener un pago
const shouldStudentHavePayment = async (ctx: any, student: any, billingConfig: any) => {
  // Solo crear pagos si el status es "required" o "optional"
  if (billingConfig.status === "inactive") {
    return false;
  }

  switch (billingConfig.scope) {
    case "all_students":
      return true;

    case "specific_groups":
      return billingConfig.targetGroup && billingConfig.targetGroup.includes(student.groupId);

    case "specific_grades":
      if (!billingConfig.targetGrade) return false;
      // Obtener el grupo del estudiante para verificar el grado
      const group = await ctx.db.get(student.groupId);
      return group && billingConfig.targetGrade.includes(group.grade);

    case "specific_students":
      return billingConfig.targetStudent && billingConfig.targetStudent.includes(student._id);

    default:
      return false;
  }
};

export const updatePaymentsForConfig = internalMutation({
  args: {
    billingConfigId: v.id("billingConfig"),
  },
  handler: async (ctx, args) => {
    const billingConfig = await ctx.db.get(args.billingConfigId);
    if (!billingConfig) {
      throw new Error("Configuración de pago no encontrada");
    }

    if (billingConfig.status === "inactive") {
      return {
        message: "La configuración de pago está inactiva",
        paymentConfig: {
          id: billingConfig._id,
          type: billingConfig.type,
          recurrence_type: billingConfig.recurrence_type,
          scope: billingConfig.scope,
          status: billingConfig.status,
        },
        affectedStudents: [],
      };
    }

    // const existingPayments = await ctx.db
    //   .query("billing")
    //   .withIndex("by_billingConfig", (q) => q.eq("billingConfigId", args.billingConfigId))
    //   .filter((q) => q.neq(q.field("status"), "Pago cumplido"))
    //   .collect();

    let students: any[] = [];

    if (billingConfig.scope === "all_students") {
      // Todos los estudiantes del ciclo escolar
      students = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", billingConfig.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .filter((q) => q.eq(q.field("schoolCycleId"), billingConfig.schoolCycleId))
        .collect();
    } else if (billingConfig.scope === "specific_groups" && billingConfig.targetGroup) {
      // Estudiantes de grupos específicos
      const studentsPromises = billingConfig.targetGroup.map(async (groupId) => {
        return await ctx.db
          .query("student")
          .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .filter((q) => q.eq(q.field("schoolCycleId"), billingConfig.schoolCycleId))
          .collect();
      });
      const studentsArrays = await Promise.all(studentsPromises);
      students = studentsArrays.flat();
    } else if (billingConfig.scope === "specific_grades" && billingConfig.targetGrade) {
      // Estudiantes de grados específicos
      const allStudents = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", billingConfig.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .filter((q) => q.eq(q.field("schoolCycleId"), billingConfig.schoolCycleId))
        .collect();

      // Filtrar por grado
      const studentsWithGroups = await Promise.all(
        allStudents.map(async (student) => {
          const group = await ctx.db.get(student.groupId);
          return { student, group };
        })
      );

      students = studentsWithGroups
        .filter(({ group }) => group && billingConfig.targetGrade && billingConfig.targetGrade.includes(group.grade))
        .map(({ student }) => student);
    } else if (billingConfig.scope === "specific_students" && billingConfig.targetStudent) {
      // Estudiantes específicos
      const studentsPromises = billingConfig.targetStudent.map(async (studentId) => {
        return await ctx.db.get(studentId);
      });
      const studentsArray = await Promise.all(studentsPromises);
      students = studentsArray.filter(student =>
        student &&
        student.schoolId === billingConfig.schoolId &&
        student.schoolCycleId === billingConfig.schoolCycleId &&
        student.status === "active"
      );
    }

    const now = Date.now();
    const affectedStudents: any[] = [];

    for (const student of students) {

      const existingPayments = await ctx.db
        .query("billing")
        .withIndex("by_student_and_config", (q) =>
          q.eq("studentId", student._id).eq("billingConfigId", args.billingConfigId)
        )
        .filter((q) => q.neq(q.field("status"), "Pago cumplido"))
        .collect();

      for (const payment of existingPayments) {
        await ctx.db.patch(payment._id, {
          amount: billingConfig.amount,
          totalAmount: billingConfig.amount,
          updatedAt: now,
        });

        const group = await ctx.db.get(student.groupId as Id<"group">);

        affectedStudents.push({
          studentId: student._id,
          studentName: `${student.name} ${student.lastName || ""}`,
          enrollment: student.enrollment,
          groupId: student.groupId,
          group: `${group?.grade} ${group?.name}` || "No asignado",
          paymentId: payment._id,
        });
      }
    }

    const schoolCycle = await ctx.db.get(billingConfig.schoolCycleId as Id<"schoolCycle">)

    return {
      message: `Se actualizaron ${affectedStudents.length} pagos`,
      paymentConfig: {
        id: billingConfig._id,
        type: billingConfig.type,
        endDate: billingConfig.endDate != null && billingConfig.endDate
            ? new Date(billingConfig.endDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        startDate: billingConfig.startDate != null && billingConfig.startDate
            ? new Date(billingConfig.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        recurrence_type: billingConfig.recurrence_type,
        scope: billingConfig.scope,
        status: billingConfig.status,
        amount: billingConfig.amount,
        ciclo: schoolCycle?.name,
        cicloStatus: schoolCycle?.status
      },
      affectedStudents,
    };
  },
});

// Generar pagos para una configuración específica
export const generatePaymentsForConfig = internalMutation({
  args: {
    billingConfigId: v.id("billingConfig"),
  },
  handler: async (ctx, args) => {
    // Obtener la configuración de pago
    const billingConfig = await ctx.db.get(args.billingConfigId);
    if (!billingConfig) {
      throw new Error("Configuración de pago no encontrada");
    }

    // Solo procesar si el status no es "inactive"
    if (billingConfig.status === "inactive") {
      return {
        message: "La configuración de pago está inactiva",
        billingConfig: {
          id: billingConfig._id,
          type: billingConfig.type,
          recurrence_type: billingConfig.recurrence_type,
          scope: billingConfig.scope,
          status: billingConfig.status,
        },
        affectedStudents: [],
      };
    }

    // Obtener estudiantes según el alcance
    let students: any[] = [];

    if (billingConfig.scope === "all_students") {
      // Todos los estudiantes del ciclo escolar
      students = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", billingConfig.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .filter((q) => q.eq(q.field("schoolCycleId"), billingConfig.schoolCycleId))
        .collect();
    } else if (billingConfig.scope === "specific_groups" && billingConfig.targetGroup) {
      // Estudiantes de grupos específicos
      const studentsPromises = billingConfig.targetGroup.map(async (groupId) => {
        return await ctx.db
          .query("student")
          .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .filter((q) => q.eq(q.field("schoolCycleId"), billingConfig.schoolCycleId))
          .collect();
      });
      const studentsArrays = await Promise.all(studentsPromises);
      students = studentsArrays.flat();
    } else if (billingConfig.scope === "specific_grades" && billingConfig.targetGrade) {
      // Estudiantes de grados específicos
      const allStudents = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", billingConfig.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .filter((q) => q.eq(q.field("schoolCycleId"), billingConfig.schoolCycleId))
        .collect();

      // Filtrar por grado
      const studentsWithGroups = await Promise.all(
        allStudents.map(async (student) => {
          const group = await ctx.db.get(student.groupId);
          return { student, group };
        })
      );

      students = studentsWithGroups
        .filter(({ group }) => group && billingConfig.targetGrade && billingConfig.targetGrade.includes(group.grade))
        .map(({ student }) => student);
    } else if (billingConfig.scope === "specific_students" && billingConfig.targetStudent) {
      // Estudiantes específicos
      const studentsPromises = billingConfig.targetStudent.map(async (studentId) => {
        return await ctx.db.get(studentId);
      });
      const studentsArray = await Promise.all(studentsPromises);
      students = studentsArray.filter(student =>
        student &&
        student.schoolId === billingConfig.schoolId &&
        student.schoolCycleId === billingConfig.schoolCycleId &&
        student.status === "active"
      );
    }
    const now = Date.now();
    const affectedStudents: any[] = [];

    // Crear pagos para cada estudiante
    for (const student of students) {
      // Verificar si ya existe un pago para este estudiante y configuración
      const existingPayment = await ctx.db
        .query("billing")
        .withIndex("by_student_and_config", (q) =>
          q.eq("studentId", student._id).eq("billingConfigId", args.billingConfigId)
        )
        .first();

      if (!existingPayment) {
        const paymentId = await ctx.db.insert("billing", {
          studentId: student._id,
          billingConfigId: args.billingConfigId,
          status: "Pago pendiente",
          amount: billingConfig.amount,
          totalAmount: billingConfig.amount,
          createdAt: now,
          updatedAt: now,
        });

        affectedStudents.push({
          studentId: student._id,
          studentName: `${student.name} ${student.lastName || ""}`,
          enrollment: student.enrollment,
          groupId: student.groupId,
          group: `${student?.grade} ${student?.name}` || "No asignado",
          paymentId,
        });
      }
    }

    const schoolCycle = await ctx.db.get(billingConfig.schoolCycleId as Id<"schoolCycle">)

    return {
      message: `Se generaron ${affectedStudents.length} pagos`,
      paymentConfig: {
        id: billingConfig._id,
        type: billingConfig.type,
        endDate: billingConfig.endDate,
        startDate: billingConfig.startDate,
        recurrence_type: billingConfig.recurrence_type,
        scope: billingConfig.scope,
        status: billingConfig.status,
        amount: billingConfig.amount,
        ciclo: schoolCycle?.name,
        cicloStatus: schoolCycle?.status
      },
      affectedStudents,
    };
  },
});

// Generar pagos para todos los estudiantes activos en un ciclo escolar 
export const generatePaymentsForActiveStudents = mutation({
  args: {
    billingConfigId: v.id("billingConfig"),
  },
  handler: async (ctx, args) => {
    // Obtener la configuración de pago
    const billingConfig = await ctx.db.get(args.billingConfigId);
    if (!billingConfig) {
      throw new Error("Configuración de pago no encontrada");
    }

    // Solo procesar si el status no es "inactive"
    if (billingConfig.status === "inactive") {
      return {
        message: "La configuración de pago está inactiva",
        billingConfig: {
          id: billingConfig._id,
          type: billingConfig.type,
          recurrence_type: billingConfig.recurrence_type,
          scope: billingConfig.scope,
          status: billingConfig.status,
        },
        createdPayments: [],
      };
    }

    // Obtener todos los estudiantes activos en el mismo ciclo escolar
    const activeStudents = await ctx.db
      .query("student")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", billingConfig.schoolId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .filter((q) => q.eq(q.field("schoolCycleId"), billingConfig.schoolCycleId))
      .collect();

    const now = Date.now();
    const createdPayments: any[] = [];

    // Crear un pago para cada estudiante activo que cumpla los criterios
    for (const student of activeStudents) {
      // Verificar si el estudiante debe tener este pago
      const shouldHavePayment = await shouldStudentHavePayment(ctx, student, billingConfig);

      if (shouldHavePayment) {
        // Verificar si ya existe un pago para este estudiante y configuración
        const existingPayment = await ctx.db
          .query("billing")
          .withIndex("by_student_and_config", (q) =>
            q.eq("studentId", student._id).eq("billingConfigId", args.billingConfigId)
          )
          .first();

        if (!existingPayment) {
          // Crear el pago
          const paymentId = await ctx.db.insert("billing", {
            studentId: student._id,
            billingConfigId: args.billingConfigId,
            status: "Pago pendiente",
            amount: billingConfig.amount,
            totalAmount: billingConfig.amount, // Inicialmente es igual al monto total
            createdAt: now,
            updatedAt: now,
          });

          // No se actualiza el credit al generar pagos, solo al procesarlos
          createdPayments.push({
            studentId: student._id,
            studentName: `${student.name} ${student.lastName || ""}`,
            enrollment: student.enrollment,
            paymentId,
          });
        }
      }
    }

    return {
      message: `Se generaron ${createdPayments.length} pagos`,
      paymentConfig: {
        id: billingConfig._id,
        type: billingConfig.type,
        recurrence_type: billingConfig.recurrence_type,
        scope: billingConfig.scope,
        status: billingConfig.status,
        amount: billingConfig.amount,
        endDate: billingConfig.endDate,
      },
      createdPayments,
    };
  },
});

// Obtener pagos por estudiante
export const getPaymentsByStudent = query({
  args: {
    studentId: v.id("student"),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("billing")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Obtener información de la configuración de pago para cada pago
    const paymentsWithConfig = await Promise.all(
      payments.map(async (payment) => {
        const config = await ctx.db.get(payment.billingConfigId);
        return {
          ...payment,
          paymentConfig: config,
        };
      })
    );

    return paymentsWithConfig;
  },
});

// Obtener pagos por configuración de pago
export const getPaymentsByConfig = query({
  args: {
    billingConfigId: v.id("billingConfig"),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("billing")
      .withIndex("by_billingConfig", (q) => q.eq("billingConfigId", args.billingConfigId))
      .collect();

    // Obtener información del estudiante para cada pago
    const paymentsWithStudent = await Promise.all(
      payments.map(async (payment) => {
        const student = await ctx.db.get(payment.studentId);
        return {
          ...payment,
          student: student,
        };
      })
    );

    return paymentsWithStudent;
  },
});

// Actualizar estado de pago
export const updatePaymentStatus = mutation({
  args: {
    paymentId: v.id("billing"),
    status: v.union(
      v.literal("Pago pendiente"),
      v.literal("Pago cumplido"),
      v.literal("Pago vencido"),
      v.literal("Pago parcial"),
      v.literal("Pago retrasado")
    ),
    paidAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.patch(args.paymentId, {
      status: args.status,
      paidAt: args.paidAt || (args.status === "Pago cumplido" ? now : undefined),
      updatedAt: now,
    });
  },
});

// Obtener estadísticas de pagos por configuración
export const getPaymentStats = query({
  args: {
    billingConfigId: v.id("billingConfig"),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("billing")
      .withIndex("by_billingConfig", (q) => q.eq("billingConfigId", args.billingConfigId))
      .collect();

    const stats = {
      total: payments.length,
      pending: payments.filter(p => p.status === "Pago pendiente").length,
      completed: payments.filter(p => p.status === "Pago cumplido").length,
      overdue: payments.filter(p => p.status === "Pago vencido").length,
      partial: payments.filter(p => p.status === "Pago parcial").length,
      delayed: payments.filter(p => p.status === "Pago retrasado").length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      collectedAmount: payments
        .filter(p => p.status === "Pago cumplido")
        .reduce((sum, p) => sum + p.amount, 0),
    };

    return stats;
  },
});

// Marcar pagos vencidos
export const markOverduePayments = mutation({
  args: {
    billingConfigId: v.id("billingConfig"),
  },
  handler: async (ctx, args) => {
    const billingConfig = await ctx.db.get(args.billingConfigId);
    if (!billingConfig) {
      throw new Error("Configuración de pago no encontrada");
    }

    const now = Date.now();
    const overduePayments = await ctx.db
      .query("billing")
      .withIndex("by_billingConfig", (q) => q.eq("billingConfigId", args.billingConfigId))
      .filter((q) => q.eq(q.field("status"), "Pago pendiente"))
      .collect();

    let updatedCount = 0;

    for (const payment of overduePayments) {
      if (now > billingConfig.endDate) {
        await ctx.db.patch(payment._id, {
          status: "Pago vencido",
          updatedAt: now,
        });
        updatedCount++;
      }
    }

    return {
      message: `Se marcaron ${updatedCount} pagos como vencidos`,
      updatedCount,
    };
  },
});

// Obtener datos completos para la página de pagos
export const getPaymentsPageData = query({
  args: {
    schoolId: v.id("school"),
    schoolCycleId: v.optional(v.id("schoolCycle")),
  },
  handler: async (ctx, args) => {
    // Obtener el ciclo escolar activo si no se especifica uno
    let targetCycleId = args.schoolCycleId;
    if (!targetCycleId) {
      const activeCycle = await ctx.db
        .query("schoolCycle")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (!activeCycle) {
        return { students: [], schoolCycle: null };
      }
      targetCycleId = activeCycle._id;
    }

    // Obtener el ciclo escolar
    const schoolCycle = await ctx.db.get(targetCycleId);
    if (!schoolCycle) {
      return { students: [], schoolCycle: null };
    }

    // Obtener todos los estudiantes del ciclo escolar
    const students = await ctx.db
      .query("student")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("schoolCycleId"), targetCycleId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Obtener información completa de cada estudiante con sus pagos
    const studentsWithPayments = await Promise.all(
      students.map(async (student) => {
        // Obtener el grupo del estudiante
        const group = await ctx.db.get(student.groupId);

        // Obtener el tutor del estudiante
        const tutor = await ctx.db.get(student.tutorId);

        // Obtener todos los pagos del estudiante
        const payments = await ctx.db
          .query("billing")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .collect();

        // Obtener información de configuración de pago para cada pago
        const paymentsWithConfig = await Promise.all(
          payments.map(async (payment) => {
            const config = await ctx.db.get(payment.billingConfigId);
            return {
              ...payment,
              config: config,
            };
          })
        );

        // Calcular días de retraso para cada pago
        const now = Date.now();
        const paymentsWithLateDays = paymentsWithConfig.map(payment => {

          let dueDate: number;

          if (payment.config?.endDate && payment.config.endDate > 0) {
            dueDate = payment.config.endDate;
          } else if (payment.config?.startDate && payment.config.startDate > 0) {
            // Si no hay endDate válida, usar startDate + 30 días
            dueDate = (payment.config.startDate) + (30 * 24 * 60 * 60 * 1000);
          } else {
            // Si no hay fechas válidas en la configuración, usar createdAt del pago + 30 días
            dueDate = payment.createdAt + (30 * 24 * 60 * 60 * 1000);
          }

          const daysLate = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));
          return {
            ...payment,
            daysLate,
            dueDate, // Agregar la fecha de vencimiento calculada
          };
        });

        // Determinar el estado general del estudiante
        let studentStatus: "al-dia" | "retrasado" | "moroso" = "al-dia";
        const unpaidPayments = paymentsWithLateDays.filter(p => p.status !== "Pago cumplido");

        if (unpaidPayments.length > 0) {
          const maxDaysLate = Math.max(...unpaidPayments.map(p => p.daysLate));
          if (maxDaysLate > 30) {
            studentStatus = "moroso";
          } else if (maxDaysLate > 0) {
            studentStatus = "retrasado";
          }
        }

        return {
          id: student._id,
          nombre: `${student.lastName} ${student.name || ""}`,
          grado: group?.grade || "N/A",
          grupo: group?.name || "N/A",
          matricula: student.enrollment,
          padre: tutor ? `${tutor.lastName} ${tutor.name || ""}` : "N/A",
          tutorId: student.tutorId,
          telefono: tutor?.phone || "N/A",
          metodoPago: "N/A", // Por defecto, se puede personalizar
          fechaVencimiento: paymentsWithLateDays.length > 0 && paymentsWithLateDays[0]
            ? new Date(paymentsWithLateDays[0].dueDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          montoColegiatura: paymentsWithLateDays.filter((p) => p.status !== "Pago cumplido").reduce((sum, p) => {
            // totalAmount ahora ES el monto restante por pagar
            const montoPendiente = p.totalAmount || p.amount;
            return sum + montoPendiente;
          }, 0),
          diasRetraso: Math.max(...paymentsWithLateDays.filter((p) => p.status !== "Pago cumplido").map(p => p.daysLate), 0),
          estado: studentStatus,
          schoolCycleId: student.schoolCycleId,
          tipo: (paymentsWithLateDays.length > 0 && paymentsWithLateDays[0]
            ? paymentsWithLateDays[0].config?.type || "Colegiatura"
            : "Colegiatura") as "Inscripciones" | "Colegiatura",
          credit: student.credit || 0,

          pagos: paymentsWithLateDays.map(payment => {
            // totalAmount ES el monto restante por pagar
            const montoPendiente = payment.totalAmount || payment.amount;
            const montoPagado = payment.amount - montoPendiente; // Lo pagado = total - restante
            return {
              id: payment._id,
              tipo: payment.config?.type || "Pago",
              statusBilling: payment.config?.status,
              amount: payment.amount,
              totalAmount: payment.totalAmount,
              endDate: new Date(payment.config?.endDate ?? 0).toISOString().split("T")[0],
              startDate: new Date(payment.config?.startDate ?? 0).toISOString().split("T")[0],
              totalDiscount: payment.totalDiscount || 0,
              lateFeeRuleId: payment.lateFeeRuleId,
              lateFee: payment.lateFee || 0,
              paidAt: new Date(payment.paidAt ?? 0).toISOString().split("T")[0],
              appliedDiscounts: payment.appliedDiscounts,
              fechaVencimiento: new Date(payment.dueDate).toISOString().split('T')[0],
              estado: (payment.status === "Pago cumplido" ? "Pagado" :
                payment.status === "Pago pendiente" ? "Pendiente" :
                  payment.status === "Pago retrasado" ? "Retrasado" :
                    payment.status === "Pago parcial" ? "Parcial" : "Vencido") as "Pendiente" | "Vencido" | "Pagado",
              diasRetraso: payment.daysLate,

            };
          }),
        };
      })
    );

    return {
      students: studentsWithPayments,
      schoolCycle: {
        id: schoolCycle._id,
        name: schoolCycle.name,
        startDate: new Date(schoolCycle.startDate).toISOString().split('T')[0],
        endDate: new Date(schoolCycle.endDate).toISOString().split('T')[0],
        isActive: schoolCycle.status === "active",
      },
    };
  },
});

// Procesar un pago
export const processPayment = mutation({
  args: {
    billingId: v.id("billing"),
    tutorId: v.id("user"),
    studentId: v.id("student"),
    method: v.union(
      v.literal("cash"),
      v.literal("bank_transfer"),
      v.literal("card"),
      v.literal("other")
    ),
    amount: v.number(),
    createdBy: v.id("user"),
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

    // Crear el registro de pago
    const paymentId = await ctx.db.insert("payments", {
      billingId: args.billingId,
      studentId: args.studentId,
      method: args.method,
      amount: args.amount,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // totalAmount es el monto RESTANTE por pagar, no lo acumulado
    const previousTotalAmount = billing.totalAmount || billing.amount; // Si es nuevo, usar amount
    const newTotalAmount = previousTotalAmount - args.amount; // Restar el pago

    let newStatus: typeof billing.status;
    let paidAt: number | undefined;
    let creditToAdd = 0;

    if (newTotalAmount === 0) {
      // Pago exacto - se completó el cobro
      newStatus = "Pago cumplido";
      paidAt = now;
    } else if (newTotalAmount < 0) {
      // Pago superior al monto requerido - se pagó de más
      newStatus = "Pago cumplido";
      paidAt = now;
      creditToAdd = Math.abs(newTotalAmount); // El sobrante se convierte en crédito positivo
    } else {
      // Pago parcial - aún falta por pagar
      newStatus = "Pago parcial";
      paidAt = undefined;
    }

    // Actualizar el billing
    await ctx.db.patch(args.billingId, {
      status: newStatus,
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
      billing: {
        id: billing._id,
        previousStatus: billing.status,
        newStatus: newStatus,
        previousTotalAmount: previousTotalAmount,
        newTotalAmount: Math.max(0, newTotalAmount),
        amount: billing.amount,
        remaining: Math.max(0, newTotalAmount), // Monto que aún falta por pagar
        overpayment: creditToAdd, // Monto pagado de más
      },
      student: {
        id: student._id,
        previousCredit: currentCredit,
        newCredit: newCredit,
        paymentAmount: args.amount,
        creditAdded: creditToAdd,
      },
    };
  },
});