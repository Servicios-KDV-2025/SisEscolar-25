import { query, mutation } from "../_generated/server"
import { v } from "convex/values"

// Obtener horarios POR una escuela específica
export const getSchedulesBySchools = query({
  args: {
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("La escuela especificada no existe.");
    }
    return await ctx.db
      .query("schedule")
      .withIndex("by_school_day_week", (q) => q.eq("schoolId", args.schoolId))
      .collect();
  },
});

// Obtener un solo horiario por su ID
export const getScheduleById = query({
  args: {
    id: v.id('schedule'),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.id);
    if (!schedule) {
      throw new Error("Horario no encontrado.");
    }
    return schedule;
  },
});

// --- MUTATIONS ---

// Crear un nuevo horiario DENTRO de una escuela específica
export const createSchedule = mutation({
  args: {
    schoolId: v.id("school"),
    name: v.string(),
    day: v.string(),
    week: v.string(),
    // scheduleDate: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('inactive')
    ),
    updatedAt: v.number()
  },
  handler: async (ctx, args) => {
    const schoolExists = await ctx.db.get(args.schoolId);
    if (!schoolExists) {
      throw new Error("No se puede crear el horario: La escuela especificada no existe.");
    }

    // Verificar si ya existe un horario para este día y semana
    const existingSchedule = await ctx.db
      .query("schedule")
      .withIndex("by_school_day_week", (q) => 
        q.eq("schoolId", args.schoolId)
         .eq("day", args.day)
         .eq("week", args.week)
      )
      .first();

    if (existingSchedule) {
      throw new Error("Ya existe un horario para este día y semana");
    }

    return await ctx.db.insert("schedule", args);
  },
});

// Actualizar un horario existente, asegurándose de que pertenezca a la escuela
export const updateSchedule = mutation({
  args: {
    id: v.id("schedule"),
    schoolId: v.id("school"),
    name: v.optional(v.string()),
    day: v.optional(v.string()),
    week: v.optional(v.string()),
    // scheduleDate: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive')
    )),
    updatedAt: v.number()
  },
  handler: async (ctx, args) => {
    const { id, schoolId, ...data } = args;
    const existingSchedule = await ctx.db.get(id);
    if (!existingSchedule || existingSchedule.schoolId !== schoolId) {
      throw new Error("No se puede actualizar: Horario no encontrado o no pertenece a la escuela especificada.");
    }
    await ctx.db.patch(id, data);
    return await ctx.db.get(id);
  },
});

// Eliminar un horairo, asegurándose de que pertenezca a la escuela
export const deleteSchedule = mutation({
  args: {
    id: v.id("schedule"),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    const existingSchedule = await ctx.db.get(args.id);
    if (!existingSchedule || existingSchedule.schoolId !== args.schoolId) {
      throw new Error("No se puede eliminar: Horairo no encontrado o no pertenece a la escuela especificada.");
    }
    await ctx.db.delete(args.id);
    return true;
  },
})