import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// C: Crear una Nueva Calificación
export const createGrade = mutation({
  args: {
    studentClassId: v.id("studentClass"),
    assignmentId: v.id("assignment"),
    score: v.number(),
    comments: v.optional(v.string()),
    registeredById: v.id("user"),
  },
  handler: async (ctx, args) => {
    // 1. Validar que el score no supere el maxScore del criterio de rúbrica
    const rubric = await ctx.db.get(args.assignmentId);
    if (!rubric) {
      throw new Error("Criterio de rúbrica no encontrado");
    }
    if (args.score > rubric.maxScore) {
      throw new Error("La calificación no puede ser mayor que el puntaje máximo permitido");
    }

    // 2. Insertar la nueva calificación
    const now = Date.now();
    const grade = await ctx.db.insert("grade", {
      studentClassId: args.studentClassId,
      assignmentId: args.assignmentId,
      score: args.score,
      comments: args.comments,
      registeredById: args.registeredById,
      createdBy: args.registeredById,
      updatedBy: undefined,
      updatedAt: undefined,
    });
    return grade;
  },
});

// R: Leer todas las calificaciones de un estudiante en una clase
export const getGradesByStudentClass = query({
  args: { studentClassId: v.id("studentClass") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("grade")
      .withIndex("by_student_class", (q) => q.eq("studentClassId", args.studentClassId))
      .collect();
  },
});

// R: Leer calificaciones por tarea
export const getGradesByAssignment = query({
  args: { assignmentId: v.id("assignment") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("grade")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();
  },
});


// U: Actualizar una calificación
export const updateGrade = mutation({
  args: {
    gradeId: v.id("grade"),
    data: v.object({
      score: v.optional(v.number()),
      comments: v.optional(v.string()),
    }),
    updatedBy: v.id("user"),
  },
  handler: async (ctx, args) => {
    // 1. Validar si el score actualizado supera el maxScore
    if (args.data.score !== undefined) {
      const grade = await ctx.db.get(args.gradeId);
      if (!grade) throw new Error("Calificación no encontrada");
      const rubric = await ctx.db.get(grade.assignmentId);
      if (!rubric) throw new Error("Criterio de rúbrica no encontrado");
      if (args.data.score > rubric.maxScore) {
        throw new Error("La calificación no puede ser mayor que el puntaje máximo permitido");
      }
    }

    // 2. Aplicar la actualización
    await ctx.db.patch(args.gradeId, {
      ...args.data,
      updatedBy: args.updatedBy,
      updatedAt: Date.now(),
    });
    return args.gradeId;
  },
});

// D: Borrar una calificación
export const deleteGrade = mutation({
  args: { gradeId: v.id("grade") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.gradeId);
    return args.gradeId;
  },
});