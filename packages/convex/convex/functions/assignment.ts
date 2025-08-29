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
        if (!classCatalog) return [];

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
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    // Buscamos las tareas por el ID del usuario creador
    return await ctx.db
      .query("assignment")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", user._id))
      .collect();
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