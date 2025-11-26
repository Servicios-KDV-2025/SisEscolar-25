import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const getByIdStudent = internalQuery({
  args: { id: v.id("student") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByIdBilling = internalQuery({
  args: { id: v.id("billing") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByIdBillingConfig = internalQuery({
  args: { id: v.id("billingConfig") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByIdSchool = internalQuery({
  args: { id: v.id("school") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByIdPayments = internalQuery({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});