import { mutation, query, internalMutation } from "../_generated/server"; 
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const ObtenerCiclosEscolares = query({
  args: {escuelaID: v.id("school")}, 
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
    // Verificar si ya existe un ciclo con el mismo nombre en la misma escuela
    const existingCycle = await ctx.db
      .query("schoolCycle")
      .withIndex("by_school", (q) => q.eq("schoolId", args.escuelaID))
      .filter((q) => q.eq(q.field("name"), args.nombre))
      .first();

    if (existingCycle) {
      throw new Error("Ya existe un ciclo escolar con el mismo nombre en esta escuela.");
    }

    // Validar que las fechas sean lógicas
    if (args.fechaInicio >= args.fechaFin) {
      throw new Error("La fecha de inicio debe ser anterior a la fecha de fin.");
    }

    // Si se intenta crear un ciclo activo, desactivar todos los demás
    if (args.status === "active") {
      const activeCycles = await ctx.db
        .query("schoolCycle")
        .withIndex("by_school", (q) => q.eq("schoolId", args.escuelaID))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      // Cambiar todos los ciclos activos a inactivos
      for (const cycle of activeCycles) {
        await ctx.db.patch(cycle._id, {
          status: "inactive",
          updatedAt: Date.now()
        });
      }
    }

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
    const ciclo = await ctx.db.get(args.cicloEscolarID);
    if (!ciclo) {
      throw new Error("Ciclo escolar no encontrado");
    }

    // Si se está actualizando el nombre, verificar duplicados
    if (args.nombre && args.nombre !== ciclo.name) {
      const existingCycle = await ctx.db
        .query("schoolCycle")
        .withIndex("by_school", (q) => q.eq("schoolId", args.escuelaID))
        .filter((q) => 
          q.and(
            q.eq(q.field("name"), args.nombre),
            q.neq(q.field("_id"), args.cicloEscolarID)
          )
        )
        .first();

      if (existingCycle) {
        throw new Error("Ya existe un ciclo escolar con el mismo nombre en esta escuela.");
      }
    }

    // Validar que las fechas sean lógicas si se están actualizando
    const fechaInicio = args.fechaInicio || ciclo.startDate;
    const fechaFin = args.fechaFin || ciclo.endDate;
    
    if (fechaInicio >= fechaFin) {
      throw new Error("La fecha de inicio debe ser anterior a la fecha de fin.");
    }

    // Si se cambia a estado activo, desactivar todos los demás ciclos
    if (args.status === "active" && ciclo.status !== "active") {
      const activeCycles = await ctx.db
        .query("schoolCycle")
        .withIndex("by_school", (q) => q.eq("schoolId", args.escuelaID))
        .filter((q) => 
          q.and(
            q.eq(q.field("status"), "active"),
            q.neq(q.field("_id"), args.cicloEscolarID)
          )
        )
        .collect();

      // Cambiar todos los otros ciclos activos a inactivos
      for (const cycle of activeCycles) {
        await ctx.db.patch(cycle._id, {
          status: "inactive",
          updatedAt: Date.now()
        });
      }
    }

    // --- Lógica para desactivación en cascada ---
    // 1. Determinar si el ciclo se está guardando como inactivo o archivado
    const isNowInactive = args.status === "inactive" || args.status === "archived";
    // --- Fin ---

    // Actualizar con patch
    await ctx.db.patch(args.cicloEscolarID, {
      schoolId: args.escuelaID,
      ...(args.nombre && { name: args.nombre }),
      ...(args.fechaInicio && { startDate: args.fechaInicio }),
      ...(args.fechaFin && { endDate: args.fechaFin }),
      ...(args.status && { status: args.status }),
      updatedAt: Date.now(),
    });

    // --- Lógica para desactivación en cascada ---
    // 2. Si se guardó como inactivo/archivado, programar la desactivación
    if (isNowInactive) {
      // Llama a la mutación interna 
      await ctx.scheduler.runAfter(0, internal.functions.schoolCycles.internalDeactivateSchedules, { 
        schoolCycleId: args.cicloEscolarID 
      });
    }
    // --- Fin ---

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

// Función adicional para obtener el ciclo activo
export const ObtenerCicloActivo = query({
  args: { escuelaID: v.id("school") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("schoolCycle")
      .withIndex("by_school", (q) => q.eq("schoolId", args.escuelaID))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
  },
});

export const getAllSchoolCycles = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    const cycles = await ctx.db
      .query("schoolCycle")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    return cycles.map(cycle => ({
      id: cycle._id,
      name: cycle.name,
      startDate: new Date(cycle.startDate).toISOString().split('T')[0],
      endDate: new Date(cycle.endDate).toISOString().split('T')[0],
      isActive: cycle.status === "active",
    }));
  },
});

export const internalDeactivateSchedules = internalMutation({
  args: { schoolCycleId: v.id("schoolCycle") },
  handler: async (ctx, args) => {
    console.log(`Iniciando desactivación de horarios para el ciclo: ${args.schoolCycleId}`);

    // 1. Encontrar todas las clases (classCatalog) en este ciclo escolar
    //    Usando el índice "by_cycle" de tu schema.ts
    const classesInCycle = await ctx.db
      .query("classCatalog")
      .withIndex("by_cycle", (q) => q.eq("schoolCycleId", args.schoolCycleId))
      .collect();

    if (classesInCycle.length === 0) {
      console.log("No se encontraron clases para este ciclo.");
      return;
    }

    const classIds = classesInCycle.map(c => c._id);
    console.log(`Encontradas ${classIds.length} clases.`);

    // 2. Para cada clase, encontrar sus classSchedule y desactivarlos
    const patchPromises: Promise<any>[] = [];

    for (const classId of classIds) {
      // Usamos el índice "by_class_catalog" de la tabla classSchedule
      const schedules = await ctx.db
        .query("classSchedule")
        .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", classId)) 
        .collect();

      for (const schedule of schedules) {
        // Solo actualizar si no está ya inactivo
        if (schedule.status !== "inactive") {
          patchPromises.push(
            ctx.db.patch(schedule._id, { status: "inactive" })
          );
        }
      }
    }

    // 3. Ejecutar todas las actualizaciones en paralelo
    await Promise.all(patchPromises);
    console.log(`Desactivados ${patchPromises.length} horarios.`);
  },
});