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
            q.eq('studentClassId', studentClass._id).eq('date', args.date)
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

export const getAttendanceHistory = query({
  args: {
    schoolId: v.id('school'),
    filters: v.optional(v.object({
      studentName: v.optional(v.string()),
      classCatalogId: v.optional(v.id('classCatalog')),
      attendanceState: v.optional(v.union(
        v.literal('present'),
        v.literal('absent'),
        v.literal('justified'),
        v.literal('unjustified')
      )),
      dateFrom: v.optional(v.number()),
      dateTo: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if(!identity) {
      throw new Error('No autorizado')
    }

    // Obtener todas las asistencias de la escuela
    let attendanceQuery = ctx.db.query('attendance')

    // Aplicar filtros
    if(args.filters) {
      // Obtener todos los studentClass de la escuela
      const allStudentClasses = await ctx.db
        .query('studentClass')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .collect()

      const studentClassIds = allStudentClasses.map(sc => sc._id)

      // Filtrar por studentClassIds 
      attendanceQuery = attendanceQuery.filter(q => 
        q.or(...studentClassIds.map(id => q.eq(q.field('studentClassId'), id)))
      )

      // Aplicar filtros adicionales
      if(args.filters.classCatalogId) {
        const classStudentClasses = allStudentClasses.filter(sc => 
          sc.classCatalogId === args.filters?.classCatalogId
        )
        const classStudentClassesIds = classStudentClasses.map(sc => sc._id)
        attendanceQuery = attendanceQuery.filter(q => 
          q.or(...classStudentClassesIds.map(id => q.eq(q.field('studentClassId'), id)))
        )
      }

      if(args.filters.dateFrom) {
        attendanceQuery = attendanceQuery.filter(q => 
          q.gte(q.field('date'), args.filters?.dateFrom!)
        )
      }

      if(args.filters.dateTo) {
        attendanceQuery = attendanceQuery.filter(q =>
          q.lte(q.field('date'), args.filters?.dateTo!)
        )
      }

      if(args.filters.attendanceState) {
        attendanceQuery = attendanceQuery.filter(q =>
          q.eq(q.field('attendanceState'), args.filters?.attendanceState!)
        )
      }
    }

    const attendanceRecords = await attendanceQuery.order('desc').collect()

    // Enriquecer los datos informacion relacionada
    const enrichedRecords = await Promise.all(
      attendanceRecords.map(async (attendance) => {
        const studentClass = await ctx.db.get(attendance.studentClassId)
        if(!studentClass) return null

        const [student, classCatalog, createdByUser, updatedByUser] = await Promise.all([
          ctx.db.get(studentClass.studentId),
          ctx.db.get(studentClass.classCatalogId),
          ctx.db.get(attendance.createdBy),
          ctx.db.get(attendance.updatedBy)
        ])

        if(!student || !classCatalog) return null

        return {
          _id: attendance._id,
          date: attendance.date,
          attendanceState: attendance.attendanceState,
          comments: attendance.comments,
          student: {
            _id: student._id,
            name: student.name,
            lastName: student.lastName,
            enrollment: student.enrollment
          },
          classCatalog: {
            _id: classCatalog._id,
            name: classCatalog.name
          },
          createdBy: createdByUser ? `${createdByUser.name} ${createdByUser.lastName}` : 'Unknow',
          updatedBy: updatedByUser ? `${updatedByUser?.name} ${updatedByUser.lastName} ` : 'Unknow',
          updateAt: attendance.updatedAt
        }
      })
    )

    // Filtrar por nombre del estudiante si existe el filtro
    let filteredRecords = enrichedRecords.filter(Boolean)

    if(args.filters?.studentName) {
      const searchTerm = args.filters.studentName.toLowerCase()
      filteredRecords = filteredRecords.filter(record => 
        record?.student.name.toLowerCase().includes(searchTerm) ||
        record?.student.lastName?.toLowerCase().includes(searchTerm) ||
        record?.student.enrollment.toLowerCase().includes(searchTerm)
      )
    }

    return filteredRecords
  }
})

export const getAttendanceStatistics = query({
  args: {
    schoolId: v.id('school'),
    classCatalogId: v.optional(v.id('classCatalog')),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if(!identity) {
      throw new Error('No autorizado')
    }

    // Obtener todos los estidantes de la escuela
    const allStudentClasses = ctx.db
      .query('studentClass')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect()

    let attendanceQuery = ctx.db.query('attendance')

    // Aplicar filtros
    const studentClassIds = (await allStudentClasses)
      .filter(sc => !args.classCatalogId || sc.classCatalogId === args.classCatalogId)
      .map(sc => sc._id)

    attendanceQuery = attendanceQuery.filter(q => 
      q.or(...studentClassIds.map(id => q.eq(q.field('studentClassId'), id)))
    )

    if(args.dateFrom) {
      attendanceQuery = attendanceQuery.filter(q =>
        q.gte(q.field('date'), args.dateFrom!)
      )
    }

    if(args.dateTo) {
      attendanceQuery = attendanceQuery.filter(q => 
        q.lte(q.field('date'), args.dateTo!)
      )
    }

    const attendanceRecords = await attendanceQuery.collect()

    const state = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(r => r.attendanceState === 'present').length,
      absent: attendanceRecords.filter(r => r.attendanceState === 'absent').length,
      justified: attendanceRecords.filter(r => r.attendanceState === 'justified').length,
      unjustified: attendanceRecords.filter(r => r.attendanceState === 'unjustified').length
    }

    return {
      ...state,
      attendanceRate: state.total > 0 ? ((state.present + state.justified) / state.total * 100).toFixed(1) : '0'
    }
  }
})