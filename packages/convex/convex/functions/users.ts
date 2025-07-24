import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
    args: { 
        name: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.string(),
        address: v.string(),
        birthDate: v.string(),
        admissionDate: v.string(),
        imgUrl: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.insert('user', { 
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    }
});

export const getUsers = query({
    args: {

    },
    handler: async (ctx, args) => {
        return ctx.db.query("user").collect();
    }
})