
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createCalendarEvent = mutation({
  args: {
    schoolCycleId: v.id("schoolCycle"),
    date: v.number(),
    eventTypeId: v.id("eventType"),
    description: v.optional(v.string()),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("calendar", {
      schoolCycleId: args.schoolCycleId,
      schoolId: args.schoolId,
      date: args.date,
      eventTypeId: args.eventTypeId,
      description: args.description,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const getCalendarEvents = query({
  args: { schoolId: v.id("school"), },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendar")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();
  },
});

export const getSchoolCycleCalendar = query({
  args: { schoolId: v.id("school"), schoolCycleId: v.id("schoolCycle") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendar")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("schoolCycleId"), args.schoolCycleId))
      .collect();
  },
});

export const getCalendarEventById = query({
  args: {
    schoolId: v.id("school"),
    eventId: v.id("calendar"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.schoolId !== args.schoolId) {
      throw new Error("Event not found or does not belong to this school.");
    }
    return event;
  },
});

export const updateCalendarEvent = mutation({
  args: {
    eventId: v.id("calendar"),
    schoolId: v.id("school"),
    date: v.number(),
    eventTypeId: v.id("eventType"),
    description: v.optional(v.string()),
    schoolCycleId: v.id("schoolCycle"),
    status: v.optional(v.union(
        v.literal('active'),
        v.literal('inactive')
    )),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.schoolId !== args.schoolId) throw new Error("Not authorized or not found");
    return await ctx.db.patch(args.eventId, {
      date: args.date,
      eventTypeId: args.eventTypeId,
      description: args.description,
      schoolCycleId: args.schoolCycleId,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const deleteCalendarEvent = mutation({
  args: {
    eventId: v.id("calendar"),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.schoolId !== args.schoolId) throw new Error("Not authorized or not found");
    return await ctx.db.patch(args.eventId, { status: "inactive", updatedAt: Date.now() });
  },
});
