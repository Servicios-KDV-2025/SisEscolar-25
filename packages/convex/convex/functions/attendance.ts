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
    updatedBy: v.id('user'),
    updatedAt: v.number()
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
export const updateAttendance = mutation({
  args: {
    id: v.id('attendance'),
    studentClassId: v.id('studentClass'),
    date: v.number(),
    present: v.boolean(),
    justified: v.optional(v.boolean()),
    comments: v.optional(v.string()),
    registrationDate: v.number(),
    createdBy: v.id('user'),
    updatedBy: v.id('user'),
    updatedAt: v.number()
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

// Obtener registros de asistencia por fecha
export const getAttendanceByDate = query({
  args: {date: v.number()},
  handler: async (ctx, args) => {
    return await ctx.db.query('attendance').withIndex('by_date', (q) => q.eq('date', args.date)).collect()
  }
})

// Obtener registros de asistencia por fecha y clase especifica
export const getAttendanceByDateandClass = query({
  args: {
    date: v.number(),
    classCatalogId: v.id('classCatalog')
  },
  handler: async (ctx, args) => {
    // Primero obtener todos los studentClass para esta clase
    const studentClasses = await ctx.db
      .query('studentClass')
      .withIndex('by_class_catalog', (q) => q.eq('classCatalogId', args.classCatalogId))
      .collect()

    const studentClassIds = studentClasses.map(sc => sc._id);

    // Obtener todas las asistencias de la fecha especificada
    const allAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_date', (q) => q.eq('date', args.date))
      .collect()

    // Filtrar solo las asistencias que pertenecen a esta clase
    const classAttendance = allAttendance.filter(record => 
      studentClassIds.includes(record.studentClassId)
    )

    // Enriquecer con información de estudiantes
    const attendanceWithStudents = await Promise.all(
      classAttendance.map(async (record) => {
        const studentClass = await ctx.db.get(record.studentClassId)
        if (!studentClass) return null

        const student = await ctx.db.get(studentClass.studentId)
        const classCatalog = await ctx.db.get(studentClass.classCatalogId);

        return {
          ...record,
          student: student || null,
          className: classCatalog?.name || 'Unknown'
        }
      })
    )

    return attendanceWithStudents.filter(record => record !== null)
  },
})

// Obtener registros de asistencia con información de estudiantes
export const getAttendanceWithStudents = query({
  args: { 
    classCatalogId: v.id('classCatalog'),
    date: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let attendanceRecords

    // Si se proporciona classCatalogId, filtrar por esa clase
    if(args.classCatalogId && args.date) {
      // Optener los estudiantes para esa classe
      const studentClasses = await ctx.db
        .query('studentClass')
        .withIndex('by_class_catalog', (q) => q.eq('classCatalogId', args.classCatalogId!))
        .collect()

      const studentClassIds = studentClasses.map(sc => sc._id)

      // Obtener asistencias para estos studentClassIds en la fecha específica
      attendanceRecords = await ctx.db
        .query("attendance")
        .withIndex("by_date", (q) => q.eq("date", args.date!))
        .collect();

      attendanceRecords = attendanceRecords.filter(record => 
        studentClassIds.includes(record.studentClassId)
      )
    } else {
      attendanceRecords = await ctx.db.query('attendance').collect()
    }

    const recordsWithStudents = await Promise.all(
      attendanceRecords.map(async (record) => {
        const studentClass = await ctx.db.get(record.studentClassId)
        if(!studentClass) return null

        const student = await ctx.db.get(studentClass.studentId)
        const classCatalog = await ctx.db.get(studentClass.classCatalogId)

        return {
          ...record,
          student: student || null,
          className: classCatalog?.name || 'Unknown'
        }
      })
    )

    return recordsWithStudents.filter(record => record !== null)
  },
})

// Marcar asistencia
export const markAttendanceSimple = mutation({
  args: {
    studentClassId: v.id('studentClass'),
    date: v.number(),
    present: v.boolean(),
    comments: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Obtener usuario autenticado
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado");
    }

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Verificar si ya existe un registro para este estudiante en esta fecha
    const existingRecord = await ctx.db
      .query('attendance')
      .withIndex('by_student_class_and_date', (q) => 
        q.eq('studentClassId', args.studentClassId).eq("date", args.date)
      )
      .first();

    const now = Date.now();

    if (existingRecord) {
      // Actualizar registro existente
      await ctx.db.patch(existingRecord._id, {
        present: args.present,
        justified: args.present ? undefined : false,
        comments: args.comments,
        updatedBy: user._id,
        updatedAt: now,
      });
      return existingRecord._id;
    } else {
      // Crear nuevo registro
      return await ctx.db.insert('attendance', {
        studentClassId: args.studentClassId,
        date: args.date,
        present: args.present,
        justified: args.present ? undefined : false,
        comments: args.comments,
        registrationDate: now,
        createdBy: user._id,
        updatedBy: user._id,
        updatedAt: now
      });
    }
  }
})

// ======= CLASES ======= //

export const getTeacherClasses = query({
  handler: async (ctx) => {
    // Obtener usuario actual basado en clerk
    const identity = await ctx.auth.getUserIdentity()
    if(!identity) {
      throw new Error ('No autenticado')
    }

    // Buscar usuario por clerckId
    const user = await ctx.db
      .query('user')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .first()

    if(!user) {
      throw new Error ('Usuario no encontrado')
    }

    // Obtener las clases donde el usuario es profesor
    const classes = await ctx.db
      .query('classCatalog')
      .withIndex('by_teacher', (q) => q.eq('teacherId', user._id))
      .collect()

    // Obtener información adicional de los grupos
    const classesWithDetails = await Promise.all(
      classes.map(async (classItem) => {
        const grupo = classItem.groupId ? await ctx.db.get(classItem.groupId) : null
        return {
          ...classItem,
          grupoName: grupo?.name || 'Sin grupo'
        }
      })
    )

    return classesWithDetails
  },
})