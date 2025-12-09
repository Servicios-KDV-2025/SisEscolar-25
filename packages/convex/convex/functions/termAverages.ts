// convex/functions/termAverage.ts
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const upsertTermAverage = mutation({
  args: {
    studentClassId: v.id("studentClass"),
    termId: v.id("term"),
    averageScore: v.number(),
    comments: v.optional(v.string()),
    registeredById: v.id("user"),
  },
  handler: async (ctx, args) => {
    // Validar que el ciclo escolar esté activo
    const term = await ctx.db.get(args.termId);
    if (!term) throw new Error("Periodo no encontrado.");

    const schoolCycle = await ctx.db.get(term.schoolCycleId);
    if (!schoolCycle) throw new Error("Ciclo escolar no encontrado.");

    if (schoolCycle.status !== "active") {
      throw new Error(`No se pueden guardar promedios en un ciclo ${schoolCycle.status === "archived" ? "archivado" : "inactivo"}.`);
    }

    // Verificar si ya existe un promedio para este estudiante y periodo
    const existing = await ctx.db
      .query("termAverage")
      .withIndex("by_student_term", (q) =>
        q.eq("studentClassId", args.studentClassId).eq("termId", args.termId)
      )
      .unique();

    if (existing) {
      // Si existe, actualizar
      await ctx.db.patch(existing._id, {
        averageScore: args.averageScore,
        comments: args.comments,
        updatedBy: args.registeredById,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Si no existe, crear
      const id = await ctx.db.insert("termAverage", {
        studentClassId: args.studentClassId,
        termId: args.termId,
        averageScore: args.averageScore,
        comments: args.comments,
        createdBy: args.registeredById,
      });
      return id;
    }
  },
});

// R: Obtener promedios de un estudiante en todas sus clases/periodos
export const getTermAveragesByStudent = query({
  args: { studentClassId: v.id("studentClass") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("termAverage")
      .withIndex("by_student_term", (q) => q.eq("studentClassId", args.studentClassId))
      .collect();
  },
});

// R: Obtener promedio de un estudiante en un periodo específico
export const getTermAverage = query({
  args: {
    studentClassId: v.id("studentClass"),
    termId: v.id("term"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("termAverage")
      .withIndex("by_student_term", (q) =>
        q.eq("studentClassId", args.studentClassId).eq("termId", args.termId)
      )
      .unique();
  },
});

// R: Obtener todos los promedios de una clase en un periodo
export const getTermAveragesByClassAndTerm = query({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("termAverage")
      .withIndex("by_term", (q) =>
        q.eq("termId", args.termId)
      )
      .collect();
  },
});

// U: Actualizar promedio ya existente
export const updateTermAverage = mutation({
  args: {
    termAverageId: v.id("termAverage"),
    data: v.object({
      averageScore: v.optional(v.number()),
      comments: v.optional(v.string()),
    }),
    updatedBy: v.id("user"),
  },
  handler: async (ctx, args) => {
    // Obtener el promedio y validar existencia
    const termAverage = await ctx.db.get(args.termAverageId);
    if (!termAverage) throw new Error("Promedio no encontrado");

    // Validar que el ciclo escolar esté activo
    const term = await ctx.db.get(termAverage.termId);
    if (!term) throw new Error("Periodo no encontrado.");

    const schoolCycle = await ctx.db.get(term.schoolCycleId);
    if (!schoolCycle) throw new Error("Ciclo escolar no encontrado.");

    if (schoolCycle.status !== "active") {
      throw new Error(`No se pueden modificar promedios en un ciclo ${schoolCycle.status === "archived" ? "archivado" : "inactivo"}.`);
    }

    await ctx.db.patch(args.termAverageId, {
      ...args.data,
      updatedBy: args.updatedBy,
      updatedAt: Date.now(),
    });
    return args.termAverageId;
  },
});

// D: Eliminar promedio
export const deleteTermAverage = mutation({
  args: { termAverageId: v.id("termAverage") },
  handler: async (ctx, args) => {
    // Obtener el promedio y validar existencia
    const termAverage = await ctx.db.get(args.termAverageId);
    if (!termAverage) throw new Error("Promedio no encontrado");

    // Validar que el ciclo escolar esté activo
    const term = await ctx.db.get(termAverage.termId);
    if (!term) throw new Error("Periodo no encontrado.");

    const schoolCycle = await ctx.db.get(term.schoolCycleId);
    if (!schoolCycle) throw new Error("Ciclo escolar no encontrado.");

    if (schoolCycle.status !== "active") {
      throw new Error(`No se pueden eliminar promedios en un ciclo ${schoolCycle.status === "archived" ? "archivado" : "inactivo"}.`);
    }

    await ctx.db.delete(args.termAverageId);
    return args.termAverageId;
  },
});

export const getAnnualAveragesForStudents = query({
  args: {
    schoolCycleId: v.id("schoolCycle"),
    classCatalogId: v.id("classCatalog"),
  },
  handler: async (ctx, args) => {
    // 1. Obtener los IDs de todos los estudiantes en la clase seleccionada
    const studentClasses = await ctx.db
      .query("studentClass")
      // ✅ Usa el índice correcto: "by_class_catalog"
      .withIndex("by_class_catalog", (q) =>
        q.eq("classCatalogId", args.classCatalogId)
      )
      .collect();

    const studentClassIds = studentClasses.map((sc) => sc._id);

    const allAverages = await ctx.db
      .query("termAverage")
      .filter((q) => q.or(...studentClassIds.map((id) => q.eq(q.field("studentClassId"), id))))
      .collect();

    const filteredAverages = [] as typeof allAverages;
    for (const avg of allAverages) {
      const term = await ctx.db.get(avg.termId);
      if (term && term.schoolCycleId === args.schoolCycleId) {
        filteredAverages.push(avg);
      }
    }

    const groupedAverages: Record<string, typeof filteredAverages> = {};
    for (const avg of filteredAverages) {
      const id = avg.studentClassId as string;
      if (!groupedAverages[id]) {
        groupedAverages[id] = [];
      }
      groupedAverages[id].push(avg);
    }

    return groupedAverages;
  },
});
