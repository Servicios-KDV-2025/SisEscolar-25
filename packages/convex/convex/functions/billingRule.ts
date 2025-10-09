import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Queries
 */
export const getAllBillingRulesBySchool = query({
    args: {
        schoolId: v.id('school')
    },
    handler: async (ctx, args) => {
        const school = await ctx.db.get(args.schoolId);
        if (!school) {
            throw new Error('La escuela no existe');
        }

        return await ctx.db
            .query("billingRule")
            .withIndex("by_school", q => q.eq("schoolId", args.schoolId))
            .collect();
    },
});

export const getBillingRuleByIdAndSchool = query({
    args: {
        _id: v.id('billingRule'),
        schoolId: v.id('school')
    },
    handler: async (ctx, args) => {
        const billingRule = await ctx.db.get(args._id);
        const school = await ctx.db.get(args.schoolId);
        // Verify that the billingRule exists and belongs to the correct school
        if (!billingRule || !school) {
            throw new Error("La regla de facturación no se encuentra o no pertenece a esta escuela.");
        }
        return billingRule;
    }
});

/**
 * *Mutations
 */
export const createBillingRuleWithSchoolId = mutation({
    args: {
        schoolId: v.id("school"),
        name: v.string(),
        description: v.optional(v.string()),
        type: v.union(
            v.literal("late_fee"),
            v.literal("early_discount"),
            v.literal("cutoff")
        ),
        scope: v.union(
            v.literal("estandar"),
            v.literal("becarios"),
            v.literal("all_students")
        ),
        status: v.union(v.literal("active"), v.literal("inactive")),
        lateFeeType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
        lateFeeValue: v.optional(v.number()),
        startDay: v.optional(v.number()),
        endDay: v.optional(v.number()),
        maxUses: v.optional(v.number()),
        usedCount: v.optional(v.number()),
        cutoffAfterDays: v.optional(v.number()),
        createdBy: v.id("user"),
        updatedBy: v.id("user"),
    },
    handler: async (ctx, args) => {
        const existSchool = await ctx.db.get(args.schoolId);
        if (!existSchool) {
            throw new Error(
                "No se pudo crear la regla de facturación."
            );
        }

        const existingBillingRule = await ctx.db
            .query("billingRule")
            .withIndex("by_school", q =>
                q.eq("schoolId", args.schoolId)
            )
            .filter(q => q.eq(q.field("name"), args.name))
            .first();

        if (existingBillingRule) {
            throw new Error("Ya existe una regla de facturación con el mismo nombre en esta escuela");
        }

        const now = Date.now();
        return await ctx.db.insert("billingRule", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    }
});

export const updateBillingRuleWithSchoolId = mutation({
    args: {
        _id: v.id("billingRule"),
        schoolId: v.id("school"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        type: v.optional(v.union(
            v.literal("late_fee"),
            v.literal("early_discount"),
            v.literal("cutoff")
        )),
        scope: v.optional(v.union(
            v.literal("estandar"),
            v.literal("becarios"),
            v.literal("all_students")
        )),
        status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
        lateFeeType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
        lateFeeValue: v.optional(v.number()),
        startDay: v.optional(v.number()),
        endDay: v.optional(v.number()),
        maxUses: v.optional(v.number()),
        usedCount: v.optional(v.number()),
        cutoffAfterDays: v.optional(v.number()),
        updatedBy: v.id("user"),
        updatedAt: v.number(),
    },
    handler: async (ctx, args) => {
        const { _id, schoolId, ...data } = args;

        const existBillingRule = await ctx.db.get(_id);
        if (!existBillingRule || existBillingRule.schoolId !== schoolId) {
            throw new Error(
                "Cannot update: BillingRule not found or does not belong to the specified school."
            );
        }

        await ctx.db.patch(_id, data);
        return await ctx.db.get(_id);
    }
});

export const deleteBillingRuleWithSchoolId = mutation({
    args: {
        _id: v.id("billingRule"),
        schoolId: v.id("school")
    },
    handler: async (ctx, args) => {
        const { _id, schoolId, ...data } = args;

        const existBillingRule = await ctx.db.get(_id);
        if (!existBillingRule || existBillingRule.schoolId !== schoolId) {
            throw new Error(
                "Cannot delete: BillingRule not found or does not belong to the specified school."
            );
        }
        await ctx.db.delete(args._id);
        return {
            deleted: true,
            message: 'BillingRule deleted successfully'
        };
    },
});