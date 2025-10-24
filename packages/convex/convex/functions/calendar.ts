
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createCalendarEvent = mutation({
  args: {
    schoolCycleId: v.id("schoolCycle"),
    startDate: v.number(),
    endDate: v.number(),
    eventTypeId: v.id("eventType"),
    description: v.optional(v.string()),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("calendar", {
      schoolCycleId: args.schoolCycleId,
      schoolId: args.schoolId,
      startDate: args.startDate,
      endDate: args.endDate,
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
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});


export const getUpcomingEvents = query({
  args: { 
    schoolId: v.id("school"), 
    schoolCycleId: v.id("schoolCycle"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();
    
    // Obtener eventos futuros y de hoy del ciclo escolar
    const events = await ctx.db
      .query("calendar")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("schoolCycleId"), args.schoolCycleId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .filter((q) => q.gte(q.field("date"), startOfToday))
      .collect();

    // Ordenar por fecha ascendente
    const sortedEvents = events.sort((a, b) => a.date - b.date);

    // Limitar cantidad si se especifica
    const limitedEvents = args.limit ? sortedEvents.slice(0, args.limit) : sortedEvents;

    // Enriquecer con información del eventType
    const enrichedEvents = await Promise.all(
      limitedEvents.map(async (event) => {
        const eventType = await ctx.db.get(event.eventTypeId);
        
        return {
          ...event,
          eventType: eventType ? {
            _id: eventType._id,
            name: eventType.name,
            key: eventType.key,
            description: eventType.description,
            color: eventType.color,
            icon: eventType.icon,
          } : null,
        };
      })
    );

    return enrichedEvents;
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
    startDate: v.number(),
    endDate: v.number(),
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
       startDate: args.startDate,
      endDate: args.endDate,
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
