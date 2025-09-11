import { Id } from "../_generated/dataModel"
import { query, mutation } from "../_generated/server"
import { v } from "convex/values"

export const createAttendance = mutation({
  args: {
    studentClassId: v.id('studentClass'),
    date: v.number(),
    attendanceState: v.union(
      v.literal('present'),
      v.literal('absent'),
      v.literal('justified'),
      v.literal('unjustified')
    ),
    comments: v.optional(v.string()),
    createdBy: v.id('user'),
    updatedBy: v.id('user')
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if(!identity) {
      throw new Error('Not authenticated')
    }

    // Verificar si ya existe un registro de para la misma clase y fecha
    const existingAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_student_class_and_date', (q) => 
        q.eq('studentClassId', args.studentClassId).eq('date', args.date)
      )
      .first()

    if(existingAttendance) {
      // Actualizar el registro existente
      return await ctx.db
        .patch(existingAttendance._id, {
          attendanceState: args.attendanceState,
          comments: args.comments,
          updatedBy: args.updatedBy,
          updatedAt: Date.now()
        })
    }

    // Crear un nuevo registro de asistencia
    return await ctx.db.insert('attendance', {
      studentClassId: args.studentClassId,
      date: args.date,
      attendanceState: args.attendanceState,
      comments:args.comments,
      createdBy: args.createdBy,
      updatedBy: args.updatedBy,
      updatedAt: Date.now()
    })
  },
})

export const getAttendanceByClassAndDate = query({
  args: {
    studentClassId: v.id('studentClass'),
    classCatalogId: v.id('classCatalog'),
    date: v.number()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if(!identity) {
      throw new Error('Not authenticated')
    }

    // Obtener todos los studentClass para la clase dada
    const studentClasses = await ctx.db
      .query('studentClass')
      .withIndex('by_class_catalog', (q) => 
        q.eq('classCatalogId', args.classCatalogId)
      )
      .collect()

    // Obtener la asistencia para cada studentClass en la fecha dada
    const attendanceRecords = await Promise.all(
      studentClasses.map(async (studentClass) => {
        const attendance = await ctx.db
          .query('attendance')
          .withIndex('by_student_class_and_date', (q) =>
            q.eq('studentClassId', args.studentClassId).eq('date', args.date)
          )
          .first()

        return {
          studentClassId: studentClass._id,
          studentId: studentClass.studentId,
          attendance: attendance || null
        }
      })
    )

    return attendanceRecords
  },
})

export const getAttendanceByStudentClass = query({
  args: {studentClassId: v.id('studentClass')},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if(!identity) {
      throw new Error('Not authenticated')
    }

    return await ctx.db
      .query('attendance')
      .withIndex('by_student_class', (q) => q.eq('studentClassId', args.studentClassId))
      .order('desc')
      .collect()
  },
})