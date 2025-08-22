import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Create
export const createClassCatalog = mutation({
    args: {
        schoolId: v.id("school"),
        schoolCycleId: v.id("schoolCycle"),
        subjectId: v.id("subject"),
        classroomId: v.id("classroom"),
        teacherId: v.id("user"),
        termId: v.id("term"),
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
    args: {
        schoolId: v.id("school"),
    },
    handler: async (ctx, args) => {
        const catalog = await ctx.db
            .query("classCatalog")
            .collect();

        if (!catalog || !args.schoolId) return null;

        const res = await Promise.all(
            catalog.map(async (clase) => {
                const [cycle, subject, term, classroom, teacher, group] = await Promise.all([
                    clase.schoolCycleId ? ctx.db.get(clase.schoolCycleId) : null,
                    clase.subjectId ? ctx.db.get(clase.subjectId) : null,
                    clase.termId ? ctx.db.get(clase.termId) :null,
                    clase.classroomId ? ctx.db.get(clase.classroomId) : null,
                    clase.teacherId ? ctx.db.get(clase.teacherId) : null,
                    clase.groupId ? ctx.db.get(clase.groupId) : null,
                ]);

                return {
                    // Propiedades base de ClassCatalog
                    _id: clase._id,
                    schoolId: clase.schoolId, // ← Añadir esta
                    schoolCycleId: clase.schoolCycleId, // ← Añadir esta
                    subjectId: clase.subjectId, // ← Añadir esta
                    termId: clase.termId, // ← Añadir esta
                    classroomId: clase.classroomId, // ← Añadir esta
                    teacherId: clase.teacherId, // ← Añadir esta
                    groupId: clase.groupId,
                    name: clase.name,
                    status: clase.status,
                    createdBy: clase.createdBy,
                    updatedAt: clase.updatedAt,

                    // Propiedades extendidas con objetos completos
                    schoolCycle: cycle,
                    subject: subject,
                    term: term,
                    classroom: classroom,
                    teacher: teacher,
                    group: group,
                }
            }),
        );

        return res;
    },
});

export const getClassCatalog = query({
    args: {
        schoolId: v.id("school"),
        _id: v.id("classCatalog")
    },
    handler: async (ctx, args) => {
        const catalog = await ctx.db.get(args._id);

        if (!catalog || catalog.schoolId !== args.schoolId) return null;
        return catalog;
    }
});

// Update
export const updateClassCatalog = mutation({
    args: {
        _id: v.id("classCatalog"),
        schoolId: v.id("school"),
        schoolCycleId: v.id("schoolCycle"),
        subjectId: v.id("subject"),
        classroomId: v.id("classroom"),
        teacherId: v.id("user"),
        termId: v.id("term"),
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

        if (!catalog || catalog.schoolId !== args.schoolId) return null;

        const { _id, ...data } = args;
        await ctx.db.patch(_id, data);
    }
});

export const deleteClassCatalog = mutation({
    args: {
        _id: v.id("classCatalog"),
        schoolId: v.id("school"),
    },
    handler: async (ctx, args) => {
        const catalog = await ctx.db.get(args._id);
        if (!catalog || catalog.schoolId !== args.schoolId) return null;
        await ctx.db.delete(args._id);
    }
});
