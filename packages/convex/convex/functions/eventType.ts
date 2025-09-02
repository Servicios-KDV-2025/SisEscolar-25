import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createEventType = mutation({
  args: {
    schoolId: v.id("school"),
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("eventType", {
      ...args,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const editEventType = mutation({
  args: {
    schoolId: v.id("school"),
    eventTypeId: v.id("eventType"),
    name: v.optional(v.string()),
    key: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive')
  )),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventTypeId);
    if (!event || event.schoolId !== args.schoolId) throw new Error("Not authorized or not found");
    await ctx.db.patch(args.eventTypeId, {
      name: args.name, 
      key: args.key,
      description: args.description,
      color: args.color,
      icon: args.icon,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const getEventType = query({
  args: {
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventType")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

export const getEventTypeById = query({
  args: {
    schoolId: v.id("school"),
    eventTypeId: v.id("eventType"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventTypeId);
    if (!event || event.schoolId !== args.schoolId) {
      throw new Error("Event Type not found or does not belong to this school.");
    }
    return event;
  },
});

export const deleteEventType = mutation({
  args: {
    schoolId: v.id("school"),
    eventTypeId: v.id("eventType"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventTypeId);
    if (!event || event.schoolId !== args.schoolId) throw new Error("Not authorized or not found");
    return await ctx.db.patch(args.eventTypeId, { status: "inactive", updatedAt: Date.now() });
  },
});