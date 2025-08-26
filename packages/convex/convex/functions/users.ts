import { mutation, query, internalMutation, internalQuery } from "../_generated/server";
import { v, Validator } from "convex/values";
import { UserJSON } from "@clerk/backend";

//=============== CLERK USERS FUNCTIONS ===============
export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    // Validación de datos requeridos
    if (!data.id) {
      throw new Error("Clerk user ID is required");
    }

    // Manejar email de forma segura
    let email = "";
    if (data.email_addresses && data.email_addresses.length > 0) {
      email = data.email_addresses[0]?.email_address || "";
    }

    // Manejar teléfono de forma segura
    let phone = "";
    if (data.phone_numbers && data.phone_numbers.length > 0) {
      phone = data.phone_numbers[0]?.phone_number || "";
    }

    const userAttributes = {
      name: data.first_name ?? "",
      lastName: data.last_name ?? "",
      email: email,
      phone: phone,
      address: "", // Clerk no proporciona dirección por defecto
      birthDate: Date.now(), // Clerk no proporciona fecha de nacimiento por defecto
      admissionDate: Date.now(), // Campo específico de tu aplicación
      imgUrl: data.image_url ?? "",
      clerkId: data.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "active" as const,
    };

    // Busca por clerkId
    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", data.id))
      .unique();

    if (user === null) {
      // Crear nuevo usuario
      await ctx.db.insert("user", userAttributes);
    } else {
      // Actualizar usuario existente, preservando createdAt original
      await ctx.db.patch(user._id, {
        ...userAttributes,
        createdAt: user.createdAt,
      });
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkUserId))
      .unique();
    if (user !== null) {
      await ctx.db.delete(user._id);
    }
  },
});

//=============== USERS CRUD FUNCTIONS ===============

// CREATE - Crear usuario
export const createUser = mutation({
  args: {
    name: v.string(),
    lastName: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    admissionDate: v.optional(v.number()),
    imgUrl: v.optional(v.string()),
    clerkId: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validar que el email no esté duplicado (usar índice por email)
    const existingUser = await ctx.db
      .query("user")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Ya existe un usuario con este email");
    }

    // Validar que el clerkId no esté duplicado
    const existingClerkUser = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingClerkUser) {
      throw new Error("Ya existe un usuario con este Clerk ID");
    }

    const userId = await ctx.db.insert("user", {
      ...args,
      createdAt: now,
      updatedAt: now,
      status: args.status || "active",
    });

    return userId;
  },
});

// READ - Obtener todos los usuarios
export const getUsers = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("user").collect();

    // Filtrar por status si se proporciona
    if (args.status) {
      users = users.filter((user) => user.status === args.status);
    }

    // Aplicar paginación
    if (args.offset) {
      users = users.slice(args.offset);
    }

    if (args.limit) {
      users = users.slice(0, args.limit);
    }

    return users;
  },
});

// READ - Obtener usuario por ID (internal)
export const getUserById = internalQuery({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user;
  },
});

// READ - Obtener usuario por Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    // Retornar null si no existe, útil para queries en el cliente
    return user ?? null;
  },
});

// READ - Buscar usuarios por nombre o email
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("user").collect();

    // Filtrar por status si se proporciona
    if (args.status) {
      users = users.filter((user) => user.status === args.status);
    }

    // Buscar por nombre o email
    const searchTerm = args.searchTerm.toLowerCase();
    users = users.filter(
      (user) =>
        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
    );

    // Aplicar límite
    if (args.limit) {
      users = users.slice(0, args.limit);
    }

    return users;
  },
});

// UPDATE - Actualizar usuario
export const updateUser = mutation({
  args: {
    userId: v.id("user"),
    name: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    admissionDate: v.optional(v.number()),
    imgUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const { userId, ...updateData } = args;

    // Verificar que el usuario existe
    const existingUser = await ctx.db.get(userId);
    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    // Si se está actualizando el email, verificar que no esté duplicado (usar índice por email)
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailToCheck = updateData.email as string;
      const emailHolder = await ctx.db
        .query("user")
        .withIndex("by_email", (q) => q.eq("email", emailToCheck))
        .first();

      if (emailHolder && emailHolder._id !== userId) {
        throw new Error("Ya existe un usuario con este email");
      }
    }

    // Actualizar usuario
    await ctx.db.patch(userId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

// UPDATE - Cambiar status del usuario
export const toggleUserStatus = mutation({
  args: {
    userId: v.id("user"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db.get(args.userId);
    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    await ctx.db.patch(args.userId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.userId);
  },
});

// DELETE - Eliminar usuario (soft delete cambiando status a inactive)
export const deactivateUser = mutation({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db.get(args.userId);
    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    await ctx.db.patch(args.userId, {
      status: "inactive",
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.userId);
  },
});

// DELETE - Eliminar usuario permanentemente
export const deleteUser = mutation({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db.get(args.userId);
    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    // Verificar si el usuario tiene relaciones en otras tablas
    // Por ejemplo, verificar si es tutor de estudiantes
    const studentsAsTutor = await ctx.db
      .query("student")
      .filter((q) => q.eq(q.field("tutorId"), args.userId))
      .collect();

    if (studentsAsTutor.length > 0) {
      throw new Error(
        "No se puede eliminar el usuario porque es tutor de estudiantes"
      );
    }

    // Verificar si tiene roles en escuelas
    const userSchools = await ctx.db
      .query("userSchool")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    if (userSchools.length > 0) {
      throw new Error(
        "No se puede eliminar el usuario porque tiene roles asignados en escuelas"
      );
    }

    await ctx.db.delete(args.userId);
    return { success: true, message: "Usuario eliminado permanentemente" };
  },
});

// UTILITY - Obtener estadísticas de usuarios
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("user").collect();

    const stats = {
      total: allUsers.length,
      active: allUsers.filter((user) => user.status === "active").length,
      inactive: allUsers.filter((user) => user.status === "inactive").length,
      withEmail: allUsers.filter((user) => user.email && user.email.length > 0)
        .length,
      withPhone: allUsers.filter((user) => user.phone && user.phone.length > 0)
        .length,
      withImage: allUsers.filter(
        (user) => user.imgUrl && user.imgUrl.length > 0
      ).length,
    };

    return stats;
  },
});

// UTILITY - Obtener usuarios por rango de fechas de creación
export const getUsersByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("user").collect();

    // Filtrar por rango de fechas
    users = users.filter(
      (user) =>
        user.createdAt >= args.startDate && user.createdAt <= args.endDate
    );

    // Filtrar por status si se proporciona
    if (args.status) {
      users = users.filter((user) => user.status === args.status);
    }

    return users;
  },
});
