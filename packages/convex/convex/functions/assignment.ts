import { v } from "convex/values";
import schema from "../schema";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

const assignmentFields = schema.tables.assignment.validator.fields;

// ########################################################################
//                                 SECURITY HELPERS (INTERNAL)
// ########################################################################
// Estas funciones validan el rol del usuario de forma segura.

// Verifica si un usuario es el tutor de un estudiante.
export const isTutorOfStudent = internalQuery({
  args: {
    userId: v.id("user"),
    studentId: v.id("student"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return false;
    return student.tutorId === args.userId;
  },
});

// Verifica si un usuario es administrador de una escuela (o superadmin).
export const isAdminOfSchool = internalQuery({
  args: {
    userId: v.id("user"),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    const userSchool = await ctx.db
      .query("userSchool")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
      .unique();
    if (!userSchool) return false;
    return userSchool.role.includes("admin") || userSchool.role.includes("superadmin");
  },
});

// ########################################################################
//                          READ OPERATIONS (PUBLIC QUERIES)
// ########################################################################

/**
 * Tutor: Obtiene todas las tareas asignadas a un estudiante en particular.
 */
export const getAssignmentsForTutor = query({
  args: { studentId: v.id("student") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    // Validamos que el usuario autenticado sea el tutor de ese estudiante
    const isTutor = await ctx.runQuery(
      internal.functions.assignment.isTutorOfStudent,
      { userId: user._id, studentId: args.studentId }
    );
    if (!isTutor) {
      throw new Error("Acceso denegado: No eres el tutor de este estudiante.");
    }

    // Buscamos todas las inscripciones del estudiante
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Obtenemos todas las tareas de esas clases
    const assignments = await Promise.all(
      studentClasses.map(async (sc) => {
        const classCatalog = await ctx.db.get(sc.classCatalogId);
        if (!classCatalog) return [] as any[];

        return await ctx.db
          .query("assignment")
          .withIndex("by_classCatalogId", (q) => q.eq("classCatalogId", classCatalog._id))
          .collect();
      })
    );
    return assignments.flat();
  },
});

/**
 * Maestro: Obtiene todas las tareas creadas por el usuario autenticado.
 */
export const getTeacherAssignments = query({
  args: {
    schoolId: v.id("school"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    let assignments = [];

    if (args.canViewAll) {
      // Superadmin, Admin, Auditor: ver todas las asignaciones de la escuela
      // Obtener todas las clases de la escuela primero
      const schoolClasses = await ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .collect();

      const schoolClassIds = schoolClasses.map(c => c._id);

      // Obtener asignaciones por cada clase (no hay forma directa de filtrar por array)
      const assignmentPromises = schoolClassIds.map(async (classId) => {
        return await ctx.db
          .query("assignment")
          .withIndex("by_classCatalogId", (q) => q.eq("classCatalogId", classId))
          .collect();
      });

      const assignmentsByClass = await Promise.all(assignmentPromises);
      assignments = assignmentsByClass.flat();
    } else if (args.teacherId) {
      console.log('🔍 Query - Teacher filtering:', {
        teacherId: args.teacherId,
        schoolId: args.schoolId
      });

      // Teacher: ver solo sus asignaciones
      assignments = await ctx.db
        .query("assignment")
        .withIndex("by_createdBy", (q) => q.eq("createdBy", args.teacherId!))
        .collect();

      console.log('🔍 Query - Teacher assignments before school filter:', {
        count: assignments.length,
        assignments: assignments.map(a => ({ id: a._id, name: a.name, classCatalogId: a.classCatalogId }))
      });

      // Filtrar solo las que pertenecen a la escuela
      const schoolClasses = await ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .collect();

      const schoolClassIds = schoolClasses.map(c => c._id);
      console.log('🔍 Query - School classes for filter:', {
        schoolClassIds,
        schoolClassesCount: schoolClasses.length
      });

      assignments = assignments.filter(a => schoolClassIds.includes(a.classCatalogId));

      console.log('🔍 Query - Teacher assignments after school filter:', {
        count: assignments.length,
        assignments: assignments.map(a => ({ id: a._id, name: a.name }))
      });
    } else if (args.tutorId) {
      // Tutor: ver asignaciones de las clases donde tiene estudiantes
      const tutorStudentClasses = await ctx.db
        .query("studentClass")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      const tutorStudents = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
        .collect();

      const tutorStudentIds = tutorStudents.map(s => s._id);

      // Filtrar clases donde el tutor tiene estudiantes
      const tutorClassIds = tutorStudentClasses
        .filter(sc => tutorStudentIds.includes(sc.studentId))
        .map(sc => sc.classCatalogId);

      const uniqueTutorClassIds = [...new Set(tutorClassIds)];

      // Obtener asignaciones por cada clase del tutor
      const assignmentPromises = uniqueTutorClassIds.map(async (classId) => {
        return await ctx.db
          .query("assignment")
          .withIndex("by_classCatalogId", (q) => q.eq("classCatalogId", classId))
          .collect();
      });

      const assignmentsByClass = await Promise.all(assignmentPromises);
      assignments = assignmentsByClass.flat();
    } else {
      // Sin permisos, devolver array vacío
      return [];
    }

    // Enriquecer cada tarea con la rúbrica de calificación y la información del grupo
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const [gradeRubric, classCatalog] = await Promise.all([
          ctx.db.get(a.gradeRubricId),
          ctx.db.get(a.classCatalogId)
        ]);

        let group = null;
        if (classCatalog?.groupId) {
          group = await ctx.db.get(classCatalog.groupId);
        }

        return {
          ...a,
          gradeRubric,
          group: group ? {
            _id: group._id,
            name: group.name,
            grade: group.grade,
            section: group.name
          } : null
        } as typeof a & {
          gradeRubric: { _id: Id<"gradeRubric">; name: string } | null;
          group: { _id: Id<"group">; name: string; grade: number; section: string } | null;
        };
      })
    );

    return enriched;
  },
});

/**
 * Administrador: Obtiene todas las tareas de una clase específica.
 */
export const getAdminAssignmentsByClass = query({
  args: { classCatalogId: v.id("classCatalog") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) throw new Error("Clase no encontrada.");

    // Validamos que el usuario sea administrador de la escuela
    const isAdmin = await ctx.runQuery(
      internal.functions.assignment.isAdminOfSchool,
      { userId: user._id, schoolId: classCatalog.schoolId }
    );
    if (!isAdmin) {
      throw new Error("Acceso denegado: No eres un administrador.");
    }

    return await ctx.db
      .query("assignment")
      .withIndex("by_classCatalogId", (q) => q.eq("classCatalogId", args.classCatalogId))
      .collect();
  },
});

/**
 * Obtiene el progreso de entregas para todas las tareas del profesor.
 * Retorna información básica de progreso para cada tarea.
 */
export const getTeacherAssignmentsProgress = query({
  args: {
    schoolId: v.id("school"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    let assignments = [];

    if (args.canViewAll) {
      // Superadmin, Admin, Auditor: ver todas las asignaciones de la escuela
      const schoolClasses = await ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .collect();

      const schoolClassIds = schoolClasses.map(c => c._id);

      const assignmentPromises = schoolClassIds.map(async (classId) => {
        return await ctx.db
          .query("assignment")
          .withIndex("by_classCatalogId", (q) => q.eq("classCatalogId", classId))
          .collect();
      });

      const assignmentsByClass = await Promise.all(assignmentPromises);
      assignments = assignmentsByClass.flat();
    } else if (args.teacherId) {
      // Teacher: ver solo sus asignaciones
      assignments = await ctx.db
        .query("assignment")
        .withIndex("by_createdBy", (q) => q.eq("createdBy", args.teacherId!))
        .collect();

      // Filtrar solo las que pertenecen a la escuela
      const schoolClasses = await ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .collect();

      const schoolClassIds = schoolClasses.map(c => c._id);
      assignments = assignments.filter(a => schoolClassIds.includes(a.classCatalogId));
    } else if (args.tutorId) {
      // Tutor: ver asignaciones de las clases donde tiene estudiantes
      const tutorStudentClasses = await ctx.db
        .query("studentClass")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      const tutorStudents = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
        .collect();

      const tutorStudentIds = tutorStudents.map(s => s._id);

      const tutorClassIds = tutorStudentClasses
        .filter(sc => tutorStudentIds.includes(sc.studentId))
        .map(sc => sc.classCatalogId);

      const uniqueTutorClassIds = [...new Set(tutorClassIds)];

      const assignmentPromises = uniqueTutorClassIds.map(async (classId) => {
        return await ctx.db
          .query("assignment")
          .withIndex("by_classCatalogId", (q) => q.eq("classCatalogId", classId))
          .collect();
      });

      const assignmentsByClass = await Promise.all(assignmentPromises);
      assignments = assignmentsByClass.flat();
    } else {
      // Sin permisos, devolver array vacío
      return [];
    }

    // Para cada tarea, obtener el progreso de entregas
    const assignmentsWithProgress = await Promise.all(
      assignments.map(async (assignment) => {
        // Obtener todos los estudiantes de la clase
        const studentClasses = await ctx.db
          .query("studentClass")
          .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", assignment.classCatalogId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        // Obtener las calificaciones (entregas) para esta asignación
        const grades = await ctx.db
          .query("grade")
          .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
          .collect();

        // Calcular estadísticas
        const totalStudents = studentClasses.length;
        const submittedCount = grades.length;

        return {
          assignmentId: assignment._id,
          totalStudents,
          submittedCount,
          pendingCount: totalStudents - submittedCount,
          progressPercentage: totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0,
        };
      })
    );

    return assignmentsWithProgress;
  },
});

/**
 * Obtiene todas las asignaciones para propósitos de filtrado
 * (versión ligera sin enriquecimiento para optimizar rendimiento)
 */
export const getAllAssignmentsForFilters = query({
  args: {
    schoolId: v.id("school"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    let assignments = [];

    if (args.canViewAll) {
      // Superadmin, Admin, Auditor: ver todas las asignaciones de la escuela
      const schoolClasses = await ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .collect();

      const schoolClassIds = schoolClasses.map(c => c._id);

      const assignmentPromises = schoolClassIds.map(async (classId) => {
        return await ctx.db
          .query("assignment")
          .withIndex("by_classCatalogId", (q) => q.eq("classCatalogId", classId))
          .collect();
      });

      const assignmentsByClass = await Promise.all(assignmentPromises);
      assignments = assignmentsByClass.flat();
    } else if (args.teacherId) {
      // Teacher: ver solo sus asignaciones
      assignments = await ctx.db
        .query("assignment")
        .withIndex("by_createdBy", (q) => q.eq("createdBy", args.teacherId!))
        .collect();

      // Filtrar solo las que pertenecen a la escuela
      const schoolClasses = await ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .collect();

      const schoolClassIds = schoolClasses.map(c => c._id);
      assignments = assignments.filter(a => schoolClassIds.includes(a.classCatalogId));
    } else if (args.tutorId) {
      // Tutor: ver asignaciones de las clases donde tiene estudiantes
      const tutorStudentClasses = await ctx.db
        .query("studentClass")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      const tutorStudents = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
        .collect();

      const tutorStudentIds = tutorStudents.map(s => s._id);

      const tutorClassIds = tutorStudentClasses
        .filter(sc => tutorStudentIds.includes(sc.studentId))
        .map(sc => sc.classCatalogId);

      const uniqueTutorClassIds = [...new Set(tutorClassIds)];

      const assignmentPromises = uniqueTutorClassIds.map(async (classId) => {
        return await ctx.db
          .query("assignment")
          .withIndex("by_classCatalogId", (q) => q.eq("classCatalogId", classId))
          .collect();
      });

      const assignmentsByClass = await Promise.all(assignmentPromises);
      assignments = assignmentsByClass.flat();
    } else {
      // Sin permisos, devolver array vacío
      return [];
    }

    // Enriquecimiento mínimo solo para información de filtros
    const assignmentsWithBasicInfo = await Promise.all(
      assignments.map(async (a) => {
        const [gradeRubric, classCatalog] = await Promise.all([
          ctx.db.get(a.gradeRubricId),
          ctx.db.get(a.classCatalogId)
        ]);

        let group = null;
        if (classCatalog?.groupId) {
          group = await ctx.db.get(classCatalog.groupId);
        }

        return {
          _id: a._id,
          name: a.name,
          description: a.description,
          dueDate: a.dueDate,
          maxScore: a.maxScore,
          classCatalogId: a.classCatalogId,
          termId: a.termId,
          gradeRubricId: a.gradeRubricId,
          createdBy: a.createdBy,
          _creationTime: a._creationTime,
          gradeRubric: gradeRubric ? {
            _id: gradeRubric._id,
            name: gradeRubric.name
          } : null,
          group: group ? {
            _id: group._id,
            name: group.name,
            grade: group.grade
          } : null
        };
      })
    );

    return assignmentsWithBasicInfo;
  },
});

/**
 * Obtiene los detalles de entregas de una asignación específica.
 * Incluye información de estudiantes que entregaron y los pendientes.
 */
export const getAssignmentDeliveryDetails = query({
  args: { assignmentId: v.id("assignment") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    // Obtener la asignación
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Asignación no encontrada.");

    // Obtener la clase
    const classCatalog = await ctx.db.get(assignment.classCatalogId);
    if (!classCatalog) throw new Error("Clase no encontrada.");

    // Validar que el usuario sea el profesor de la clase o administrador
    const isTeacher = classCatalog.teacherId === user._id;
    const isAdmin = await ctx.runQuery(
      internal.functions.assignment.isAdminOfSchool,
      { userId: user._id, schoolId: classCatalog.schoolId }
    );

    if (!isTeacher && !isAdmin) {
      throw new Error("Acceso denegado: No tienes permisos para ver esta información.");
    }

    // Obtener todos los estudiantes de la clase
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", assignment.classCatalogId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Obtener las calificaciones (entregas) para esta asignación
    const grades = await ctx.db
      .query("grade")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();

    // Obtener información detallada de los estudiantes
    const studentsWithDetails = await Promise.all(
      studentClasses.map(async (sc) => {
        const student = await ctx.db.get(sc.studentId);
        if (!student) return null;

        // Verificar si el estudiante entregó (tiene calificación)
        const grade = grades.find(g => g.studentClassId === sc._id);

        return {
          studentClassId: sc._id,
          studentId: student._id,
          name: `${student.name} ${student.lastName || ""}`.trim(),
          enrollment: student.enrollment,
          submitted: !!grade,
          grade: grade?.score || null,
          submittedDate: grade?.updatedAt ? new Date(grade.updatedAt).toISOString() : null,
        };
      })
    );

    // Filtrar estudiantes válidos y separar por estado de entrega
    const submittedStudents: any[] = [];
    const pendingStudents: any[] = [];

    studentsWithDetails.forEach(student => {
      if (student) {
        if (student.submitted) {
          submittedStudents.push(student);
        } else {
          pendingStudents.push(student);
        }
      }
    });

    return {
      assignment: {
        _id: assignment._id,
        name: assignment.name,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
      },
      classCatalog: {
        _id: classCatalog._id,
        name: classCatalog.name,
      },
      totalStudents: submittedStudents.length + pendingStudents.length, // Total de estudiantes válidos
      submittedCount: submittedStudents.length,
      pendingCount: pendingStudents.length,
      submittedStudents,
      pendingStudents,
    };
  },
});

// ########################################################################
//                       CRUD OPERATIONS (PUBLIC MUTATIONS)
// ########################################################################

/**
 * Maestro: Crea una nueva tarea.
 */
export const createAssignment = mutation({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
    gradeRubricId: v.id("gradeRubric"),
    name: v.string(),
    description: v.optional(v.string()),
    dueDate: v.number(),
    maxScore: v.number(),
  },
  handler: async (ctx, args): Promise<Id<"assignment">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");
    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    const createdBy = user._id;

    const newAssignment = { ...args, createdBy };
    return await ctx.runMutation(internal.functions.assignment.create, newAssignment);
  },
});

/**
 * Maestro: Actualiza una tarea que creó.
 */
export const updateAssignment = mutation({
  args: {
    id: v.id("assignment"),
    patch: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      dueDate: v.optional(v.number()),
      maxScore: v.optional(v.number()),
      classCatalogId: v.optional(v.id("classCatalog")),
      termId: v.optional(v.id("term")),
      gradeRubricId: v.optional(v.id("gradeRubric")),
    }),
  },
  handler: async (ctx, args): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");
    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    const existingAssignment = await ctx.db.get(args.id);
    if (!existingAssignment) {
      throw new Error("Tarea no encontrada.");
    }

    // Validamos que el usuario sea el creador de la tarea
    if (existingAssignment.createdBy !== user._id) {
      throw new Error("Acceso denegado: Solo puedes editar tus propias tareas.");
    }

    await ctx.runMutation(internal.functions.assignment.update, {
      id: args.id,
      patch: args.patch,
    });
  },
});

/**
 * Maestro: Elimina una tarea que creó.
 */
export const deleteAssignment = mutation({
  args: { id: v.id("assignment") },
  handler: async (ctx, args): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");
    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    const existingAssignment = await ctx.db.get(args.id);
    if (!existingAssignment) {
      throw new Error("Tarea no encontrada.");
    }

    // Validamos que el usuario sea el creador de la tarea
    if (existingAssignment.createdBy !== user._id) {
      throw new Error("Acceso denegado: Solo puedes eliminar tus propias tareas.");
    }

    await ctx.runMutation(internal.functions.assignment.delete_, { id: args.id });
  },
});

export const getAssignmentsByClassAndTerm = query({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignment")
      .withIndex("by_classCatalogId", (q) =>
        q.eq("classCatalogId", args.classCatalogId)
      )
      .filter((q) => q.eq(q.field("termId"), args.termId))
      .collect();
  },
});

// ########################################################################
//                       CRUD OPERATIONS (INTERNAL)
// ########################################################################
// Estas funciones de bajo nivel solo pueden ser llamadas por otras funciones de Convex.

export const create = internalMutation({
  args: assignmentFields,
  handler: (ctx, args) => ctx.db.insert("assignment", args),
});

export const read = internalQuery({
  args: { id: v.id("assignment") },
  handler: (ctx, args) => ctx.db.get(args.id),
});

export const update = internalMutation({
  args: {
    id: v.id("assignment"),
    patch: v.object(
      Object.fromEntries(
        Object.entries(assignmentFields).map(([k, val]) => [k, v.optional(val)])
      )
    ),
  },
  handler: (ctx, args) => ctx.db.patch(args.id, args.patch),
});

export const delete_ = internalMutation({
  args: { id: v.id("assignment") },
  handler: (ctx, args) => ctx.db.delete(args.id),
});