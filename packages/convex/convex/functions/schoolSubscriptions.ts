import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const saveSubscription = internalMutation({
  args: {
    schoolId: v.id("school"),
    userId: v.id("user"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    currency: v.string(),
    plan: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("trialing"),
      v.literal("inactive")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number()
  },
  handler: async (ctx, args) => {

    const existing = await ctx.db
      .query("schoolSubscription")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { status: "inactive", updatedAt: Date.now() });
    }

    await ctx.db.insert("schoolSubscription", {
      schoolId: args.schoolId,
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      currency: args.currency,
      plan: args.plan,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateSubscription = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("trialing"),
      v.literal("inactive")
    ),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("schoolSubscription")
      .withIndex("by_stripeSubscriptionId", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now()
    };

    await ctx.db.patch(subscription._id, updateData);
  },
});

export const getSubscriptionByStripeId = internalQuery({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("schoolSubscription")
      .withIndex("by_stripeSubscriptionId", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();

    return subscription;
  },
});