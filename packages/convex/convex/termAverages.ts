import { mutation, query, internalMutation } from "./_generated/server";
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
    // : Este es el punto de partida. Iteramos sobre cada estudiante para asegurar
    // que a todos se les calcule un promedio, incluso si no tienen calificaciones.
    const studentsInClass = await ctx.db
      .query("studentClass")
      .withIndex("by_class_catalog", (q) =>
        q.eq("classCatalogId", args.classCatalogId)
      )
      .collect();

    // 2. Obtener todos los criterios de rúbrica para el periodo
    // : Traemos todas las rúbricas de calificación (exámenes, tareas, etc.)
    // que se definieron para el periodo, ya que estas contienen los pesos (`weight`)
    // necesarios para el cálculo ponderado.
    const rubrics = await ctx.db
      .query("gradeRubric")
      .withIndex("by_class_term", (q) =>
        q.eq("classCatalogId", args.classCatalogId).eq("termId", args.termId)
      )
      .collect();

    const savedIds: Id<"termAverage">[] = [];
    const user = await ctx.auth.getUserIdentity();
    const userId = user!.subject;

    for (const studentClass of studentsInClass) {
      let totalWeightedScore = 0;
      let totalWeight = 0;

      // : Iterar por rúbrica asegura que se recorran todos los
      // criterios de evaluación del periodo para cada estudiante.
      for (const rubric of rubrics) {
        // Obtener todas las tareas de esta rúbrica
        // : Se buscan todas las tareas que pertenecen a esta rúbrica específica.
        const assignments = await ctx.db
          .query("assignment")
          .withIndex("by_rubric", (q) => q.eq("gradeRubricId", rubric._id))
          .collect();

        if (assignments.length === 0) continue;

        // Para cada tarea, obtener la calificación del estudiante
        // : Esta parte es crucial. Se busca la calificación única del estudiante
        // para cada una de las tareas de la rúbrica. `Promise.all` mejora el rendimiento
        // al ejecutar las consultas en paralelo.
        const assignmentGrades = await Promise.all(
          assignments.map((assignment) =>
            ctx.db
              .query("grade")
              .withIndex("by_student_assignment", (q) =>
                q
                  .eq("studentClassId", studentClass._id)
                  .eq("assignmentId", assignment._id)
              )
              .unique()
          )
        );

        // Calcular el promedio de las calificaciones de esta rúbrica
        // : Aquí se calcula el promedio simple de las calificaciones
        // de todas las tareas que pertenecen a una misma rúbrica (ej. el promedio de todos los "Exámenes").

        const scores = assignmentGrades.filter(Boolean).map((g) => g!.score);

        if (scores.length > 0) {
          const rubricAverage =
            scores.reduce((sum, score) => sum + score, 0) / scores.length;

          // Añadir el promedio ponderado al total
          // : Se aplica el peso (`weight`) de la rúbrica al promedio calculado,
          // lo que lo convierte en una calificación ponderada.
          totalWeightedScore +=
            (rubricAverage / rubric.maxScore) * rubric.weight;
          totalWeight += rubric.weight;
        }
      }

      // : Se realiza el cálculo final del promedio total de la materia para el periodo.
      // Se escala a base 10 y se redondea para un formato legible.
      const averageScore =
        totalWeight > 0 ? (totalWeightedScore / totalWeight) * 10 : 0;
      const finalAverage = Math.round(averageScore * 100) / 100;

      // 6. Verificar si ya existe un promedio y actualizarlo o crear uno nuevo
      // : Esta es una lógica de "upsert". Si el promedio ya fue calculado
      // (por ejemplo, por una corrección de calificación), simplemente se actualiza.
      // Si no existe, se crea un nuevo registro. Esto evita duplicados.
      const existing = await ctx.db
        .query("termAverage")
        .withIndex("by_student_term", (q) =>
          q.eq("studentClassId", studentClass._id).eq("termId", args.termId)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          averageScore: finalAverage,
          updatedBy: userId as Id<"user">,
          updatedAt: Date.now(),
        });
        savedIds.push(existing._id);
      } else {
        const id = await ctx.db.insert("termAverage", {
          studentClassId: studentClass._id,
          termId: args.termId,
          averageScore: finalAverage,
          createdBy: userId as Id<"user">,
          updatedBy: undefined,
          updatedAt: undefined,
        });
        savedIds.push(id);
      }
    }

    // 7. Marcar el periodo como "cerrado"
    // : Este paso final es crucial para tu lógica de negocio. Indica
    // que las calificaciones de este periodo están completas y que el promedio
    // final ha sido calculado.
    await ctx.db.patch(args.termId, { status: "closed" });

    return savedIds;
  },
});

export const recalculateStudentAverage = internalMutation({
  args: {
    studentClassId: v.id("studentClass"),
    termId: v.id("term"),
  },
  handler: async (ctx, args) => {
    // 1. Obtener la información de la clase del estudiante
    const studentClass = await ctx.db.get(args.studentClassId);
    if (!studentClass) {
        throw new Error("Student class not found");
    }

    // 2. Obtener todos los criterios de rúbrica para el periodo
    const rubrics = await ctx.db
      .query("gradeRubric")
      .withIndex("by_class_term", (q) =>
        q.eq("classCatalogId", studentClass.classCatalogId).eq("termId", args.termId)
      )
      .collect();

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const rubric of rubrics) {
      // Obtener las tareas de esta rúbrica y las calificaciones del estudiante para ellas
      const assignments = await ctx.db
        .query("assignment")
        .withIndex("by_rubric", (q) => q.eq("gradeRubricId", rubric._id))
        .collect();

      if (assignments.length === 0) continue;

      // Obtener las calificaciones del estudiante para cada tarea de la rúbrica
      const assignmentGrades = await Promise.all(
        assignments.map((assignment) =>
          ctx.db
            .query("grade")
            .withIndex("by_student_assignment", (q) =>
              q.eq("studentClassId", studentClass._id).eq("assignmentId", assignment._id)
            )
            .unique()
        )
      );
      
      const scores = assignmentGrades.filter(Boolean).map((g) => g!.score);
      
      if (scores.length > 0) {
        const rubricAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        totalWeightedScore += (rubricAverage / rubric.maxScore) * rubric.weight;
        totalWeight += rubric.weight;
      }
    }

    const averageScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 10 : 0;
    const finalAverage = Math.round(averageScore * 100) / 100;

    // 3. Actualizar o crear el promedio en termAverage
    const existing = await ctx.db
      .query("termAverage")
      .withIndex("by_student_term", (q) =>
        q.eq("studentClassId", args.studentClassId).eq("termId", args.termId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        averageScore: finalAverage,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("termAverage", {
        studentClassId: args.studentClassId,
        termId: args.termId,
        averageScore: finalAverage,
        createdBy: "some-user-id" as Id<"user">,
      });
    }

    return finalAverage;
  },
});

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

/**
 * R: Obtener todos los promedios de todos los periodos para un estudiante en una clase.
 */
export const getAllTermAveragesByStudentClass = query({
  args: { studentClassId: v.id("studentClass") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("termAverage")
      .withIndex("by_student_term", (q) =>
        q.eq("studentClassId", args.studentClassId)
      )
      .collect();
  },
});

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
      .withIndex("by_class_catalog", (q) =>
        q.eq("classCatalogId", args.classCatalogId)
      )
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
