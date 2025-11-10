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

/**
 * Tutor: Obtiene actividad reciente de todos sus hijos
 */
export const getTutorStudentsRecentActivity = query({
  args: {
    schoolId: v.id("school"),
    tutorId: v.id("user"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    // 1. Obtener todos los estudiantes del tutor
    const students = await ctx.db
      .query("student")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
      .collect();

    if (students.length === 0) return [];

    const studentIds = students.map(s => s._id);

    // 2. Obtener las inscripciones (studentClass) de los estudiantes
    const studentClassPromises = students.map(async (student) => {
      return await ctx.db
        .query("studentClass")
        .withIndex("by_student", (q) => q.eq("studentId", student._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    });

    const studentClassesByStudent = await Promise.all(studentClassPromises);
    const allStudentClasses = studentClassesByStudent.flat();
    const studentClassIds = allStudentClasses.map(sc => sc._id);

    if (studentClassIds.length === 0) return [];

    // 3. Obtener las calificaciones recientes
    const gradePromises = allStudentClasses.map(async (sc) => {
      return await ctx.db
        .query("grade")
        .withIndex("by_student_class", (q) => q.eq("studentClassId", sc._id))
        .collect();
    });

    const gradesByClass = await Promise.all(gradePromises);
    const allGrades = gradesByClass.flat();

    // 4. Enriquecer las calificaciones con información de estudiante, materia y asignación
    const enrichedGrades = await Promise.all(
      allGrades.map(async (grade) => {
        const [studentClass, assignment] = await Promise.all([
          ctx.db.get(grade.studentClassId),
          ctx.db.get(grade.assignmentId),
        ]);

        if (!studentClass || !assignment) return null;

        const [student, classCatalog] = await Promise.all([
          ctx.db.get(studentClass.studentId),
          ctx.db.get(studentClass.classCatalogId),
        ]);

        if (!student || !classCatalog) return null;

        const subject = await ctx.db.get(classCatalog.subjectId);

        return {
          type: 'grade' as const,
          _id: grade._id,
          studentName: `${student.name} ${student.lastName || ''}`,
          subject: subject?.name || 'Materia',
          assignmentName: assignment.name,
          score: grade.score,
          maxScore: assignment.maxScore,
          createdAt: grade.updatedAt || 0,
        };
      })
    );

    // 5. Obtener asignaciones recientes de las clases de los estudiantes
    const classCatalogIds = [...new Set(allStudentClasses.map(sc => sc.classCatalogId))];
    
    const assignmentPromises = classCatalogIds.map(async (classId) => {
      return await ctx.db
        .query("assignment")
        .withIndex("by_classCatalogId", (q) => q.eq("classCatalogId", classId))
        .collect();
    });

    const assignmentsByClass = await Promise.all(assignmentPromises);
    const allAssignments = assignmentsByClass.flat();

    // Enriquecer asignaciones
    const enrichedAssignments = await Promise.all(
      allAssignments.map(async (assignment) => {
        const classCatalog = await ctx.db.get(assignment.classCatalogId);
        if (!classCatalog) return null;

        const subject = await ctx.db.get(classCatalog.subjectId);

        return {
          type: 'assignment' as const,
          _id: assignment._id,
          subject: subject?.name || 'Materia',
          assignmentName: assignment.name,
          dueDate: assignment.dueDate,
          createdAt: assignment.updatedAt || 0,
        };
      })
    );

    // 6. Obtener eventos recientes del calendario
    const calendarEvents = await ctx.db
      .query("calendar")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Enriquecer eventos
    const enrichedEvents = await Promise.all(
      calendarEvents.map(async (event) => {
        const eventType = await ctx.db.get(event.eventTypeId);

        return {
          type: 'event' as const,
          _id: event._id,
          eventName: eventType?.name || 'Evento',
          description: event.description || eventType?.description || '',
          eventDate: event.startDate,
          createdAt: event.createdAt,
        };
      })
    );

    // 7. Combinar todas las actividades y ordenar por fecha
    const allActivities = [
      ...enrichedGrades.filter(Boolean),
      ...enrichedAssignments.filter(Boolean),
      ...enrichedEvents.filter(Boolean),
    ].sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));

    // 8. Limitar resultados
    const limitedActivities = args.limit 
      ? allActivities.slice(0, args.limit) 
      : allActivities;

    return limitedActivities;
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
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user"))
  },
  handler: async (ctx, args) => {
    // Primero verificar acceso a la clase
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) return [];

    if (!args.canViewAll) {
      if (args.tutorId) {
        // Verificar que el tutor tenga estudiantes en esta clase
        const tutorStudentsInClass = await ctx.db
          .query("studentClass")
          .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        if (tutorStudentsInClass.length > 0) {
          const studentIds = tutorStudentsInClass.map(sc => sc.studentId);
          const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
          const hasAccess = students.some(student =>
            student && student.tutorId === args.tutorId
          );
          if (!hasAccess) return [];
        } else {
          return [];
        }
      } else if (args.teacherId) {
        // Verificar que el teacher sea el profesor de esta clase
        if (classCatalog.teacherId !== args.teacherId) {
          return [];
        }
      } else {
        return [];
      }
    }

    // Si tiene acceso, proceder con la consulta original
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