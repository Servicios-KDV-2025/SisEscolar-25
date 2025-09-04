import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
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
    // 1. Obtener todos los documentos necesarios para el cálculo
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .collect();
 
    const assignments = await ctx.db
      .query("assignment")
      .withIndex("by_classCatalogId_term", (q) =>
        q.eq("classCatalogId", args.classCatalogId).eq("termId", args.termId)
      )
      .collect();

    const rubrics = await ctx.db
      .query("gradeRubric")
      .withIndex("by_class_term", (q) =>
        q.eq("classCatalogId", args.classCatalogId).eq("termId", args.termId)
      )
      .collect();

    const grades = await ctx.db.query("grade").collect();

    // Crear mapas para un acceso rápido y eficiente a los datos
    const assignmentsMap = new Map(assignments.map(a => [a._id, a]));
    const rubricsMap = new Map(rubrics.map(r => [r._id, r]));
    const gradesMap = new Map(grades.map(g => [g._id, g]));

    const savedIds: string[] = [];
    const user = await ctx.auth.getUserIdentity();
    const userId = user!.subject;

    for (const studentClass of studentClasses) {
      // 2. Agrupar las calificaciones del estudiante por rúbrica
      const rubricTotals = new Map<
        Id<"gradeRubric">,
        { totalScore: number; totalMaxScore: number }
      >();

      const studentGrades = grades.filter(g => g.studentClassId === studentClass._id);

      studentGrades.forEach(grade => {
        const assignment = assignmentsMap.get(grade.assignmentId);
        if (assignment && grade.score !== null) {
          const rubricId = assignment.gradeRubricId;
          const totals = rubricTotals.get(rubricId) || { totalScore: 0, totalMaxScore: 0 };
          
          totals.totalScore += grade.score;
          totals.totalMaxScore += assignment.maxScore;
          rubricTotals.set(rubricId, totals);
        }
      });

      // 3. Calcular el promedio final ponderado
      let finalGrade = 0;
      let totalWeight = 0;
      
      rubricTotals.forEach((totals, rubricId) => {
        const rubric = rubricsMap.get(rubricId);
        if (rubric && totals.totalMaxScore > 0) {
          const rubricPercentage = (totals.totalScore / totals.totalMaxScore); // Porcentaje de 0 a 1
          finalGrade += rubricPercentage * rubric.weight;
          totalWeight += rubric.weight;
        }
      });
      
      const averageScore = totalWeight > 0 ? Math.round((finalGrade / totalWeight) * 100) : 0;

      // 4. Actualizar o insertar el promedio del periodo
      const existing = await ctx.db
        .query("termAverage")
        .withIndex("by_student_term", (q) =>
          q.eq("studentClassId", studentClass._id).eq("termId", args.termId)
        )
        .unique();

      const termAverageData = {
        studentClassId: studentClass._id,
        termId: args.termId,
        averageScore,
      };

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...termAverageData,
          updatedBy: userId as Id<"user">,
          updatedAt: Date.now(),
        });
        savedIds.push(existing._id);
      } else {
        const id = await ctx.db.insert("termAverage", {
          ...termAverageData,
          createdBy: userId as Id<"user">,
          updatedBy: undefined,
          updatedAt: undefined,
        });
        savedIds.push(id);
      }
    }

    // 5. Marcar el periodo como "cerrado"
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
    schoolCycleId: v.id("schoolCycle"),
  },
  handler: async (ctx, args) => {
    const terms = await ctx.db
      .query("term")
      .withIndex("by_schoolCycleId", (q) => q.eq("schoolCycleId", args.schoolCycleId))
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

export const getAnnualAveragesForStudents = query({
  args: {
    classCatalogId: v.id("classCatalog"),
    schoolCycleId: v.id("schoolCycle"),
  },
  handler: async (ctx, args) => {
    // ✨ 1. Obtener todos los estudiantes de la clase
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .collect();

    // ✨ 2. Obtener todos los periodos del ciclo escolar
    const terms = await ctx.db
      .query("term")
      .withIndex("by_schoolCycleId", (q) => q.eq("schoolCycleId", args.schoolCycleId))
      .collect();

    // 3. Crear un mapa para buscar el nombre del periodo por su ID
    const termsMap = new Map(terms.map(t => [t._id, t.name]));

    const studentAverages = new Map<
      Id<"studentClass">,
      { termId: Id<"term">; averageScore: number | null; termName: string }[]
    >();

    // 4. Iterar sobre cada estudiante para encontrar sus promedios
    for (const student of studentClasses) {
      const averages = [];
      for (const term of terms) {
        const average = await ctx.db
          .query("termAverage")
          .withIndex("by_student_term", (q) =>
            q.eq("studentClassId", student._id).eq("termId", term._id)
          )
          .unique();
        averages.push({
          termId: term._id,
          averageScore: average?.averageScore ?? null,
          termName: termsMap.get(term._id)!,
        });
      }
      studentAverages.set(student._id, averages);
    }
    
    const result = Object.fromEntries(studentAverages);
    return result;
  },
});