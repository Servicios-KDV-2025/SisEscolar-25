import { query, mutation } from "../_generated/server"
import { v } from "convex/values"

export const getStudentsByClass = query({
  args: {
    classCatalogId: v.id("classCatalog"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado");
    }

    // Verificar que el usuario es el profesor de esta clase
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) {
      throw new Error("Clase no encontrada");
    }

    // Obtener el usuario por clerkId
    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Verificar que el usuario es el profesor asignado a esta clase
    if (classCatalog.teacherId !== user._id) {
      throw new Error("No tienes permisos para ver esta clase");
    }

    // Obtener todos los estudiantes inscritos en esta clase
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Obtener información completa de cada estudiante
    const studentsWithInfo = await Promise.all(
      studentClasses.map(async (studentClass) => {
        const student = await ctx.db.get(studentClass.studentId);
        return {
          studentClassId: studentClass._id,
          studentId: studentClass.studentId,
          enrollment: student?.enrollment,
          name: student?.name,
          lastName: student?.lastName,
          status: studentClass.status,
        };
      })
    );

    return studentsWithInfo;
  },
})

export const registerAttendance = mutation({
  args: {
    classCatalogId: v.id("classCatalog"),
    date: v.number(),
    attendances: v.array(
      v.object({
        studentClassId: v.id("studentClass"),
        present: v.boolean(),
        justified: v.optional(v.boolean()),
        comments: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    //Obtener la identidad del usuario autenticado
    const identity = await ctx.auth.getUserIdentity()
    if(!identity) {
      throw new Error('Usuario no autenticado')
    }

    // Obtener el usuario por clerk
    const user = await ctx.db
      .query('user')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .first()

    if(!user) {
      throw new Error('Usuario no encontrado')
    }

    const now = Date.now()
    const results = []

    for(const attendance of args.attendances) {
      // Verificar si ya existe una asistencia
      const exsistingAttendance = await ctx.db
        .query('attendance')
        .withIndex('by_student_class_and_date', (q) => 
          q.eq('studentClassId', attendance.studentClassId).eq('date', args.date)
        ).first()

      if(exsistingAttendance) {
        // Actualizar asistencia existente
        const updated = await ctx.db.patch(exsistingAttendance._id, {
          present: attendance.present,
          justified: attendance.justified,
          comments: attendance.comments,
          updatedAt: now,
          updatedBy: user._id
        })
        results.push(updated)
      } else {
        // Crear una nueva asistencia con todos los cambios registrados
        const newAttendance = await ctx.db.insert('attendance', {
          studentClassId: attendance.studentClassId,
          date: args.date,
          present: attendance.present,
          justified: attendance.justified,
          comments: attendance.comments,
          registrationDate: now,
          updatedAt: now,
          updatedBy: user._id,
          createdBy: user._id
        })
        results.push(newAttendance)
      }
    }

    return results
  },
})

export const getAttendanceByDate = query({
  args: {
    classCatalogId: v.id("classCatalog"),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    // Obtener todos los estudiantes de la clase (sin validación de usuario)
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Obtener información de estudiantes
    const students = await Promise.all(
      studentClasses.map(sc => ctx.db.get(sc.studentId))
    );

    // Obtener asistencias existentes
    const attendancePromises = studentClasses.map(sc =>
      ctx.db
        .query("attendance")
        .withIndex("by_student_class_and_date", (q) =>
          q.eq("studentClassId", sc._id).eq("date", args.date)
        )
        .first()
    );

    const attendances = await Promise.all(attendancePromises);

    return studentClasses.map((sc, index) => {
      const student = students[index];
      const attendance = attendances[index];

      return {
        studentClassId: sc._id,
        studentId: sc.studentId,
        enrollment: student?.enrollment || 'N/A',
        name: student?.name || 'Estudiante no encontrado',
        lastName: student?.lastName || '',
        present: attendance?.present ?? null,
        justified: attendance?.justified ?? null,
        comments: attendance?.comments || '',
        alreadyRegistered: !!attendance,
      };
    });
  },
})

export const getStudentAttendanceHistory = query({
  args: {
    studentClassId: v.id("studentClass"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado");
    }

    // Obtener el usuario por clerkId
    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Obtener la relación estudiante-clase
    const studentClass = await ctx.db.get(args.studentClassId);
    if (!studentClass) {
      throw new Error("Relación estudiante-clase no encontrada");
    }

    // Obtener la clase
    const classCatalog = await ctx.db.get(studentClass.classCatalogId);
    if (!classCatalog) {
      throw new Error("Clase no encontrada");
    }

    // Verificar que el usuario es el profesor de esta clase
    if (classCatalog.teacherId !== user._id) {
      throw new Error("No tienes permisos para ver el historial de este estudiante");
    }

    // Obtener las asistencias del estudiante en el rango de fechas
    const attendances = await ctx.db
      .query("attendance")
      .withIndex("by_student_class", (q) => q.eq("studentClassId", args.studentClassId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .order("desc")
      .collect();

    // Obtener información del estudiante
    const student = await ctx.db.get(studentClass.studentId);

    return {
      student: {
        enrollment: student?.enrollment,
        name: student?.name,
        lastName: student?.lastName,
      },
      attendances: attendances.map((att) => ({
        date: att.date,
        present: att.present,
        justified: att.justified,
        comments: att.comments,
      })),
      summary: {
        totalDays: attendances.length,
        presentDays: attendances.filter((a) => a.present).length,
        absentDays: attendances.filter((a) => !a.present).length,
        justifiedAbsences: attendances.filter((a) => !a.present && a.justified).length,
      },
    };
  },
})

export const deleteAttendance = mutation({
  args: {
    attendanceId: v.id("attendance"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado");
    }

    // Obtener el usuario por clerkId
    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Obtener la asistencia
    const attendance = await ctx.db.get(args.attendanceId);
    if (!attendance) {
      throw new Error("Asistencia no encontrada");
    }

    // Obtener la relación estudiante-clase
    const studentClass = await ctx.db.get(attendance.studentClassId);
    if (!studentClass) {
      throw new Error("Relación estudiante-clase no encontrada");
    }

    // Obtener la clase
    const classCatalog = await ctx.db.get(studentClass.classCatalogId);
    if (!classCatalog) {
      throw new Error("Clase no encontrada");
    }

    // Verificar que el usuario es el profesor de esta clase
    if (classCatalog.teacherId !== user._id) {
      throw new Error("No tienes permisos para eliminar esta asistencia");
    }

    // Eliminar la asistencia
    await ctx.db.delete(args.attendanceId);

    return { success: true };
  },
})

export const getAllActiveClasses = query({
  handler: async (ctx) => {
    // Obtener todas las clases activas
    const classes = await ctx.db
      .query("classCatalog")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Obtener información adicional
    const classesWithDetails = await Promise.all(
      classes.map(async (classItem) => {
        const [school, subject, group, teacher, schoolCycle] = await Promise.all([
          ctx.db.get(classItem.schoolId),
          ctx.db.get(classItem.subjectId),
          classItem.groupId ? ctx.db.get(classItem.groupId) : null,
          ctx.db.get(classItem.teacherId),
          ctx.db.get(classItem.schoolCycleId)
        ]);

        return {
          ...classItem,
          schoolName: school?.name || 'Escuela no encontrada',
          subjectName: subject?.name || 'Materia no encontrada',
          groupName: group?.name || 'Sin grupo',
          teacherName: teacher?.name || 'Profesor no encontrado',
          cycleName: schoolCycle?.name || 'Ciclo no encontrado'
        };
      })
    );

    return classesWithDetails;
  },
})

export const getTeacherClasses = query({
  args: {
    userId: v.optional(v.id('user'))
  },
  handler: async (ctx, args) => {
    if(!args.userId) {
      return[]
    }

    // Obtener las clases donde el usuario es profesor
    const classes = await ctx.db
      .query('classCatalog')
      .withIndex('by_teacher', (q) => q.eq('teacherId', args.userId!))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect()

    // Obtener infomcación adicional del grupo
    const classesWithDetails = await Promise.all(
      classes.map(async (classItem) => {
        const [school, subject, group, teacher, schoolCycle] = await Promise.all([
          ctx.db.get(classItem.schoolId),
          ctx.db.get(classItem.subjectId),
          classItem.groupId ? ctx.db.get(classItem.groupId) : null,
          ctx.db.get(classItem.teacherId),
          ctx.db.get(classItem.schoolCycleId),
        ])

        return {
          ...classItem,
          schoolName: school?.name || 'Escuala no encontrada',
          subjectName: subject?.name || 'Materia no encontrada',
          groupName: group?.name || 'Sin grupo',
          teacherName: teacher?.name || 'Profesor no encontrado',
          cycleName: schoolCycle?.name || 'Ciclo no encontrado'
        }
      })
    ) 
  },
})