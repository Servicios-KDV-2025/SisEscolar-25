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
  },
  handler: async (ctx, args) => {
    // 1. Obtener los criterios de la rúbrica que coincidan con los IDs
    const gradeRubrics = await ctx.db
      .query("gradeRubric")
      .withIndex("by_class_term", (q) =>
        q.eq("classCatalogId", args.classCatalogId).eq("termId", args.termId)
      )
      .collect();

    // Si no se encuentran rúbricas, retornar un array vacío.
    if (gradeRubrics.length === 0) {
      return [];
    }
    
    // 2. Obtener los datos del periodo y del catálogo de clase de forma eficiente
    const classCatalog = await ctx.db.get(args.classCatalogId);
    const term = await ctx.db.get(args.termId);

    // Si alguno de los documentos principales no existe, retornar un error o null.
    if (!classCatalog || !term) {
        throw new Error("Class Catalog or Term not found.");
    }
    
    // 3. Obtener el ciclo escolar de la clase
    const schoolCycle = classCatalog.schoolCycleId ? await ctx.db.get(classCatalog.schoolCycleId) : null;

    // 4. Combinar todos los datos
    // Mapear cada rúbrica y adjuntar los nombres del catálogo, periodo y ciclo escolar
    const result = gradeRubrics.map((rubric) => {
      return {
        ...rubric, // Copia todas las propiedades de la rúbrica
        classCatalogName: classCatalog.name, // Añade el nombre del catálogo de clase
        termName: term.name, // Añade el nombre del periodo
        schoolCycleName: schoolCycle?.name || "—", // Añade el nombre del ciclo escolar
        schoolCycleStatus: schoolCycle?.status || "—", // Añade el estado del ciclo escolar
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
  },
  handler: async (ctx, args) => {
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
  },
  handler: async (ctx, args) => {
    // Obtener todas las clases de la escuela, filtradas por ciclo escolar si se proporciona
    let classesQuery = ctx.db
      .query("classCatalog")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId));

    if (args.schoolCycleId) {
      classesQuery = classesQuery.filter((q) => q.eq(q.field("schoolCycleId"), args.schoolCycleId));
    }

    const classes = await classesQuery.collect();

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
  },
  handler: async (ctx, args) => {
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