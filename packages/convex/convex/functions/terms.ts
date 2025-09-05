import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// C: Crear un nuevo Periodo
export const createTerm = mutation({
  args: {
    name: v.string(),
    key: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    schoolCycleId: v.id("schoolCycle"),
    schoolId: v.id("school"), // Recibir el schoolId
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("term", {
      name: args.name,
      key: args.key,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "active",
      updatedAt: undefined,
      schoolCycleId: args.schoolCycleId,
      schoolId: args.schoolId, // Guardar el schoolId
    });
    return id;
  },
});


export const getAllTermsBySchool = query({
  args: {
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("term")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();
  },
});

// R: Leer todos los periodos de un ciclo
export const getTermsByCycleId = query({
  args: { schoolCycleId: v.id("schoolCycle") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("term")
      .withIndex("by_schoolCycleId", (q) => q.eq("schoolCycleId", args.schoolCycleId))
      .collect();
  },
});

// R: Leer un periodo por su ID
export const getTermById = query({
  args: { termId: v.id("term") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.termId);
  },
});

// U: Actualizar un Periodo
export const updateTerm = mutation({
  args: {
    termId: v.id("term"),
    data: v.object({
      name: v.optional(v.string()),
      key: v.optional(v.string()),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("closed"))),
      parentTermId: v.optional(v.union(v.id("term"), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.termId, {
      ...args.data,
      updatedAt: Date.now(),
    });
    return args.termId;
  },
});

// D: Borrar un Periodo
export const deleteTerm = mutation({
  args: { termId: v.id("term") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.termId);
    return args.termId;
  },
}); 