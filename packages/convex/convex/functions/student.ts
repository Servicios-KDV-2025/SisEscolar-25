// convex/student.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// CREATE
export const createStudent = mutation({
  args: {
    schoolId: v.id("school"),
    groupId: v.id("group"),
    tutorId: v.id("user"),
    enrollment: v.string(),
    schoolCycleId:v.id("schoolCycle"), // Agregar schoolCycleId
    name: v.string(),
    lastName: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    admissionDate: v.optional(v.number()),
    imgUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    // Validar matrícula única por escuela
    const existingStudent = await ctx.db
      .query("student")
      .withIndex("by_schoolId_and_enrollment", (q) =>
        q.eq("schoolId", args.schoolId).eq("enrollment", args.enrollment)
      )
      .unique();

    if (existingStudent) {
      throw new Error(
        "Ya existe un estudiante con esta matrícula en la escuela."
      );
    }

    // Insertar el nuevo estudiante con datos de auditoría
    const now = Date.now();
    const studentId = await ctx.db.insert("student", {
      ...args,
      status: args.status || "active",
      balance: 0, // Inicializar balance en 0
      createdAt: now,
      updatedAt: now,
    });

    // Generar pagos automáticamente si tiene schoolCycleId
    let paymentsCreated = [];
    if (args.schoolCycleId) {
      try {
        // Obtener todas las configuraciones de pago activas para su escuela y ciclo
        const paymentConfigs = await ctx.db
          .query("billingConfig")
          .withIndex("by_schoolCycle", (q) => q.eq("schoolCycleId", args.schoolCycleId))
          .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
          .filter((q) => q.neq(q.field("status"), "inactive")) // Solo configuraciones que no esten inactivas
          .collect();

        let totalDebt = 0;

        // Crear pagos para cada configuración que aplique al estudiante
        for (const config of paymentConfigs) {
          let shouldCreatePayment = false;

          // Verificar si la configuración aplica a este estudiante
          if (config.scope === "all_students") {
            shouldCreatePayment = true;
          } else if (config.scope === "specific_groups" && config.targetGroup) {
            shouldCreatePayment = config.targetGroup.includes(args.groupId);
          } else if (config.scope === "specific_grades" && config.targetGrade) {
            // Obtener el grupo para verificar el grado
            const group = await ctx.db.get(args.groupId);
            shouldCreatePayment = !!(group && config.targetGrade.includes(group.grade));
          } else if (config.scope === "specific_students" && config.targetStudent) {
            // Para estudiantes específicos, necesitaríamos el ID del estudiante pero pues no existe asi que pues nomas no lo ponemos jajajja
            shouldCreatePayment = false;
          }

          if (shouldCreatePayment) {
            // Verificar si ya existe un pago para este estudiante y configuración
            const existingPayment = await ctx.db
              .query("billing")
              .withIndex("by_student_and_config", (q) => 
                q.eq("studentId", studentId).eq("billingConfigId", config._id)
              )
              .first();

            if (!existingPayment) {
              const paymentId = await ctx.db.insert("billing", {
                studentId: studentId,
                billingConfigId: config._id,
                status: "Pago pendiente",
                amount: config.amount,
                createdAt: now,
                updatedAt: now,
              });

              // SOLO sumar al balance si el status es "required"
              if (config.status === "required") {
                totalDebt += config.amount;
              }

              paymentsCreated.push({
                paymentId,
                configName: `${config.type} - ${config.recurrence_type}`,
                amount: config.amount,
                status: config.status,
                balanceUpdated: config.status === "required",
              });
            }
          }
        }

        // Actualizar el balance del estudiante SOLO si hay deuda requerida
        if (totalDebt > 0) {
          await ctx.db.patch(studentId, {
            balance: -totalDebt, // Negativo porque es deuda
            updatedAt: now,
          });
        }
      } catch (error) {
        console.error("Error creando pagos para el estudiante:", error);
      }
    }

    return {
      studentId,
      student: {
        id: studentId,
        name: `${args.name} ${args.lastName || ""}`,
        enrollment: args.enrollment,
        schoolCycleId: args.schoolCycleId,
      },
      paymentsCreated: paymentsCreated.length,
      payments: paymentsCreated,
    };
  },
});

// READ (uno por ID)
export const getStudentById = query({
  args: { id: v.id("student") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
// R: Listar y filtrar estudiantes
// export const listStudentsWithFilters = query({
//   args: {
//     schoolId: v.id("school"),
//     groupId: v.optional(v.id("group")),
//     tutorId: v.optional(v.id("user")),
//     status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
//   },
//   handler: async (ctx, args) => {
//     let studentsQuery = ctx.db
//       .query("student")
//       .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId));

//     if (args.groupId) {
//       studentsQuery = studentsQuery.filter((q)=> q.eq("groupId", args.groupId))
//     }
//     if (args.tutorId) {
//       studentsQuery = studentsQuery.filter((q) => q.eq("tutorId", args.tutorId));
//     }
//     if (args.status) {
//       studentsQuery = studentsQuery.filter((q) => q.eq("status", args.status));
//     }

//     return await studentsQuery.collect();
//   },
// });

// READ (todos por escuela)
export const listStudentsBySchool = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("student")
      .withIndex("by_schoolId_and_enrollment", (q) =>
        q.eq("schoolId", args.schoolId)
      )
      .collect();
  },
});

// READ (Por grupo)
export const getStudentsByGroup = query({
  args: { groupId: v.id("group") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("student")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

//Actualizar los datos de un estudiante.
export const updateStudent = mutation({
  args: {
    studentId: v.id("student"),
    patch: v.object({
      name: v.optional(v.string()),
      lastName: v.optional(v.string()),
      enrollment: v.optional(v.string()),
      groupId: v.optional(v.id("group")),
      tutorId: v.optional(v.id("user")),
      birthDate: v.optional(v.number()),
      admissionDate: v.optional(v.number()),
      imgUrl: v.optional(v.string()),
      status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
      schoolCycleId: v.optional(v.id("schoolCycle")),
    }),
  },
  handler: async (ctx, args) => {
    const { studentId, patch } = args;

    if (patch.enrollment) {
      // Obtener el estudiante actual para verificar su escuela
      const currentStudent = await ctx.db.get(studentId);
      if (!currentStudent) {
        throw new Error("Estudiante no encontrado.");
      }

      // Verificar si ya existe otro estudiante con esa matrícula en la misma escuela
      const existingStudent = await ctx.db
        .query("student")
        .withIndex("by_schoolId_and_enrollment", (q) =>
          q.eq("schoolId", currentStudent.schoolId).eq("enrollment", patch.enrollment!)
        )
        .unique();

      // Si existe otro estudiante con esa matrícula (y no es el mismo estudiante)
      if (existingStudent && existingStudent._id !== studentId) {
        throw new Error(
          "Ya existe un estudiante con esta matrícula en la escuela."
        );
      }
    }

    // Actualiza solo los campos presentes en el objeto 'patch'
    await ctx.db.patch(studentId, {
      ...patch,
      updatedAt: Date.now(), // Registra la fecha de actualización
    });

    return studentId;
  },
});

// D: Baja Lógica (actualizar estado)
export const updateStudentStatus = mutation({
  args: {
    studentId: v.id("student"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.studentId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.studentId;
  },
});

// READ (Para tutores - solo sus estudiantes asignados)
export const getStudentsByTutor = query({
  args: {
    schoolId: v.id("school"),
    tutorId: v.id("user")
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("student")
      .withIndex("by_schoolId_and_enrollment", (q) =>
        q.eq("schoolId", args.schoolId)
      )
      .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
      .collect();
  },
});

// READ (Para maestros - solo estudiantes de sus materias)
export const getStudentsByTeacher = query({
  args: {
    schoolId: v.id("school"),
    teacherId: v.id("user")
  },
  handler: async (ctx, args) => {
    // Primero obtenemos las clases del maestro
    const teacherClasses = await ctx.db
      .query("classCatalog")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .filter((q) =>
        q.and(
          q.eq(q.field("schoolId"), args.schoolId),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    // Obtenemos todos los estudiantes matriculados en esas clases
    const studentClassPromises = teacherClasses.map(async (teacherClass) => {
      return await ctx.db
        .query("studentClass")
        .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", teacherClass._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    });

    const allStudentClasses = (await Promise.all(studentClassPromises)).flat();

    // Obtenemos IDs únicos de estudiantes
    const uniqueStudentIds = [...new Set(allStudentClasses.map(sc => sc.studentId))];

    // Obtenemos la información completa de los estudiantes
    const studentsPromises = uniqueStudentIds.map(async (studentId) => {
      return await ctx.db.get(studentId);
    });

    const students = await Promise.all(studentsPromises);

    // Filtramos los estudiantes nulos y verificamos que pertenezcan a la escuela
    return students
      .filter((student) => student !== null && student.schoolId === args.schoolId)
      .filter((student) => student !== null);
  },
});

// READ (Con filtros por rol - función principal)
export const getStudentsWithRoleFilter = query({
  args: {
    schoolId: v.id("school"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user")),
  },
  handler: async (ctx, args) => {
    // Si puede ver todos, devolver todos los estudiantes de la escuela
    if (args.canViewAll) {
      return await ctx.db
        .query("student")
        .withIndex("by_schoolId_and_enrollment", (q) =>
          q.eq("schoolId", args.schoolId)
        )
        .collect();
    }

    // Si es tutor, devolver solo sus estudiantes
    if (args.tutorId) {
      return await ctx.db
        .query("student")
        .withIndex("by_schoolId_and_enrollment", (q) =>
          q.eq("schoolId", args.schoolId)
        )
        .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
        .collect();
    }

    // Si es maestro, devolver estudiantes de sus materias
    if (args.teacherId) {
      // Primero obtenemos las clases del maestro
      const teacherClasses = await ctx.db
        .query("classCatalog")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .filter((q) =>
          q.and(
            q.eq(q.field("schoolId"), args.schoolId),
            q.eq(q.field("status"), "active")
          )
        )
        .collect();

      // Obtenemos todos los estudiantes matriculados en esas clases
      const studentClassPromises = teacherClasses.map(async (teacherClass) => {
        return await ctx.db
          .query("studentClass")
          .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", teacherClass._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
      });

      const allStudentClasses = (await Promise.all(studentClassPromises)).flat();

      // Obtenemos IDs únicos de estudiantes
      const uniqueStudentIds = [...new Set(allStudentClasses.map(sc => sc.studentId))];

      // Obtenemos la información completa de los estudiantes
      const studentsPromises = uniqueStudentIds.map(async (studentId) => {
        return await ctx.db.get(studentId);
      });

      const students = await Promise.all(studentsPromises);

      // Filtramos los estudiantes nulos y verificamos que pertenezcan a la escuela
      return students
        .filter((student) => student !== null && student.schoolId === args.schoolId)
        .filter((student) => student !== null);
    }

    // Si no tiene permisos específicos, devolver array vacío
    return [];
  },
});

// DELETE
export const deleteStudent = mutation({
  args: { id: v.id("student") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Obtener estudiantes con informacion de clases
export const getStudentWithClasses = query({
  args: { classCatalogId: v.id('classCatalog') },
  handler: async (ctx, args) => {
    // let studentClassesQuery = ctx.db.query('studentClass')
    // // filtrar studentClass por classCatalogId si se proporciona
    // if(args.classCatalogId) {
    //   studentClassesQuery = studentClassesQuery.withIndex('by_class_catalog', (q) => q.eq('classCatalogId', args.classCatalogId!))
    // }

    // const studentClasses = await studentClassesQuery.collect()

    let studentClasses;
    // Filtrar studentClass por classCatalogId si se proporciona
    if(args.classCatalogId) {
      studentClasses = await ctx.db.query('studentClass')
        .withIndex('by_class_catalog', (q) => q.eq('classCatalogId', args.classCatalogId!))
        .collect();
    } else {
      // Si no hay filtro, obtener todos los registros
      studentClasses = await ctx.db.query('studentClass').collect();
    }

    const studentsWithDetails = await Promise.all(
      studentClasses.map(async (sc) => {
        const student = await ctx.db.get(sc.studentId)
        const classCatalog = await ctx.db.get(sc.classCatalogId)
        return {
          ...sc,
          student,
          className: classCatalog?.name || 'Unknow'
        }
      })
    )

    return studentsWithDetails
  },
})
