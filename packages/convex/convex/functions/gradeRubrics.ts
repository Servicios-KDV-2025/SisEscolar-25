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
    
    // 3. Combinar todos los datos
    // Mapear cada rúbrica y adjuntar los nombres del catálogo y del periodo
    const result = gradeRubrics.map((rubric) => {
      return {
        ...rubric, // Copia todas las propiedades de la rúbrica
        classCatalogName: classCatalog.name, // Añade el nombre del catálogo de clase
        termName: term.name, // Añade el nombre del periodo
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
    // ⚠️ Importante: Agrega aquí la lógica para verificar si existen
    // calificaciones (grade) vinculadas a este criterio antes de borrar.
    await ctx.db.delete(args.gradeRubricId);
    return args.gradeRubricId;
  },
});