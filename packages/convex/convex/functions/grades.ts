import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
 
// La función para crear o actualizar calificaciones (upsert)
export const upsertGrade = mutation({
  args: {
    studentClassId: v.id("studentClass"),
    assignmentId: v.id("assignment"), // ✨ CAMBIO CLAVE
    score: v.number(),
    comments: v.optional(v.string()),
    registeredById: v.id("user"),
  },
  handler: async (ctx, args) => {
    // Validar el score
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Tarea no encontrada.");
    }
    if (args.score > assignment.maxScore) {
      throw new Error("La calificación no puede ser mayor que el puntaje máximo permitido.");
    }
 
    // Buscar si la calificación ya existe usando el nuevo índice
    const existingGrade = await ctx.db
      .query("grade")
      .withIndex("by_student_assignment", (q) =>
        q.eq("studentClassId", args.studentClassId).eq("assignmentId", args.assignmentId)
      )
      .unique();
 
    if (existingGrade) {
      // Si existe, actualizarla
      await ctx.db.patch(existingGrade._id, {
        score: args.score,
        comments: args.comments,
        updatedBy: args.registeredById,
        updatedAt: Date.now(),
      });
      return existingGrade._id;
    } else {
      // Si no existe, crearla
      const id = await ctx.db.insert("grade", {
        ...args,
        createdBy: args.registeredById,
      });
      return id;
    }
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
 
// La función para obtener calificaciones de una clase en un periodo
export const getGradesByClassAndTerm = query({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
  },
  handler: async (ctx, args) => {
    // Obtener los IDs de todas las tareas para esa clase y periodo
    const assignments = await ctx.db
      .query("assignment")
      .withIndex("by_classCatalogId", (q) => q.eq("classCatalogId", args.classCatalogId))
      .filter((q) => q.eq(q.field("termId"), args.termId))
      .collect();
 
    const assignmentIds = assignments.map(a => a._id);
 
    // Obtener todas las calificaciones que coinciden con esos IDs de tarea
    const grades = await ctx.db
      .query("grade")
      .filter((q) => q.or(...assignmentIds.map(id => q.eq(q.field("assignmentId"), id))))
      .collect();
 
    return grades;
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