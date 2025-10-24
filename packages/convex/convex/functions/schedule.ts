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
      .withIndex("by_school_day", (q) => q.eq("schoolId", args.schoolId))
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
    day: v.union(
      v.literal('lun.'),
      v.literal('mar.'),
      v.literal('mié.'),
      v.literal('jue.'),
      v.literal('vie.'),
    ),
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

    return await ctx.db.insert("schedule", args);
  },
});

// Actualizar un horario existente, asegurándose de que pertenezca a la escuela
export const updateSchedule = mutation({
  args: {
    id: v.id("schedule"),
    schoolId: v.id("school"),
    name: v.optional(v.string()),
    day: v.optional(v.union(
      v.literal('lun.'),
      v.literal('mar.'),
      v.literal('mié.'),
      v.literal('jue.'),
      v.literal('vie.'),
    )),
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
});

export const getScheduleConflicts = query({
  args: {
    schoolId: v.id("school"),
    teacherId: v.id("user"),
    classroomId: v.id("classroom"),
    classCatalogIdToExclude: v.optional(v.id("classCatalog")),
  },
  handler: async (ctx, args) => {
    // 1. Obtener todas las clases de la escuela
    const classCatalogs = await ctx.db
      .query("classCatalog")
      .filter(q => q.eq(q.field("schoolId"), args.schoolId))
      .collect();
      
    // 2. Filtrar las clases que NO son la que estamos editando
    const relevantClasses = classCatalogs.filter(classInfo => {
      // ✅ Excluir la clase que se está editando
      if (args.classCatalogIdToExclude && classInfo._id === args.classCatalogIdToExclude) {
        return false;
      }
      
      // ✅ Solo incluir clases que tengan el mismo profesor O aula
      return classInfo.teacherId === args.teacherId || 
             classInfo.classroomId === args.classroomId;
    });

    // 3. Obtener los scheduleIds de esas clases
    const conflictingScheduleIds = new Set<string>();

    for (const classInfo of relevantClasses) {
      // Buscar todas las asignaciones de horario para esta clase
      const classSchedules = await ctx.db
        .query("classSchedule")
        .withIndex("by_class_catalog", q => q.eq("classCatalogId", classInfo._id))
        .collect();
      
      // Agregar todos los scheduleIds encontrados
      for (const schedule of classSchedules) {
        conflictingScheduleIds.add(schedule.scheduleId);
      }
    }

    // 4. Devolver un array con los IDs de los horarios en conflicto
    return Array.from(conflictingScheduleIds);
  },
});

export const getScheduleConflictsForEdit = query({
  args: {
    schoolId: v.id("school"),
    teacherId: v.id("user"),
    classroomId: v.id("classroom"),
    classCatalogIdToExclude: v.id("classCatalog"),
  },
  handler: async (ctx, args) => {
    const allClassCatalogs = await ctx.db
      .query("classCatalog")
      .filter(q => q.eq(q.field("schoolId"), args.schoolId))
      .collect();

    const otherClasses = allClassCatalogs.filter(
      (c) => c._id !== args.classCatalogIdToExclude
    );

    const conflictingScheduleIds = new Set<string>();

    // En lugar de traer todos los horarios, iteramos sobre las clases relevantes
    for (const classCat of otherClasses) {
      // Si la clase tiene un profesor o salón que nos interesa...
      if (classCat.teacherId === args.teacherId || classCat.classroomId === args.classroomId) {
        // ...buscamos sus horarios asignados usando un índice
        const schedules = await ctx.db
          .query("classSchedule")
          .withIndex("by_class_catalog", q => q.eq("classCatalogId", classCat._id))
          .collect();
        
        // Y añadimos esos IDs de horario a nuestra lista de conflictos
        for (const s of schedules) {
          conflictingScheduleIds.add(s.scheduleId);
        }
      }
    }

    return Array.from(conflictingScheduleIds);
  },
});

export const getOccupiedScheduleIds = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    // 1. Encuentra el ciclo escolar que está marcado como "activo"
    const activeCycle = await ctx.db
      .query("schoolCycle")
      .withIndex("by_school_status", (q) =>
        q.eq("schoolId", args.schoolId).eq("status", "active")
      )
      .unique();

    // Si no hay ciclo activo, no puede haber horarios ocupados.
    if (!activeCycle) {
      return [];
    }

    // 2. Busca todas las clases que pertenecen a ese ciclo activo.
    const classesInActiveCycle = await ctx.db
      .query("classCatalog")
      .withIndex("by_cycle", (q) => q.eq("schoolCycleId", activeCycle._id))
      .collect();
    
    if (classesInActiveCycle.length === 0) {
      return [];
    }
    
    // Crea un conjunto de IDs de esas clases para buscar más rápido.
    const classIdsInActiveCycle = new Set(classesInActiveCycle.map(c => c._id));

    // 3. Busca en la tabla de asignaciones (classSchedule).
    const allSchedulesAssignments = await ctx.db.query("classSchedule").collect();

    // 4. Filtra las asignaciones para quedarte solo con las que pertenecen a las clases del ciclo activo.
    const occupiedScheduleIds = allSchedulesAssignments
      .filter(assignment => classIdsInActiveCycle.has(assignment.classCatalogId))
      .map(assignment => assignment.scheduleId);

    // 5. Devuelve una lista de IDs de horarios únicos (sin duplicados).
    return [...new Set(occupiedScheduleIds)];
  },
});