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
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("closed"))),
  
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("term", {
      name: args.name,
      key: args.key,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "active",
      updatedAt: undefined,
      schoolCycleId: args.schoolCycleId,
    });
    return id;
  },
});

// R: Leer todos los periodos de un ciclo escolar
export const getTermsBySchoolCycle = query({
  args: { schoolCycleId: v.id("schoolCycle") },
  handler: async (ctx, args) => {
    // 1. Encontrar todos los catálogos de clase para el ciclo escolar dado
    const classCatalogs = await ctx.db
      .query("classCatalog")
      .withIndex("by_cycle", (q) => q.eq("schoolCycleId", args.schoolCycleId))
      .collect();

    // 2. Para cada catálogo, encontrar sus periodos
    const termPromises = classCatalogs.map(catalog => 
      ctx.db
        .query("term")
        .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", catalog._id))
        .collect()
    );

    // 3. Esperar a que todas las consultas se completen y aplanar el resultado
    const allTermsByCycle = await Promise.all(termPromises);
    return allTermsByCycle.flat();
  },
});


// R: Leer todos los periodos de una clase
export const getTermsByClass = query({
  args: { classCatalogId: v.id("classCatalog") },
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

// R: Leer periodos por estado
export const getTermsByStatus = query({
  args: { status: v.union(v.literal("active"), v.literal("inactive"), v.literal("closed")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("term")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// R: Leer todos los periodos
export const getAllTerms = query({
  handler: async (ctx) => {
    return await ctx.db.query("term").collect();
  },
});

//R: Leer todos los periodos de un cliclo


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