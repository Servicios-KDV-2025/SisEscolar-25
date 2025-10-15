import { mutation, query } from "../_generated/server";
import { convexToJson, v } from "convex/values";

export const createGroup = mutation({
  args: {
    schoolId: v.id("school"),
    name: v.string(),
    grade: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const existingGroup = await ctx.db
      .query("group")
      .withIndex("by_school_name_grade", q =>
        q.eq("schoolId", args.schoolId)
          .eq("name", args.name)
          .eq("grade", args.grade)
      )
      .first();

    if (existingGroup) {
      throw new Error("Ya existe un grupo con el mismo nombre y grado en esta escuela");
    }

    const newGroupId = await ctx.db.insert("group", {
      schoolId: args.schoolId,
      name: args.name,
      grade: args.grade,
      status: args.status,
    });
    return newGroupId;
  },
});

export const getAllGroupsBySchool = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("group")
      .withIndex("by_school", q => q.eq("schoolId", args.schoolId))
      .collect();

    return groups;
  },
});

export const getGroupById = query({
  args: {
    _id: v.id("group"),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args._id);
    // Verifica si el grupo existe y si pertenece a la escuela correcta.
    if (!group || group.schoolId !== args.schoolId) return null;
    return group;
  },
});

export const updateGroup = mutation({
  args: {
    _id: v.id("group"),
    schoolId: v.id("school"),
    name: v.optional(v.string()),
    grade: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id("user")),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args._id);
    if (!group || group.schoolId !== args.schoolId) {
      throw new Error("Acceso denegado o grupo no encontrado");
    }

    if (args.name || args.grade) {
      const newName = args.name ?? group.name;
      const newGrade = args.grade ?? group.grade;

      // Buscar grupos con el mismo nombre y grado, excluyendo el actual
      const duplicateGroup = await ctx.db
        .query("group")
        .withIndex("by_school_name_grade", q =>
          q.eq("schoolId", args.schoolId)
            .eq("name", newName)
            .eq("grade", newGrade)
        )
        .filter(q => q.neq(q.field("_id"), args._id))
        .first();

      if (duplicateGroup) {
        throw new Error("Ya existe otro grupo con el mismo nombre y grado en esta escuela");
      }
    }

    const { _id, ...data } = args;
    await ctx.db.patch(_id, {
      ...data,
      updatedAt: Date.now(),
    });
  },
});

export const deleteGroup = mutation({
  args: {
    _id: v.id("group"),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args._id);
    if (!group || group.schoolId !== args.schoolId) {
      throw new Error("Acceso denegado o grupo no encontrado");
    }
    await ctx.db.delete(args._id);
  },
});



export const getUniqueGrades = query({
  args:{schoolId: v.id("school")},
  handler : async(ctx,args) =>{
    const grooups = await ctx.db
    .query("group")
    .withIndex("by_school", q => q.eq("schoolId", args.schoolId))
    .filter(q => q.eq(q.field("status"), "active"))
    .collect();

     const uniqueGrades = [...new Set(grooups.map(group => group.grade))]

     return uniqueGrades;
  },
});