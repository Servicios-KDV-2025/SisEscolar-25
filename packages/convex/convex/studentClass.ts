import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Verifica si un usuario es el tutor de un estudiante.
 */
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

/**
 * Verifica si un usuario es profesor de una clase específica.
 */
export const isTeacherOfClass = internalQuery({
  args: {
    userId: v.id("user"),
    classCatalogId: v.id("classCatalog"),
  },
  handler: async (ctx, args) => {
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) return false;
    return classCatalog.teacherId === args.userId;
  },
});

/**
 * Verifica si un usuario es administrador de una escuela (o superadmin).
 */
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

// Estas son las funciones que el frontend llamará para obtener datos.

/**
 * Profesor/Administrador: Obtiene el listado de promedios para todos los estudiantes
 * de una clase específica. Incluye validación de seguridad.
 */
export const getAveragesForTeacherByClass = query({
  args: {
    classCatalogId: v.id("classCatalog"),
  },
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

    // Validamos si el usuario es profesor de la clase o un administrador de la escuela.
    const isTeacher = await ctx.runQuery(
      internal.studentClass.isTeacherOfClass,
      { userId: user._id, classCatalogId: args.classCatalogId }
    );
    const isAdmin = await ctx.runQuery(
      internal.studentClass.isAdminOfSchool,
      { userId: user._id, schoolId: classCatalog.schoolId }
    );

    if (!isTeacher && !isAdmin) {
      throw new Error("Acceso denegado: No tienes permisos para ver esta clase.");
    }
    
    // Si la validación pasa, devolvemos los promedios.
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .collect();

    // Unimos los datos del estudiante para mostrar su nombre.
    const enrichedResults = await Promise.all(
      studentClasses.map(async (sc) => {
        const student = await ctx.db.get(sc.studentId);
        return {
          ...sc,
          studentName: student?.name,
        };
      })
    );
    return enrichedResults;
  },
});

/**
 * Tutor/Administrador: Obtiene una lista de todas las clases y promedios
 * de un estudiante específico. Incluye validación de seguridad.
 */
export const getAllAveragesForStudent = query({
  args: { studentId: v.id("student") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");
    
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Estudiante no encontrado.");

    // Validamos si el usuario es el tutor del estudiante o un administrador.
    const isTutor = await ctx.runQuery(
      internal.studentClass.isTutorOfStudent,
      { userId: user._id, studentId: args.studentId }
    );
    const isAdmin = await ctx.runQuery(
      internal.studentClass.isAdminOfSchool,
      { userId: user._id, schoolId: student.schoolId }
    );

    if (!isTutor && !isAdmin) {
      throw new Error("Acceso denegado: No tienes permisos para ver este registro.");
    }

    // Si la validación es exitosa, buscamos todas sus inscripciones.
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Unimos los datos para un resultado más completo (nombre de materia, etc.).
    const enrichedResults = await Promise.all(
      studentClasses.map(async (sc) => {
        const classCatalog = await ctx.db.get(sc.classCatalogId);
        const subject = classCatalog ? await ctx.db.get(classCatalog.subjectId) : null;
        
        return {
          ...sc,
          className: classCatalog?.name,
          subjectName: subject?.name,
        };
      })
    );
    return enrichedResults;
  },
});

/**
 * Administrador: Obtiene todos los registros de studentClass en una escuela.
 * Incluye validación de seguridad.
 */
export const getAveragesForAdmin = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");
    
    const isAdmin = await ctx.runQuery(
      internal.studentClass.isAdminOfSchool,
      { userId: user._id, schoolId: args.schoolId }
    );

    if (!isAdmin) {
      throw new Error("Acceso denegado: No eres un administrador de esta escuela.");
    }
    
    // Si la validación pasa, buscamos todos los registros en la escuela.
    const classCatalogIds = await ctx.db.query("classCatalog")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const result = await Promise.all(
      classCatalogIds.map(async (cc) => 
        ctx.db.query("studentClass")
        .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", cc._id))
        .collect()
      )
    );
    return result.flat();
  },
});

/**
 * R: Obtiene la lista de estudiantes inscritos en una clase,
 * junto con sus datos personales.
 */
export const getStudentsInClass = query({
  args: { classCatalogId: v.id("classCatalog") },
  handler: async (ctx, args) => {
    // 1. Obtener todos los registros de la tabla 'studentClass' para la clase
    const studentClasses = await ctx.db
      .query("studentClass")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .collect();

    // 2. Para cada registro, buscar la información del estudiante
    const studentsWithClassInfo = await Promise.all(
      studentClasses.map(async (sc) => {
        const student = await ctx.db.get(sc.studentId);
        // Devolvemos un objeto que combine la información de ambos
        return {
          ...sc,
          studentName: student?.name,
          studentLastName: student?.lastName,
          // Puedes añadir más datos si los necesitas, como imgUrl
        };
      })
    );

    return studentsWithClassInfo;
  },
});

// ########################################################################
//                       CRUD OPERATIONS (INTERNAL)
// ########################################################################
// Estas funciones de bajo nivel solo pueden ser llamadas por otras funciones de Convex.

export const createStudentClass = internalMutation({
  args: {
    classCatalogId: v.id("classCatalog"),
    studentId: v.id("student"),
    enrollmentDate: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    averageScore: v.optional(v.number()),
    lastCalculatedTermId: v.optional(v.id("term")),
  },
  handler: (ctx, args) => ctx.db.insert("studentClass", args),
});

export const updateStudentClass = internalMutation({
  args: {
    id: v.id("studentClass"),
    patch: v.object({
      classCatalogId: v.optional(v.id("classCatalog")),
      studentId: v.optional(v.id("student")),
      enrollmentDate: v.optional(v.number()),
      status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
      averageScore: v.optional(v.number()),
      lastCalculatedTermId: v.optional(v.id("term")),
    }),
  },
  handler: (ctx, args) => ctx.db.patch(args.id, args.patch),
});

export const deleteStudentClass = internalMutation({
  args: { id: v.id("studentClass") },
  handler: (ctx, args) => ctx.db.delete(args.id),
});