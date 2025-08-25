import { mutation, query } from "../_generated/server"; 
import { v } from "convex/values";

export const ObtenerCiclosEscolares = query({args: {escuelaID: v.id("school")}, 
  handler: async (ctx, args) => {
    return await ctx.db
      .query("schoolCycle")
      .withIndex("by_school", (q) => q.eq("schoolId", args.escuelaID))
      .collect();
  },
});

export const ObtenerCiclosEscolaresPorId = query({
  args: { cicloEscolarID: v.id("schoolCycle") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cicloEscolarID);
  },
});

export const CrearCicloEscolar = mutation({
  args: {
    escuelaID: v.id("school"),
    nombre: v.string(),
    fechaInicio: v.number(),
    fechaFin: v.number(),
    status: v.union(v.literal("active"),
      v.literal("archived"),
      v.literal("inactive"))
  },
  handler: async (ctx, args) => {
    const nuevoCiclo = {
      schoolId: args.escuelaID,
      name: args.nombre,
      startDate: args.fechaInicio,
      endDate: args.fechaFin,
      status: args.status,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return await ctx.db.insert("schoolCycle", nuevoCiclo);
  },
});

export const ActualizarCicloEscolar = mutation({
  args: {
    cicloEscolarID: v.id("schoolCycle"),
    escuelaID: v.id("school"),
    nombre: v.optional(v.string()),
    fechaInicio: v.optional(v.number()),
    fechaFin: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("archived"),
        v.literal("inactive")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Verificar si el ciclo existe
    const ciclo = await ctx.db.get(args.cicloEscolarID);
    if (!ciclo) {
      throw new Error("Ciclo escolar no encontrado");
    }

    // Actualizar con patch
    await ctx.db.patch(args.cicloEscolarID, {
      schoolId: args.escuelaID,
      name: args.nombre,
      startDate: args.fechaInicio,
      endDate: args.fechaFin,
      status: args.status,
      updatedAt: Date.now(),
    });

    // Devolver el documento actualizado
    return await ctx.db.get(args.cicloEscolarID);
  },
});


export const EliminarCicloEscolar = mutation({
  args: { cicloEscolarID: v.id("schoolCycle") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.cicloEscolarID);
  },
});