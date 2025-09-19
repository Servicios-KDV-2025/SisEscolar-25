import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// Obtener todas las relaciones classSchedule con información completa
export const getClassSchedules = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    // Obtener todas las relaciones classSchedule (activas e inactivas)
    const classSchedules = await ctx.db
      .query("classSchedule")
      .collect();

    // Agrupar por classCatalogId
    const groupedSchedules = classSchedules.reduce((acc, cs) => {
      if (!acc[cs.classCatalogId]) {
        acc[cs.classCatalogId] = [];
      }
      acc[cs.classCatalogId]!.push(cs);
      return acc;
    }, {} as Record<string, typeof classSchedules>);

    // Para cada grupo, obtener la información completa
    const classesWithSchedules = await Promise.all(
      Object.entries(groupedSchedules).map(async ([classCatalogId, schedules]) => {
        const classCatalog = await ctx.db.get(classCatalogId as Id<"classCatalog">);
        if (!classCatalog) return null;

        // Obtener los horarios completos
        const scheduleDetails = await Promise.all(
          schedules.map(async (cs) => {
            const schedule = await ctx.db.get(cs.scheduleId);
            return schedule ? { ...schedule, relationId: cs._id } : null;
          })
        );

        // Obtener información relacionada
        const [subject, classroom, teacher, group] = await Promise.all([
          ctx.db.get(classCatalog.subjectId),
          ctx.db.get(classCatalog.classroomId),
          ctx.db.get(classCatalog.teacherId),
          classCatalog.groupId ? ctx.db.get(classCatalog.groupId) : null,
        ]);

        // Determinar el estado de la clase basado en el estado de sus relaciones
        const hasActiveRelations = schedules.some(cs => cs.status === "active");
        const classStatus = hasActiveRelations ? "active" : "inactive";

        return {
          _id: classCatalog._id,
          classCatalogId: classCatalog._id,
          name: classCatalog.name,
          status: classStatus,
          subject,
          classroom,
          teacher,
          group,
          selectedScheduleIds: schedules.map(cs => cs.scheduleId),
          schedules: scheduleDetails.filter(Boolean),
          relationIds: schedules.map(cs => cs._id),
        };
      })
    );

    return classesWithSchedules.filter(Boolean);
  },
});

// Obtener horarios por clase específica
export const getClassSchedulesByClass = query({
  args: { classCatalogId: v.id("classCatalog") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("classSchedule")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

// Modificar classCatalogId de registros específicos
export const updateClassCatalogId = mutation({
  args: {
    classScheduleIds: v.array(v.id("classSchedule")), // IDs específicos a modificar
    newClassCatalogId: v.id("classCatalog"),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    // Verificar que la nueva clase existe
    const newClassCatalog = await ctx.db.get(args.newClassCatalogId);
    if (!newClassCatalog) {
      throw new Error(`Clase con ID ${args.newClassCatalogId} no encontrada`);
    }

    // Actualizar cada registro específico
    const updatePromises = args.classScheduleIds.map(async (classScheduleId) => {
      const existingClassSchedule = await ctx.db.get(classScheduleId);
      if (!existingClassSchedule) {
        throw new Error(`ClassSchedule con ID ${classScheduleId} no encontrado`);
      }

      const updateData = {
        classCatalogId: args.newClassCatalogId,
        scheduleId: existingClassSchedule.scheduleId,
        weekDay: existingClassSchedule.weekDay,
        status: args.status || existingClassSchedule.status,
      };

      return await ctx.db.patch(classScheduleId, updateData);
    });

    await Promise.all(updatePromises);

    return { 
      success: true, 
      updatedCount: args.classScheduleIds.length 
    };
  },
});

// Validar conflictos de horarios
export const validateScheduleConflicts = mutation({
  args: {
    classCatalogId: v.id("classCatalog"),
    selectedScheduleIds: v.array(v.id("schedule")),
    isEdit: v.optional(v.boolean()), // Indica si es una edición
    originalClassCatalogId: v.optional(v.id("classCatalog")), // ID de la clase original en edición
  },
  handler: async (ctx, args) => {
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) {
      throw new Error("Clase no encontrada");
    }

    const conflicts = [];

    for (const scheduleId of args.selectedScheduleIds) {
      const schedule = await ctx.db.get(scheduleId);
      if (!schedule) continue;

      // Verificar conflictos con el mismo grupo
      if (classCatalog.groupId) {
        const groupConflicts = await ctx.db
          .query("classSchedule")
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        for (const cs of groupConflicts) {
          const existingClass = await ctx.db.get(cs.classCatalogId);
          if (!existingClass || existingClass.groupId !== classCatalog.groupId) continue;
          
          // Si es una edición, excluir la clase original
          if (args.isEdit && args.originalClassCatalogId && existingClass._id === args.originalClassCatalogId) continue;

          const existingSchedule = await ctx.db.get(cs.scheduleId);
          if (!existingSchedule) continue;

          if (existingSchedule.day === schedule.day && 
              existingSchedule.startTime === schedule.startTime && 
              existingSchedule.endTime === schedule.endTime) {
            conflicts.push({
              type: "group",
              message: `El grupo ya tiene una clase en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
              conflictingClass: existingClass.name
            });
          }
        }
      }

      // Verificar conflictos con el mismo profesor
      const teacherConflicts = await ctx.db
        .query("classSchedule")
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const cs of teacherConflicts) {
        const existingClass = await ctx.db.get(cs.classCatalogId);
        if (!existingClass || existingClass.teacherId !== classCatalog.teacherId) continue;
        
        // Si es una edición, excluir la clase original
        if (args.isEdit && args.originalClassCatalogId && existingClass._id === args.originalClassCatalogId) continue;

        const existingSchedule = await ctx.db.get(cs.scheduleId);
        if (!existingSchedule) continue;

        if (existingSchedule.day === schedule.day && 
            existingSchedule.startTime === schedule.startTime && 
            existingSchedule.endTime === schedule.endTime) {
          conflicts.push({
            type: "teacher",
            message: `El profesor ya tiene una clase en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name
          });
        }
      }

      // Verificar conflictos con el mismo aula
      const classroomConflicts = await ctx.db
        .query("classSchedule")
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const cs of classroomConflicts) {
        const existingClass = await ctx.db.get(cs.classCatalogId);
        if (!existingClass || existingClass.classroomId !== classCatalog.classroomId) continue;
        
        // Si es una edición, excluir la clase original
        if (args.isEdit && args.originalClassCatalogId && existingClass._id === args.originalClassCatalogId) continue;

        const existingSchedule = await ctx.db.get(cs.scheduleId);
        if (!existingSchedule) continue;

        if (existingSchedule.day === schedule.day && 
            existingSchedule.startTime === schedule.startTime && 
            existingSchedule.endTime === schedule.endTime) {
          conflicts.push({
            type: "classroom",
            message: `El aula ya está ocupada en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name
          });
        }
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  },
});

// Crear nueva clase con horarios seleccionados
export const createClassSchedule = mutation({
  args: {
    classCatalogId: v.id("classCatalog"),
    selectedScheduleIds: v.array(v.id("schedule")),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const status = args.status || "active";

    // Crear las relaciones classSchedule para cada horario seleccionado
    const classSchedulePromises = args.selectedScheduleIds.map(async (scheduleId) => {
      const schedule = await ctx.db.get(scheduleId);
      if (!schedule) {
        throw new Error(`Horario con ID ${scheduleId} no encontrado`);
      }
      
      return await ctx.db.insert("classSchedule", {
        classCatalogId: args.classCatalogId,
        scheduleId: scheduleId,
        weekDay: ["lun.", "mar.", "mié.", "jue.", "vie."].indexOf(schedule.day),
        status: status,
      });
    });

    await Promise.all(classSchedulePromises);

    return { success: true };
  },
});

// Actualizar clase con nuevos horarios seleccionados
export const updateClassSchedule = mutation({
  args: {
    classCatalogId: v.id("classCatalog"),
    selectedScheduleIds: v.array(v.id("schedule")),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const status = args.status || "active";

    
    // Eliminar todas las relaciones classSchedule existentes para esta clase
    const existingClassSchedules = await ctx.db
      .query("classSchedule")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .collect();

    await Promise.all(
      existingClassSchedules.map(cs => ctx.db.delete(cs._id))
    );

    // Crear las nuevas relaciones classSchedule
    const classSchedulePromises = args.selectedScheduleIds.map(async (scheduleId) => {
      const schedule = await ctx.db.get(scheduleId);
      if (!schedule) {
        throw new Error(`Horario con ID ${scheduleId} no encontrado`);
      }
      
      return await ctx.db.insert("classSchedule", {
        classCatalogId: args.classCatalogId,
        scheduleId: scheduleId,
        weekDay: ["lun.", "mar.", "mié.", "jue.", "vie."].indexOf(schedule.day),
        status: status,
      });
    });

    await Promise.all(classSchedulePromises);

    return { success: true };
  },
});

// Actualizar clase y horarios en una sola operación
export const updateClassAndSchedules = mutation({
  args: {
    oldClassCatalogId: v.id("classCatalog"),
    newClassCatalogId: v.id("classCatalog"),
    selectedScheduleIds: v.array(v.id("schedule")),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const status = args.status || "active";

    // Verificar que la nueva clase existe
    const newClassCatalog = await ctx.db.get(args.newClassCatalogId);
    if (!newClassCatalog) {
      throw new Error(`Clase con ID ${args.newClassCatalogId} no encontrada`);
    }

    // Obtener todas las relaciones classSchedule existentes para la clase original
    const existingClassSchedules = await ctx.db
      .query("classSchedule")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.oldClassCatalogId))
      .collect();

    // Obtener las relaciones existentes para la nueva clase (si es diferente)
    let newClassSchedules = [];
    if (args.oldClassCatalogId !== args.newClassCatalogId) {
      newClassSchedules = await ctx.db
        .query("classSchedule")
        .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.newClassCatalogId))
        .collect();
    }

    // Si la clase cambió, mover las relaciones existentes a la nueva clase
    if (args.oldClassCatalogId !== args.newClassCatalogId) {
      const updatePromises = existingClassSchedules.map(async (cs) => {
        return await ctx.db.patch(cs._id, {
          classCatalogId: args.newClassCatalogId,
          status: status,
        });
      });
      await Promise.all(updatePromises);
    } else {
      // Si la clase no cambió, solo actualizar el estado de las relaciones existentes
      const updatePromises = existingClassSchedules.map(async (cs) => {
        return await ctx.db.patch(cs._id, {
          status: status,
        });
      });
      await Promise.all(updatePromises);
    }

    // Obtener todas las relaciones actualizadas para la nueva clase
    const allClassSchedules = await ctx.db
      .query("classSchedule")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.newClassCatalogId))
      .collect();

    // Obtener los IDs de horarios actuales (incluyendo los movidos)
    const currentScheduleIds = allClassSchedules.map(cs => cs.scheduleId);

    // Determinar qué horarios agregar (solo los que no existen)
    const schedulesToAdd = args.selectedScheduleIds.filter(id => !currentScheduleIds.includes(id));

    // Si la clase cambió, no eliminar horarios existentes, solo agregar los nuevos
    // Si la clase no cambió, eliminar los que no están seleccionados
    let schedulesToRemove: Id<"classSchedule">[] = [];
    if (args.oldClassCatalogId === args.newClassCatalogId) {
      // Solo eliminar si es la misma clase
      schedulesToRemove = allClassSchedules
        .filter(cs => !args.selectedScheduleIds.includes(cs.scheduleId))
        .map(cs => cs._id);
    }

    // Eliminar horarios que ya no están seleccionados (solo si es la misma clase)
    if (schedulesToRemove.length > 0) {
      await Promise.all(
        schedulesToRemove.map(id => ctx.db.delete(id as Id<"classSchedule">))
      );
    }

    // Agregar nuevos horarios
    const addPromises = schedulesToAdd.map(async (scheduleId) => {
      const schedule = await ctx.db.get(scheduleId);
      if (!schedule) {
        throw new Error(`Horario con ID ${scheduleId} no encontrado`);
      }
      
      return await ctx.db.insert("classSchedule", {
        classCatalogId: args.newClassCatalogId,
        scheduleId: scheduleId,
        weekDay: ["lun.", "mar.", "mié.", "jue.", "vie."].indexOf(schedule.day),
        status: status,
      });
    });

    await Promise.all(addPromises);

    return { 
      success: true,
      addedSchedules: schedulesToAdd.length,
      removedSchedules: schedulesToRemove.length,
      updatedSchedules: existingClassSchedules.length
    };
  },
});

// Activar/desactivar relación específica
export const toggleClassScheduleStatus = mutation({
  args: {
    relationId: v.id("classSchedule"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const relation = await ctx.db.get(args.relationId);
    if (!relation) {
      throw new Error("Relación no encontrada");
    }

    await ctx.db.patch(args.relationId, {
      status: args.status,
    });

    return { success: true };
  },
});

// Activar/desactivar todas las relaciones de una clase
export const toggleClassScheduleStatusAll = mutation({
  args: {
    classCatalogId: v.id("classCatalog"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const existingClassSchedules = await ctx.db
      .query("classSchedule")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .collect();

    await Promise.all(
      existingClassSchedules.map(cs => 
        ctx.db.patch(cs._id, { status: args.status })
      )
    );

    return { success: true };
  },
});

// Eliminar clase (eliminar todas las relaciones classSchedule)
export const deleteClassSchedule = mutation({
  args: { classCatalogId: v.id("classCatalog") },
  handler: async (ctx, args) => {
    // Eliminar todas las relaciones classSchedule para esta clase
    const existingClassSchedules = await ctx.db
      .query("classSchedule")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .collect();

    await Promise.all(
      existingClassSchedules.map(cs => ctx.db.delete(cs._id))
    );

    return { success: true };
  },
});

// Obtener información completa de clase con horarios
export const getClassWithSchedules = query({
  args: { classCatalogId: v.id("classCatalog") },
  handler: async (ctx, args) => {
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) return null;

    const classSchedules = await ctx.db
      .query("classSchedule")
      .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", args.classCatalogId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Obtener información relacionada
    const [subject, classroom, teacher, group, schedules] = await Promise.all([
      ctx.db.get(classCatalog.subjectId),
      ctx.db.get(classCatalog.classroomId),
      ctx.db.get(classCatalog.teacherId),
      classCatalog.groupId ? ctx.db.get(classCatalog.groupId) : null,
      Promise.all(
        classSchedules.map(async (cs) => {
          const schedule = await ctx.db.get(cs.scheduleId);
          return { ...cs, schedule };
        })
      ),
    ]);

    return {
      ...classCatalog,
      subject,
      classroom,
      teacher,
      group,
      schedules,
    };
  },
});