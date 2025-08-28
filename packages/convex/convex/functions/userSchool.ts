import { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Obtener todas las relaciones usuario-escuela
export const getAllUserSchool = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userSchool").collect();
  },
});

// Obtener por userId
export const getByUserId = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSchool")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Obtener por schoolId
export const getBySchoolId = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSchool")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();
  },
});

// Obtener por rol específico
export const getByRole = query({
  args: {
    role: v.union(
      v.literal("superadmin"),
      v.literal("admin"),
      v.literal("auditor"),
      v.literal("teacher"),
      v.literal("tutor")
    )
  },
  handler: async (ctx, args) => {
    const allRelations = await ctx.db.query("userSchool").collect();
    return allRelations.filter(relation =>
      relation.role.includes(args.role)
    );
  },
});


// Obtener por estado
export const getByStatus = query({
  args: { status: v.union(v.literal("active"), v.literal("inactive")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSchool")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Obtener por departamento
export const getByDepartment = query({
  args: {
    department: v.optional(
      v.union(
        v.literal("secretary"),
        v.literal("direction"),
        v.literal("schoolControl"),
        v.literal("technology")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (!args.department) {
      return await ctx.db.query("userSchool").collect();
    }
    return await ctx.db
      .query("userSchool")
      .withIndex("by_department", (q) => q.eq("department", args.department))
      .collect();
  },
});

// Obtener relación específica usuario-escuela
export const getByUserAndSchool = query({
  args: {
    userId: v.id("user"),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSchool")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
      .first();
  },
});

// Verificar si un usuario tiene un rol específico en una escuela
export const hasRoleInSchool = query({
  args: {
    userId: v.id("user"),
    schoolId: v.id("school"),
    role: v.union(
      v.literal("superadmin"),
      v.literal("admin"),
      v.literal("auditor"),
      v.literal("teacher"),
      v.literal("tutor")
    ),
  },
  handler: async (ctx, args) => {
    const relations = await ctx.db
      .query("userSchool")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("schoolId"), args.schoolId),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    // Filtrar en memoria para verificar el rol
    return relations.some(relation =>
      relation.role.includes(args.role)
    );
  },
});

// Obtener usuarios por múltiples roles (query adicional útil)
export const getByRoles = query({
  args: {
    roles: v.array(
      v.union(
        v.literal("superadmin"),
        v.literal("admin"),
        v.literal("auditor"),
        v.literal("teacher"),
        v.literal("tutor")
      )
    )
  },
  handler: async (ctx, args) => {
    const allRelations = await ctx.db.query("userSchool").collect();
    return allRelations.filter(relation =>
      args.roles.some(role => relation.role.includes(role))
    );
  },
});

// Obtener usuarios por rol y escuela (query adicional útil)
export const getByRoleAndSchool = query({
  args: {
    schoolId: v.id("school"),
    role: v.union(
      v.literal("superadmin"),
      v.literal("admin"),
      v.literal("auditor"),
      v.literal("teacher"),
      v.literal("tutor")
    ),
  },
  handler: async (ctx, args) => {
    const relations = await ctx.db
      .query("userSchool")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return relations.filter(relation =>
      relation.role.includes(args.role)
    );
  },
});


//* Mutation
// Crear nueva relación usuario-escuela
export const create = mutation({
  args: {
    userId: v.id("user"),
    schoolId: v.id("school"),
    role: v.array(
      v.union(
        v.literal("superadmin"),
        v.literal("admin"),
        v.literal("auditor"),
        v.literal("teacher"),
        v.literal("tutor")
      )
    ),
    status: v.union(v.literal("active"), v.literal("inactive")),
    department: v.optional(
      v.union(
        v.literal("secretary"),
        v.literal("direction"),
        v.literal("schoolControl"),
        v.literal("technology")
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("userSchool", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Actualizar relación existente
export const update = mutation({
  args: {
    id: v.id("userSchool"),
    role: v.optional(
      v.array(
        v.union(
          v.literal("superadmin"),
          v.literal("admin"),
          v.literal("auditor"),
          v.literal("teacher"),
          v.literal("tutor")
        )
      )
    ),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    department: v.optional(
      v.union(
        v.literal("secretary"),
        v.literal("direction"),
        v.literal("schoolControl"),
        v.literal("technology"),
        v.null()
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Preparar los datos de actualización
    const updateData: Partial<Doc<"userSchool">> & { updatedAt: number } = {
      updatedAt: Date.now(),
    };

    // Agregar solo los campos que están definidos
    if (args.role !== undefined) {
      updateData.role = args.role;
    }

    if (args.status !== undefined) {
      updateData.status = args.status;
    }

    // Manejar department: si es null, lo establecemos como undefined
    if (args.department !== undefined) {
      updateData.department = args.department === null ? undefined : args.department;
    }

    await ctx.db.patch(id, updateData);
    return await ctx.db.get(id);
  },
});


// Agregar rol a un usuario
export const addRole = mutation({
  args: {
    id: v.id("userSchool"),
    role: v.union(
      v.literal("superadmin"),
      v.literal("admin"),
      v.literal("auditor"),
      v.literal("teacher"),
      v.literal("tutor")
    ),
  },
  handler: async (ctx, args) => {
    const relation = await ctx.db.get(args.id);
    if (!relation) throw new Error("Relación no encontrada");

    if (!relation.role.includes(args.role)) {
      const newRoles = [...relation.role, args.role];
      await ctx.db.patch(args.id, {
        role: newRoles,
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.get(args.id);
  },
});

// Remover rol de un usuario
export const removeRole = mutation({
  args: {
    id: v.id("userSchool"),
    role: v.union(
      v.literal("superadmin"),
      v.literal("admin"),
      v.literal("auditor"),
      v.literal("teacher"),
      v.literal("tutor")
    ),
  },
  handler: async (ctx, args) => {
    const relation = await ctx.db.get(args.id);
    if (!relation) throw new Error("Relación no encontrada");

    const newRoles = relation.role.filter(r => r !== args.role);
    await ctx.db.patch(args.id, {
      role: newRoles,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// Cambiar estado de la relación
export const changeStatus = mutation({
  args: {
    id: v.id("userSchool"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// Eliminar relación usuario-escuela
export const remove = mutation({
  args: {
    id: v.id("userSchool"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Eliminar todas las relaciones de un usuario en una escuela
export const removeByUserAndSchool = mutation({
  args: {
    userId: v.id("user"),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    const relations = await ctx.db
      .query("userSchool")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
      .collect();

    await Promise.all(relations.map(relation =>
      ctx.db.delete(relation._id)
    ));

    return { success: true, deletedCount: relations.length };
  },
});