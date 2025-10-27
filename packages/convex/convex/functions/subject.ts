import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Queries
 */
export const getAllSubjectsBySchool = query({
    args: {
        schoolId: v.id('school')
    },
    handler: async (ctx, args) => {
        const school = await ctx.db.get(args.schoolId);
        if (!school) {
            throw new Error('La escuela no existe');
        }

        return await ctx.db
            .query("subject")
            .withIndex("by_school", q => q.eq("schoolId", args.schoolId))
            .collect();
    },
});

export const getSubjectByIdAndSchool = query({
    args: {
        _id: v.id('subject'),
        schoolId: v.id('school')
    },
    handler: async (ctx, args) => {
        const subject = await ctx.db.get(args._id);
        const school = await ctx.db.get(args.schoolId);
        // Verify that the subject exists and belongs to the correct school
        if (!subject || !school) {
            throw new Error("La materia no se encuentra o no pertenece a esta escuela.");
        }
        return subject;
    }
});
/**
 * *Mutations
 */
export const createSubjectWithSchoolId = mutation({
    args: {
        schoolId: v.id("school"),
        name: v.string(),
        description: v.optional(v.string()),
        credits: v.optional(v.number()),
        status: v.union(v.literal("active"), v.literal("inactive")),
        updatedAt: v.optional(v.number()),
        updatedBy: v.optional(v.id("user")),
    },
    handler: async (ctx, args) => {
        const existSchool = await ctx.db.get(args.schoolId);
        if (!existSchool) {
            throw new Error(
                "No se pudo crear la materia."
            );
        }

        const existingSubject = await ctx.db
            .query("subject")
            .withIndex("by_school_and_name", q =>
                q.eq("schoolId", args.schoolId)
                 .eq("name", args.name)
            )
            .first();

        if (existingSubject) {
            throw new Error("Ya existe esa materia con el mismo nombre en esta escuela");
        }
        return await ctx.db.insert("subject", args);
    }
});

export const updateSubjectWithSchoolId = mutation({
    args: {
        _id: v.id("subject"),
        schoolId: v.id("school"),
        name: v.string(),
        description: v.optional(v.string()),
        credits: v.optional(v.number()),
        status: v.union(v.literal("active"), v.literal("inactive")),
        updatedAt: v.number(),
        updatedBy: v.id("user"),
    },
    handler: async (ctx, args) => {
        const { _id, schoolId, ...data } = args;

        const existSubject = await ctx.db.get(_id);
        if (!existSubject || existSubject.schoolId !== schoolId) {
            throw new Error(
                "Cannot update: Subject not found or does not belong to the specified school."
            );
        }

        await ctx.db.patch(_id, data);
        return await ctx.db.get(_id);
    }
});

export const deleteSubjectWithSchoolId = mutation({
    args: {
        _id: v.id("subject"),
        schoolId: v.id("school")
    },
    handler: async (ctx, args) => {
        const { _id, schoolId, ...data } = args;

        const existSubject = await ctx.db.get(_id);
        if (!existSubject || existSubject.schoolId !== schoolId) {
            throw new Error(
                "Cannot delete: Subject not found or does not belong to the specified school."
            );
        }
        await ctx.db.delete(args._id);
        return {
            deleted: true,
            message: 'Subject deleted successfully'
        };
    },
});
