import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
/**
 * M: Cierra un periodo y calcula el promedio final para cada estudiante en una clase.
 * Este promedio es un cálculo ponderado basado en los criterios de la rúbrica.
 */
export const closeTermAndCalculateAverage = mutation({
  args: {
    termId: v.id("term"),
    classCatalogId: v.id("classCatalog"),
  },
  handler: async (ctx, args) => {
    // 1. Obtener todos los estudiantes inscritos en la clase
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .collect();

    // 2. Obtener todos los criterios de rúbrica para el periodo
    const rubrics = await ctx.db
      .query("gradeRubric")
      .withIndex("by_class_term", (q) =>
        q.eq("classCatalogId", args.classCatalogId).eq("termId", args.termId)
      )
      .collect();

    const savedIds: string[] = [];
    const user = await ctx.auth.getUserIdentity();
    const userId = user!.subject;  

    for (const studentClass of studentClasses) {
      // 3. Obtener todas las calificaciones del estudiante
      const grades = await ctx.db
        .query("grade")
        .withIndex("by_student_class", (q) => q.eq("studentClassId", studentClass._id))
        .collect();

      // 4. Filtrar calificaciones que pertenecen al periodo y criterios
      const gradesInTerm = grades.filter((g) =>
        rubrics.some((r) => r._id === g.gradeRubricId)
      );

      let totalWeighted = 0;
      let totalWeight = 0;

      // 5. Calcular el promedio ponderado
      for (const rubric of rubrics) {
        const grade = gradesInTerm.find((g) => g.gradeRubricId === rubric._id);
        if (grade) {
          totalWeighted += (grade.score / rubric.maxScore) * rubric.weight;
          totalWeight += rubric.weight;
        }
      }

      const averageScore = totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) : 0;

      // 6. Verificar si ya existe un promedio y actualizarlo o crear uno nuevo
      const existing = await ctx.db
        .query("termAverage")
        .withIndex("by_student_term", (q) =>
          q.eq("studentClassId", studentClass._id).eq("termId", args.termId)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          averageScore,
          updatedBy: userId as Id<"user">,
          updatedAt: Date.now(),
        });
        savedIds.push(existing._id);
      } else {
        const id = await ctx.db.insert("termAverage", {
          studentClassId: studentClass._id,
          termId: args.termId,
          averageScore,
          createdBy: userId as Id<"user">,
          updatedBy: undefined,
          updatedAt: undefined,
        });
        savedIds.push(id);
      }
    }

    // 7. Marcar el periodo como "cerrado"
    await ctx.db.patch(args.termId, { status: "closed" });

    return savedIds;
  },
});

// // ---

/**
 * R: Leer el promedio de un estudiante en un periodo específico.
 */
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

// // ---

/**
 * R: Obtener promedios de todos los sub-periodos (ej: trimestres)
 * de un periodo padre (ej: un año escolar) para un estudiante.
 */
export const getAnnualAverages = query({
  args: {
    studentClassId: v.id("studentClass"),
    parentTermId: v.id("term"),
  },
  handler: async (ctx, args) => {
    const terms = await ctx.db
      .query("term")
      .withIndex("by_parent_term", (q) => q.eq("parentTermId", args.parentTermId))
      .collect();

    const results = [];
    for (const term of terms) {
      const average = await ctx.db
        .query("termAverage")
        .withIndex("by_student_term", (q) =>
          q.eq("studentClassId", args.studentClassId).eq("termId", term._id)
        )
        .unique();
      results.push({
        termName: term.name,
        averageScore: average?.averageScore ?? null,
      });
    }
    return results;
  },
});

// // ---

/**
 * D: Borra todos los promedios de un periodo específico, por si se necesita
 * recalcularlos o deshacer el cierre.
 */
export const deleteAverage = mutation({
  args: {
    termId: v.id("term"),
    classCatalogId: v.id("classCatalog"),
  },
  handler: async (ctx, args) => {
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .collect();

    let deletedCount = 0;
    for (const studentClass of studentClasses) {
      const average = await ctx.db
        .query("termAverage")
        .withIndex("by_student_term", (q) =>
          q.eq("studentClassId", studentClass._id).eq("termId", args.termId)
        )
        .unique();
      if (average) {
        await ctx.db.delete(average._id);
        deletedCount++;
      }
    }
    return deletedCount;
  },
});