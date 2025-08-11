import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Create
export const createClassCatalog = mutation({
    args: {
        schoolCycleId: v.id("schoolCycle"),
        subjectId: v.id("subject"),
        classroomId: v.id("classroom"),
        teacherId: v.id("user"),
        groupId: v.optional(v.id("group")),
        // scheduleId: v.id("schedule"),
        name: v.string(),
        status: v.union(
            v.literal('active'),
            v.literal('inactive')
        ),
        createdBy: v.optional(v.id("user")),
        updatedAt: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("classCatalog", args);
    },
});

// Read
export const getAllClassCatalog = query({
    handler: async (ctx, args) => {
        const catalog = await ctx.db
            .query("classCatalog")
            .collect();

        const res = await Promise.all(
            catalog.map(async (clase) => {
              const [cycle, subject, classroom, teacher, group] = await Promise.all([
                clase.schoolCycleId ? ctx.db.get(clase.schoolCycleId) : null,
                clase.subjectId ? ctx.db.get(clase.subjectId) : null,
                clase.classroomId ? ctx.db.get(clase.classroomId) : null,
                clase.teacherId ? ctx.db.get(clase.teacherId) : null,
                clase.groupId ? ctx.db.get(clase.groupId) : null,
              ]);

              return {
                _id: clase._id,
                name: clase.name,
                status: clase.status,
                createdBy: clase.createdBy,
                updatedAt: clase.updatedAt,
                schoolCycle: cycle,
                subject,
                classroom,
                teacher,
                group,
              }
            }),
        );

        return res;
    },
});

export const getClassCatalog = query({
    args: {
        _id: v.id("classCatalog")
    },
    handler: async (ctx, args) => {
        const catalog = await ctx.db.get(args._id);
        if (!catalog) return null;
        return catalog;
    }
});

// Update
export const updateClassCatalog = mutation({
    args: {
        _id: v.id("classCatalog"),
        schoolCycleId: v.id("schoolCycle"),
        subjectId: v.id("subject"),
        classroomId: v.id("classroom"),
        teacherId: v.id("user"),
        groupId: v.optional(v.id("group")),
        // scheduleId: v.id("schedule"),
        name: v.string(),
        status: v.union(
            v.literal('active'),
            v.literal('inactive')
        ),
        createdBy: v.optional(v.id("user")),
        updatedAt: v.number(),
    },
    handler: async (ctx, args) => {
        const catalog = await ctx.db.get(args._id);

        if (!catalog) return null;

        const { _id, ...data } = args;
        await ctx.db.patch(_id, data);
    }
});

export const deleteClassCatalog = mutation({
    args: { _id: v.id("classCatalog") },
    handler: async (ctx, args) => {
        const catalog = await ctx.db.get(args._id);
        if (!catalog) return null;
        await ctx.db.delete(args._id);
    }
});
