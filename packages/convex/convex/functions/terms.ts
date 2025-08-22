import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// C: Crear un nuevo Periodo
export const createTerm = mutation({
  args: {
    classCatalogId: v.id("classCatalog"),
    name: v.string(),
    key: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    parentTermId: v.optional(v.id("term")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("term", {
      classCatalogId: args.classCatalogId,
      name: args.name,
      key: args.key,
      startDate: args.startDate,
      endDate: args.endDate,
      parentTermId: args.parentTermId,
      status: "active",
      updatedAt: undefined,
    });
    return id;
  },
});

// R: Leer todos los periodos de una clase
export const getTermsByClass = query({
  args: { classCatalogId: v.id("classCatalog") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("term")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
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

// R: Leer los periodos hijos de un periodo padre
export const getChildTerms = query({
  args: { parentTermId: v.id("term") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("term")
      .withIndex("by_parent_term", (q) => q.eq("parentTermId", args.parentTermId))
      .collect();
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
    // ⚠️ Importante: Agrega aquí la lógica para verificar si existen
    // rubricas de calificación o promedios vinculados a este periodo antes de borrar.
    await ctx.db.delete(args.termId);
    return args.termId;
  },
});