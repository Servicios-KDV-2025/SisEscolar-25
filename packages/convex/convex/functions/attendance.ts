import { query, mutation } from "../_generated/server"
import { v } from "convex/values"

// Obtener asistencia por una studentClass específica
export const getAttendance = query({
  args: {
    studentClassId: v.id('studentClass')
  },
  handler: async (ctx, args) => {
    const studentClass = await ctx.db.get(args.studentClassId)
    if(!studentClass) {
      throw new Error('La clase de estudiante especificada no existe.')
    }
    return await ctx.db
      .query('attendance')
      .withIndex('by_student_class', (q) => q.eq('studentClassId', args.studentClassId))
      .collect()
  }
})
// Obtener asistencia por ID
export const getAttendenceById = query({
  args: {
    id: v.id('attendance')
  },
  handler: async (ctx, args) => {
    const attendace = await ctx.db.get(args.id)
    if(!attendace) {
      throw new Error('Asistencia no encontrada.')
    }
    return attendace
  }
})
// Crear una nueva sistencia
export const createAttendance = mutation({
  args: {
    studentClassId: v.id('studentClass'),
    date: v.number(),
    present: v.boolean(),
    justified: v.optional(v.boolean()),
    comments: v.optional(v.string()),
    registrationDate: v.number(),
    createdBy: v.id('user'),
    updatedBy: v.optional(v.id('user')),
    updatedAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const studentClassExists = await ctx.db.get(args.studentClassId)
    if(!studentClassExists) {
      throw new Error ('No se puede crear la asistencia: La clase de estudiante especificada no existe.')
    }
    return await ctx.db.insert('attendance', args)
  }
})
// Actualizar una asistencia existente
export const updateAttendace = mutation({
  args: {
    id: v.id('attendance'),
    studentClassId: v.id('studentClass'),
    date: v.number(),
    present: v.boolean(),
    justified: v.optional(v.boolean()),
    comments: v.optional(v.string()),
    registrationDate: v.number(),
    createdBy: v.id('user'),
    updatedBy: v.optional(v.id('user')),
    updatedAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const {id, studentClassId, ...data} = args
    const existingAttendance = await ctx.db.get(id)
    if(!existingAttendance || existingAttendance.studentClassId !== args.studentClassId) {
      throw new Error('No se puede actualizar la asistencia: La asistencia especificada no existe o no pertenece a la clase de estudiante indicada.')
    }
    await ctx.db.patch(id, data)
    return await ctx.db.get(id)
  }
})
// Eliminar una asistencia
export const deleteAttendance = mutation({
  args: {
    id: v.id('attendance'),
    studentClassId: v.id('studentClass')
  },
  handler: async (ctx, args) => {
    const existingAttendance = await ctx.db.get(args.id)
    if(!existingAttendance || existingAttendance.studentClassId !== args.studentClassId) {
      throw new Error('No se puede eliminar la asistencia: La asistencia especificada no existe o no pertenece a la clase de estudiante indicada.')
    }
    await ctx.db.delete(args.id)
    return true
  }
})

