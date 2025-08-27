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
        // Verificamos que la materia exista y que pertenezca a la escuela correcta
        if (!subject || !school) {
            throw new Error("Materia no encontrada o no pertenece a esta escuela.");
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
                "No se puede crear la materia: La escuela especificada no existe."
            );
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
                "No se puede actualizar: Materia no encontrada o no pertenece a la escuela especificada."
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
                "No se puede eliminar: Materia no encontrada o no pertenece a la escuela especificada."
            );
        }
        await ctx.db.delete(args._id);
        return {
            deleted: true,
            message: 'Materia eliminada correctamente'
        };
    },
});
