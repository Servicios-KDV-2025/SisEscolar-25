import { mutation, query, internalMutation } from "../_generated/server";
import { v, Validator } from "convex/values";

// Obtener todos los usuarios escolares
export const listUserSchools = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    const listUserSchools = await ctx.db
      .query("userSchool")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    return Promise.all(
      listUserSchools.map(async (userSchool) => {
        const user = await ctx.db.get(userSchool.userId);
        return {
          ...user,
          ...userSchool,
        };
      })
    );
  },
});

//Obtener un usuario escolar por ID
export const getUserSchoolById = query({
  args: { id: v.id("userSchool") },
  handler: async (ctx, args) => {
    //Validar si existe el usuario
    const idUserSchool = await ctx.db.get(args.id);

    if (!idUserSchool) {
      throw new Error("El usuario escolar no existe.");
    }
    const userSchool = await ctx.db
      .query("userSchool")
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .first();

    return {
      ...userSchool,
      user: await ctx.db.get(userSchool!.userId),
    };
  },
});

// Crear un nuevo usuario escolar
export const createUserSchool = mutation({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userSchool = await ctx.db.insert("userSchool", {
      ...args,
    });

    return userSchool;
  },
});

//Actualizar un usuario escolar
export const updateUserSchool = mutation({
  args: {
    id: v.id("userSchool"),
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
    const { id, ...updatingData } = args;
    //Validar si existe el usuario
    const userSchool = await ctx.db.get(args.id);

    if (!userSchool) {
      throw new Error("El usuario escolar no existe.");
    }

    await ctx.db.patch(args.id, {
      ...updatingData,
      updatedAt: Date.now(),
    });
  },
});
