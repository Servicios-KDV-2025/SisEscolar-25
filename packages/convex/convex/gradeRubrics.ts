import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// C: Crear un nuevo Criterio de Rúbrica
export const createGradeRubric = mutation({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
    name: v.string(), // Ej: "Tareas", "Examen Final"
    weight: v.number(), // Peso en la calificación de la unidad
    maxScore: v.number(), // Puntuación máxima
    createdBy: v.id("user"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("gradeRubric", {
      ...args,
      updatedAt: undefined,
    });
    return id;
  },
});

// R: Leer todos los criterios de una rúbrica por clase y periodo
export const getGradeRubricByClassAndTerm = query({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gradeRubric")
      .withIndex("by_class_term", (q) =>
        q.eq("classCatalogId", args.classCatalogId).eq("termId", args.termId)
      )
      .collect();
  },
});

// R: Leer un criterio de rúbrica por su ID
export const getGradeRubricById = query({
  args: { gradeRubricId: v.id("gradeRubric") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gradeRubricId);
  },
});

// U: Actualizar un Criterio de Rúbrica
export const updateGradeRubric = mutation({
  args: {
    gradeRubricId: v.id("gradeRubric"),
    data: v.object({
      name: v.optional(v.string()),
      weight: v.optional(v.number()),
      maxScore: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gradeRubricId, {
      ...args.data,
      updatedAt: Date.now(),
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