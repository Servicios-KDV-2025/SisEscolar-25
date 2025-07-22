import { mutation, query } from "_generated/server";
import { v } from "convex/values";


export const createUser = mutation({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.insert('user', { ...args });
    }
});

export const getUsers = query({
    args: {

    },
    handler: async (ctx, args) => {
        return ctx.db.query("user").collect();
    }
})