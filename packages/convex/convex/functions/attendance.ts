import { Id } from "../_generated/dataModel"
import { query, mutation } from "../_generated/server"
import { v } from "convex/values"

export const getStudentsByGroupForAttendance = query({
  args: {
    groupId: v.id('group'),
    date: v.number(),
    schoolId: v.id('school')
  },
  handler: async (ctx, args) => {
    // Obtener estudiantes del grupo
    const student = await ctx.db
      .query('student')
      .withIndex('by_groupId', (q) => q.eq('groupId', args.groupId))
      .filter((q) => q.eq(q.field('schoolId'), args.schoolId))
      .collect()
    
    // Obtener clases del grupo
    const classCatalogs = await ctx.db
      .query('classCatalog')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('groupId'), args.groupId))
      .collect()

    const result = await Promise.all(
      student.map( async (student) => {
        // Para cada estudiante, obtener su estado de asistencia en para cada clase en la fecha especificada
        const studentClass = await ctx.db
          .query('studentClass')
          .withIndex('by_student', (q) => q.eq('studentId', student._id))
          .filter((q) => 
            q.add(
              q.eq(q.field('schoolId'), args.schoolId),
              q.eq(q.field('status'), 'active')
            )
          )
          .collect()

        const attendanceRecords = await Promise.all(
          studentClass.map(async (studentClass) => {
            // Verificar si la clase corresponde al grupo
            const classCatalog = classCatalogs.find(
              (c) => c._id === studentClass.classCatalogId
            )
            if (!classCatalog) return null

            // Buscar registro de asistencia para esta fecha
            const attendance = await ctx.db
              .query('attendance')
              // .withIndex('by_student_class_and_date', (q) => 
              //   q.and(
              //     q.eq(q.field("studentClassId"), studentClass._id),
              //     q.eq(q.field("date"), args.date)
              //   )
              // )
              .withIndex('by_student_class', (q) => q.eq('studentClassId', studentClass._id))
              .filter((q) => 
                q.and(
                  q.eq(q.field("studentClassId"), studentClass._id),
                  q.eq(q.field("date"), args.date)
                )
              )
              .first()

            return {
              classCatalogId: classCatalog._id,
              className: classCatalog.name,
              attendanceState: attendance?.attendanceState || null,
              attendanceId: attendance?._id || null
            }
          })
        )

        return {
          student: {
            _id: student._id,
            name: student.name,
            lastName: student.lastName,
            enrollment: student.enrollment
          },
          attendanceRecords: attendanceRecords.filter(Boolean) as {
            classCatalogId: Id<"classCatalog">;
            className: string;
            attendanceState: 'present' | 'absent' | 'justified' | 'unjustified' | null;
            attendanceId: Id<"attendance"> | null;
          }[]
        }
      })
    )

    return result
  },
})

// Registrar y actualizar asistencia
export const updateAttendance = mutation({
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
    updatedBy: v.id('user')
  },
  handler: async (ctx, args) => {
    // Verificar si ya existe un registro para el estudiante y fecha
    const existingAttendance = await ctx.db
      .query('attendance')
      // .withIndex("by_student_class_and_date", (q) =>
      //   q.and(
      //     q.eq(q.field("studentClassId"), args.studentClassId),
      //     q.eq(q.field("date"), args.date)
      //   )
      // )
      .withIndex('by_student_class', (q) => q.eq('studentClassId', args.studentClassId))
      .filter((q) => 
        q.and(
          q.eq(q.field("studentClassId"), args.studentClassId),
          q.eq(q.field("date"), args.date)
        )
      )
      .first()

    if(existingAttendance) {
      // Actualizar regsitro existente
      return await ctx.db.patch(existingAttendance._id, {
        attendanceState: args.attendanceState,
        comments: args.comments,
        updatedBy: args.updatedBy,
        updatedAt: Date.now()
      })
    } else {
      // Crear un registro  
      return await ctx.db.insert('attendance', {
        studentClassId: args.studentClassId,
        date: args.date,
        attendanceState: args.attendanceState,
        comments: args.comments,
        createdBy: args.updatedBy,
        updatedBy: args.updatedBy,
        updatedAt: Date.now()
      })
    }
  },
})

// Obtener historial de asistencia de un estudiante
export const getStudentAttendanceHistory = query({
  args: {
    studentId: v.id('student'),
    classCatalogId: v.id('classCatalog'),
    startDate: v.number(),
    endDate: v.number(),
    schoolId: v.id('school')
  },
  handler: async (ctx, args) => {
    // Obtener las clases del estudiante
    const studentClasses = await ctx.db
      .query('studentClass')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .filter((q) => 
        q.and(
          q.eq(q.field('schoolId'), args.schoolId ),
          q.eq(q.field('status'), 'active'),
          args.classCatalogId
            ? q.eq(q.field('classCatalogId'), args.classCatalogId)
            : q.neq(q.field('classCatalogId'), null)
        )
      ).collect()
    
      // Obtener registros de asistencia para cada clase en el rango de la fecha
      const attendanceHistory = await Promise.all(
        studentClasses.map( async (studentClass) => {
          const classCatalog = await ctx.db.get(studentClass.classCatalogId)
          if(!classCatalog) return null

          const subject = await ctx.db.get(classCatalog.subjectId)
          const group = classCatalog.groupId
            ? await ctx.db.get(classCatalog.groupId)
            : null

          const attendanceRecords = await ctx.db
            .query('attendance')
            .withIndex('by_student_class', (q) => q.eq('studentClassId', studentClass._id))
            .filter((q) => 
              q.add(
                q.gte(q.field('date'), args.startDate),
                q.lte(q.field('date'), args.endDate)
              )
            ).collect()

          return {
            classCatalog: {
              _id: classCatalog._id,
              name: classCatalog.name,
              subject: subject?.name || 'Sin materia',
              group: group?.name || 'Sin grupo'
            },
            attendanceRecords: attendanceRecords.map((record) => ({
              _id: record._id,
              date: record.date,
              attendanceState: record.attendanceState,
              comment: record.comments
            }))
          }
        })
      )

    return attendanceHistory.filter(Boolean)
  },
})

// Obtener grupos disponibles para un profesor
export const getTeacherGroup = query({
  args: {
    teacherId: v.id('user'),
    schoolId: v.id('school')
  },
  handler: async (ctx, args) => {
    // Obtener clases por profesor
    const teacherClasses = await ctx.db
      .query('classCatalog')
      .withIndex('by_teacher', (q) => q.eq('teacherId', args.teacherId))
      .filter((q) => 
        q.add(
          q.eq(q.field('schoolId'), args.schoolId),
          q.eq(q.field('status'), 'active')
        )
      ).collect()

    // Obtener grupos unicos de las clases
    const groupIds = teacherClasses
      .map((c) => c.groupId)
      .filter((id) => id != undefined) as Id<'group'>[]

    const uniqueGroupIds = [...new Set(groupIds)]

    // Obtener información de los grupos
    const groups = await Promise.all(
      uniqueGroupIds.map(async (groupId) => {
        const group = await ctx.db.get(groupId)
        return group
      })
    )
  
    return groups.filter(Boolean)
  },
})