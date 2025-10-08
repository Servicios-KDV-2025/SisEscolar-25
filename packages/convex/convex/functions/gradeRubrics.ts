import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// C: Crear un nuevo Criterio de Rúbrica
export const createGradeRubric = mutation({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
    name: v.string(), // Ej: "Tareas", "Examen Final"
    status: v.boolean(),
    weight: v.number(), // Peso en la calificación de la unidad
    maxScore: v.number(), // Puntuación máxima
    createdBy: v.id("user")
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("El usuario debe estar autenticado para crear un criterio de rúbrica.");
    }
    const now = Date.now();

    const id = await ctx.db.insert("gradeRubric", {
      ...args,
      updatedAt: undefined,
    });
  },
});

// R: Leer todos los criterios de una rúbrica por clase y periodo
export const getGradeRubricByClassAndTerm = query({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user")),
  },
  handler: async (ctx, args) => {
    // Primero verificamos que el usuario tenga acceso a esta clase
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) {
      throw new Error("Class Catalog not found.");
    }

    // Verificar permisos usando la lógica de roles
    if (!args.canViewAll) {
      if (args.tutorId) {
        // Verificar si el tutor tiene estudiantes en esta clase
        const tutorStudentsInClass = await ctx.db
          .query("studentClass")
          .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
          .filter((q) => {
            // Necesitamos verificar si estos estudiantes pertenecen al tutor
            return q.eq(q.field("status"), "active");
          })
          .collect();

        if (tutorStudentsInClass.length > 0) {
          const studentIds = tutorStudentsInClass.map(sc => sc.studentId);
          const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
          const hasAccess = students.some(student =>
            student && student.tutorId === args.tutorId
          );

          if (!hasAccess) {
            return []; // No tiene acceso
          }
        } else {
          return []; // No tiene acceso
        }
      } else if (args.teacherId) {
        // Verificar si el teacher es el profesor de esta clase
        if (classCatalog.teacherId !== args.teacherId) {
          return []; // No tiene acceso
        }
      } else {
        return []; // No tiene permisos
      }
    }

    // Si tiene permisos, proceder con la consulta original
    const gradeRubrics = await ctx.db
      .query("gradeRubric")
      .withIndex("by_class_term", (q) =>
        q.eq("classCatalogId", args.classCatalogId).eq("termId", args.termId)
      )
      .collect();

    if (gradeRubrics.length === 0) {
      return [];
    }

    const term = await ctx.db.get(args.termId);
    const schoolCycle = classCatalog.schoolCycleId ? await ctx.db.get(classCatalog.schoolCycleId) : null;

    if (!term) {
      throw new Error("Term not found.");
    }

    const result = gradeRubrics.map((rubric) => {
      return {
        ...rubric,
        classCatalogName: classCatalog.name,
        termName: term.name,
        schoolCycleName: schoolCycle?.name || "—",
        schoolCycleStatus: schoolCycle?.status || "—",
      };
    });

    return result;
  },
});

// U: Actualizar un Criterio de Rúbrica
export const updateGradeRubric = mutation({
  args: {
    gradeRubricId: v.id("gradeRubric"),
    data: v.object({
      createdBy: v.id("user"),
      name: v.optional(v.string()),
      weight: v.optional(v.number()),
      maxScore: v.optional(v.number()),
      status: v.optional(v.boolean()),
      termId: v.optional(v.id("term")),
      classCatalogId: v.optional(v.id("classCatalog")),
    }),
  },
  handler: async (ctx, args) => {
    // 2. Obtener la rúbrica existente
    const existingRubric = await ctx.db.get(args.gradeRubricId);
    if (!existingRubric) {
      throw new Error("Criterio de rúbrica no encontrado.");
    }

    // 3. Verificar si el usuario es el creador del documento
    if (existingRubric.createdBy !== (args.data.createdBy as Id<"user">)) {
      throw new Error("No tienes permiso para actualizar este criterio de rúbrica.");
    }

    // 4. Actualizar el documento
    await ctx.db.patch(args.gradeRubricId, {
      ...args.data,
      updatedAt: Date.now(), // ✅ La fecha se actualiza en el servidor
    });

    return args.gradeRubricId;
  },
});

// D: Borrar un Criterio de Rúbrica
export const deleteGradeRubric = mutation({
  args: { gradeRubricId: v.id("gradeRubric") },
  handler: async (ctx, args) => {

    // Buscar el documento antes de intentar eliminarlo
    const rubric = await ctx.db.get(args.gradeRubricId);

    // Si el documento existe, lo elimina. Si no, no hace nada y evita el error.
    if (rubric) {
      await ctx.db.delete(args.gradeRubricId);
    }
  },
});

// Obtener rúbricas por clase (para el formulario de tareas)
export const getGradeRubricsByClass = query({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user")),
  },
  handler: async (ctx, args) => {
    // Primero verificamos permisos (similar a la función anterior)
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) {
      return [];
    }

    if (!args.canViewAll) {
      if (args.tutorId) {
        // Lógica de verificación para tutor...
        const tutorStudentsInClass = await ctx.db
          .query("studentClass")
          .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        if (tutorStudentsInClass.length > 0) {
          const studentIds = tutorStudentsInClass.map(sc => sc.studentId);
          const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
          const hasAccess = students.some(student =>
            student && student.tutorId === args.tutorId
          );

          if (!hasAccess) {
            return [];
          }
        } else {
          return [];
        }
      } else if (args.teacherId) {
        if (classCatalog.teacherId !== args.teacherId) {
          return [];
        }
      } else {
        return [];
      }
    }

    const gradeRubrics = await ctx.db
      .query("gradeRubric")
      .withIndex("by_class_term", (q) =>
        q.eq("classCatalogId", args.classCatalogId).eq("termId", args.termId)
      )
      .filter((q) => q.eq(q.field("status"), true))
      .collect();

    return gradeRubrics;
  }
});


// Obtener todas las rúbricas de una escuela filtradas por ciclo escolar
export const getAllGradeRubricsBySchool = query({
  args: {
    schoolId: v.id("school"),
    schoolCycleId: v.optional(v.id("schoolCycle")),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user")),
  },
  handler: async (ctx, args) => {
    // Obtener clases según los permisos del usuario
    let classesQuery;

    const { schoolId, schoolCycleId, canViewAll, tutorId, teacherId } = args

    if (canViewAll) {
      // Si puede ver todos, obtener todas las clases de la escuela
      classesQuery = ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", schoolId));
    } else if (tutorId) {
      // Si es tutor, obtener solo las clases de sus estudiantes
      // Primero obtenemos los estudiantes del tutor
      const tutorStudents = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", schoolId))
        .filter((q) => q.eq(q.field("tutorId"), tutorId))
        .collect();

      if (tutorStudents.length === 0) {
        return [];
      }

      // Obtenemos las studentClass de estos estudiantes
      const studentClassPromises = tutorStudents.map(async (student) => {
        return await ctx.db
          .query("studentClass")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
      });

      const allStudentClasses = (await Promise.all(studentClassPromises)).flat();

      if (allStudentClasses.length === 0) {
        return [];
      }

      // Obtenemos los IDs únicos de classCatalog
      const uniqueClassCatalogIds = [...new Set(allStudentClasses.map(sc => sc.classCatalogId))];

      // Obtenemos las clases correspondientes
      classesQuery = ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
        .filter((q) => q.and(
          q.eq(q.field("status"), "active"),
          q.or(...uniqueClassCatalogIds.map(id => q.eq(q.field("_id"), id)))
        ));
    } else if (args.teacherId) {
      // Si es maestro, obtener solo sus clases
      if (args.teacherId) {
        classesQuery = ctx.db
          .query("classCatalog")
          .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId!))
          .filter((q) =>
            q.and(
              q.eq(q.field("schoolId"), args.schoolId),
              q.eq(q.field("status"), "active")
            )
          );
      }
    } else {
      // Si no tiene permisos específicos, devolver array vacío
      return [];
    }

    // Aplicar filtro por ciclo escolar si se proporciona
    if (args.schoolCycleId) {
      classesQuery = classesQuery!.filter((q) => q.eq(q.field("schoolCycleId"), schoolCycleId));
    }

    const classes = await classesQuery!.collect();

    if (classes.length === 0) {
      return [];
    }

    // Obtener todas las rúbricas de esas clases
    const allRubrics = await Promise.all(
      classes.map(async (clase) => {
        const rubrics = await ctx.db
          .query("gradeRubric")
          .withIndex("by_class_term", (q) =>
            q.eq("classCatalogId", clase._id)
          )
          .collect();

        // Para cada rúbrica, obtener los datos del periodo y ciclo escolar
        return Promise.all(
          rubrics.map(async (rubric) => {
            const [term, schoolCycle] = await Promise.all([
              ctx.db.get(rubric.termId),
              clase.schoolCycleId ? ctx.db.get(clase.schoolCycleId) : null,
            ]);

            return {
              ...rubric,
              classCatalogName: clase.name,
              termName: term?.name || "—",
              schoolCycleName: schoolCycle?.name || "—",
              schoolCycleStatus: schoolCycle?.status || "—",
            };
          })
        );
      })
    );

    // Aplanar el array de arrays
    return allRubrics.flat();
  },
});

// Obtener el porcentaje total de rúbricas activas por clase y período
export const getRubricPercentageByClassAndTerm = query({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user")),
  },
  handler: async (ctx, args) => {
    // Verificación de permisos similar...
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) {
      return {
        totalPercentage: 0,
        availablePercentage: 100,
        rubricsCount: 0,
      };
    }

    if (!args.canViewAll) {
      if (args.tutorId) {
        // Lógica de verificación para tutor...
        const tutorStudentsInClass = await ctx.db
          .query("studentClass")
          .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        if (tutorStudentsInClass.length > 0) {
          const studentIds = tutorStudentsInClass.map(sc => sc.studentId);
          const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
          const hasAccess = students.some(student =>
            student && student.tutorId === args.tutorId
          );

          if (!hasAccess) {
            return {
              totalPercentage: 0,
              availablePercentage: 100,
              rubricsCount: 0,
            };
          }
        } else {
          return {
            totalPercentage: 0,
            availablePercentage: 100,
            rubricsCount: 0,
          };
        }
      } else if (args.teacherId) {
        if (classCatalog.teacherId !== args.teacherId) {
          return {
            totalPercentage: 0,
            availablePercentage: 100,
            rubricsCount: 0,
          };
        }
      } else {
        return {
          totalPercentage: 0,
          availablePercentage: 100,
          rubricsCount: 0,
        };
      }
    }

    const rubrics = await ctx.db
      .query("gradeRubric")
      .withIndex("by_class_term", (q) =>
        q.eq("classCatalogId", args.classCatalogId).eq("termId", args.termId)
      )
      .filter((q) => q.eq(q.field("status"), true))
      .collect();

    const totalPercentage = rubrics.reduce((sum, rubric) => {
      return sum + Math.round(rubric.weight * 100);
    }, 0);

    return {
      totalPercentage,
      availablePercentage: 100 - totalPercentage,
      rubricsCount: rubrics.length,
    };
  },
});
