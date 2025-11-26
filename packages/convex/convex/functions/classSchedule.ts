import { mutation, query, internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Obtener todas las relaciones classSchedule con información completa
export const getClassSchedules = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    // Primero obtener todas las clases de la escuela
    const schoolClasses = await ctx.db
      .query("classCatalog")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const schoolClassIds = schoolClasses.map(c => c._id);

    // Obtener todas las relaciones classSchedule que pertenecen a clases de la escuela
    const classSchedules = await ctx.db
      .query("classSchedule")
      .collect();

    // Filtrar solo las relaciones que pertenecen a clases de la escuela
    const filteredClassSchedules = classSchedules.filter(cs =>
      schoolClassIds.includes(cs.classCatalogId)
    );


    // Agrupar por classCatalogId
    const groupedSchedules = filteredClassSchedules.reduce((acc, cs) => {
      if (!acc[cs.classCatalogId]) {
        acc[cs.classCatalogId] = [];
      }
      acc[cs.classCatalogId]!.push(cs);
      return acc;
    }, {} as Record<string, typeof filteredClassSchedules>);

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
    isEdit: v.optional(v.boolean()),
    originalClassCatalogId: v.optional(v.id("classCatalog")),
  },
  handler: async (ctx, args) => {
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) {
      throw new Error("Clase no encontrada");
    }

    const currentSchoolCycleId = classCatalog.schoolCycleId;
    const conflicts = [];

    for (const scheduleId of args.selectedScheduleIds) {
      const schedule = await ctx.db.get(scheduleId);
      if (!schedule) continue;

      // ✅ MEJORA: Solo obtener asignaciones con status "active"
      const existingAssignments = await ctx.db
        .query("classSchedule")
        .withIndex("by_schedule", (q) => q.eq("scheduleId", scheduleId))
        .filter((q) => q.eq(q.field("status"), "active")) // ✅ Solo activos
        .collect();

      if (existingAssignments.length === 0) {
        continue;
      }

      for (const assignment of existingAssignments) {
        const existingClass = await ctx.db.get(assignment.classCatalogId);
        if (!existingClass) continue;

        // ✅ Solo verificar conflictos dentro del MISMO ciclo escolar
        if (existingClass.schoolCycleId !== currentSchoolCycleId) {
          console.log(`✓ Horario ${scheduleId} usado en otro ciclo escolar - NO ES CONFLICTO`);
          continue;
        }

        // Si estamos editando la misma clase, no es conflicto
        if (args.isEdit && args.originalClassCatalogId &&
          existingClass._id === args.originalClassCatalogId) {
          continue;
        }

        // ✅ CONFLICTO DE GRUPO (mismo ciclo, mismo grupo, horario activo)
        if (classCatalog.groupId && existingClass.groupId === classCatalog.groupId) {
          const conflictingGroup = await ctx.db.get(existingClass.groupId);
          conflicts.push({
            type: "group",
            message: `El grupo "${conflictingGroup?.name || 'N/A'}" ya tiene una clase activa en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name,
            schoolCycleId: existingClass.schoolCycleId
          });
        }

        // ✅ CONFLICTO DE PROFESOR (mismo ciclo, mismo profesor, horario activo)
        if (existingClass.teacherId === classCatalog.teacherId) {
          const conflictingTeacher = await ctx.db.get(existingClass.teacherId);
          conflicts.push({
            type: "teacher",
            message: `El profesor "${conflictingTeacher?.name || 'N/A'}" ya tiene una clase activa en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name,
            schoolCycleId: existingClass.schoolCycleId
          });
        }

        // ✅ CONFLICTO DE AULA (mismo ciclo, misma aula, horario activo)
        if (existingClass.classroomId === classCatalog.classroomId) {
          const conflictingClassroom = await ctx.db.get(existingClass.classroomId);
          conflicts.push({
            type: "classroom",
            message: `El aula "${conflictingClassroom?.name || 'N/A'}" ya está ocupada (activa) en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name,
            schoolCycleId: existingClass.schoolCycleId
          });
        }
      }
    }

    // De-duplicar conflictos
    const uniqueConflicts = conflicts.filter(
      (conflict, index, self) =>
        index === self.findIndex((c) => c.message === conflict.message)
    );

    return {
      hasConflicts: uniqueConflicts.length > 0,
      conflicts: uniqueConflicts,
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

    // Obtener la clase y verificar que existe
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) {
      throw new Error("Clase no encontrada");
    }

    // Obtener el ciclo escolar activo de la escuela
    const activeCycle = await ctx.db
      .query("schoolCycle")
      .withIndex("by_school", (q) => q.eq("schoolId", classCatalog.schoolId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!activeCycle) {
      throw new Error("No hay un ciclo escolar activo en esta escuela");
    }

    // Verificar que la clase pertenece al ciclo escolar activo
    if (classCatalog.schoolCycleId !== activeCycle._id) {
      throw new Error("La clase seleccionada no pertenece al ciclo escolar activo. Por favor, selecciona una clase del ciclo escolar actual.");
    }

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

    // Obtener la clase y verificar que existe
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) {
      throw new Error("Clase no encontrada");
    }

    // Obtener el ciclo escolar activo de la escuela
    const activeCycle = await ctx.db
      .query("schoolCycle")
      .withIndex("by_school", (q) => q.eq("schoolId", classCatalog.schoolId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!activeCycle) {
      throw new Error("No hay un ciclo escolar activo en esta escuela");
    }

    // Verificar que la clase pertenece al ciclo escolar activo
    if (classCatalog.schoolCycleId !== activeCycle._id) {
      throw new Error("La clase seleccionada no pertenece al ciclo escolar activo. Por favor, selecciona una clase del ciclo escolar actual.");
    }

    // ✅ VALIDAR CONFLICTOS ANTES DE ACTUALIZAR
    const conflicts = [];

    for (const scheduleId of args.selectedScheduleIds) {
      const schedule = await ctx.db.get(scheduleId);
      if (!schedule) continue;

      const existingAssignments = await ctx.db
        .query("classSchedule")
        .withIndex("by_schedule", (q) => q.eq("scheduleId", scheduleId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (existingAssignments.length === 0) continue;

      for (const assignment of existingAssignments) {
        const existingClass = await ctx.db.get(assignment.classCatalogId);
        if (!existingClass) continue;

        // Solo verificar conflictos dentro del MISMO ciclo escolar
        if (existingClass.schoolCycleId !== activeCycle._id) continue;

        // Si es la misma clase que estamos editando, no es conflicto
        if (existingClass._id === args.classCatalogId) continue;

        // Conflicto de grupo
        if (classCatalog.groupId && existingClass.groupId === classCatalog.groupId) {
          const conflictingGroup = await ctx.db.get(existingClass.groupId);
          conflicts.push({
            type: "group",
            message: `El grupo "${conflictingGroup?.name || 'N/A'}" ya tiene una clase activa en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name,
          });
        }

        // Conflicto de profesor
        if (existingClass.teacherId === classCatalog.teacherId) {
          const conflictingTeacher = await ctx.db.get(existingClass.teacherId);
          conflicts.push({
            type: "teacher",
            message: `El profesor "${conflictingTeacher?.name || 'N/A'}" ya tiene una clase activa en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name,
          });
        }

        // Conflicto de aula
        if (existingClass.classroomId === classCatalog.classroomId) {
          const conflictingClassroom = await ctx.db.get(existingClass.classroomId);
          conflicts.push({
            type: "classroom",
            message: `El aula "${conflictingClassroom?.name || 'N/A'}" ya está ocupada en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name,
          });
        }
      }
    }

    // De-duplicar conflictos
    const uniqueConflicts = conflicts.filter(
      (conflict, index, self) =>
        index === self.findIndex((c) => c.message === conflict.message)
    );

    if (uniqueConflicts.length > 0) {
      const conflictList = uniqueConflicts
        .map(c => c.message)
        .join('\n• ');

      throw new Error(`CONFLICT_ERROR::No se puede actualizar debido a conflictos:\n• ${conflictList}`);
    }

    // ✅ SI NO HAY CONFLICTOS, PROCEDER CON LA ACTUALIZACIÓN
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

    // Obtener el ciclo escolar activo de la escuela
    const activeCycle = await ctx.db
      .query("schoolCycle")
      .withIndex("by_school", (q) => q.eq("schoolId", newClassCatalog.schoolId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!activeCycle) {
      throw new Error("No hay un ciclo escolar activo en esta escuela");
    }

    // Verificar que la nueva clase pertenece al ciclo escolar activo
    if (newClassCatalog.schoolCycleId !== activeCycle._id) {
      throw new Error("La clase seleccionada no pertenece al ciclo escolar activo. Por favor, selecciona una clase del ciclo escolar actual.");
    }

    // ✅ VALIDAR CONFLICTOS ANTES DE ACTUALIZAR
    const conflicts = [];

    for (const scheduleId of args.selectedScheduleIds) {
      const schedule = await ctx.db.get(scheduleId);
      if (!schedule) continue;

      const existingAssignments = await ctx.db
        .query("classSchedule")
        .withIndex("by_schedule", (q) => q.eq("scheduleId", scheduleId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (existingAssignments.length === 0) continue;

      for (const assignment of existingAssignments) {
        const existingClass = await ctx.db.get(assignment.classCatalogId);
        if (!existingClass) continue;

        // Solo verificar conflictos dentro del MISMO ciclo escolar
        if (existingClass.schoolCycleId !== activeCycle._id) continue;

        // Si es la clase original que estamos editando, no es conflicto
        if (existingClass._id === args.oldClassCatalogId) continue;

        // Conflicto de grupo
        if (newClassCatalog.groupId && existingClass.groupId === newClassCatalog.groupId) {
          const conflictingGroup = await ctx.db.get(existingClass.groupId);
          conflicts.push({
            type: "group",
            message: `El grupo "${conflictingGroup?.name || 'N/A'}" ya tiene una clase activa en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name,
          });
        }

        // Conflicto de profesor
        if (existingClass.teacherId === newClassCatalog.teacherId) {
          const conflictingTeacher = await ctx.db.get(existingClass.teacherId);
          conflicts.push({
            type: "teacher",
            message: `El profesor "${conflictingTeacher?.name || 'N/A'}" ya tiene una clase activa en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name,
          });
        }

        // Conflicto de aula
        if (existingClass.classroomId === newClassCatalog.classroomId) {
          const conflictingClassroom = await ctx.db.get(existingClass.classroomId);
          conflicts.push({
            type: "classroom",
            message: `El aula "${conflictingClassroom?.name || 'N/A'}" ya está ocupada en este horario: ${schedule.day} ${schedule.startTime}-${schedule.endTime}`,
            conflictingClass: existingClass.name,
          });
        }
      }
    }

    // De-duplicar conflictos
    const uniqueConflicts = conflicts.filter(
      (conflict, index, self) =>
        index === self.findIndex((c) => c.message === conflict.message)
    );

    if (uniqueConflicts.length > 0) {
      const conflictList = uniqueConflicts
        .map(c => c.message)
        .join('\n• ');

      throw new Error(`CONFLICT_ERROR::No se puede actualizar debido a conflictos:\n• ${conflictList}`);
    }

    // ✅ SI NO HAY CONFLICTOS, PROCEDER CON LA ACTUALIZACIÓN
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

export const getClassScheduleWithRoleFilter = query({
  args: {
    schoolId: v.id("school"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user")),
  },
  handler: async (ctx, args) => {
    const { schoolId, canViewAll, tutorId, teacherId } = args;

    let classScheduleRecords = [];

    // 1) Si puede ver todo -> todas las relaciones de las clases de la escuela
    if (canViewAll) {
      const schoolClasses = await ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
        .collect();

      if (schoolClasses.length === 0) return [];

      const schedulesArrays = await Promise.all(
        schoolClasses.map((c) =>
          ctx.db
            .query("classSchedule")
            .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", c._id))
            .collect()
        )
      );

      classScheduleRecords = schedulesArrays.flat();
    }

    // 2) Si es tutor -> solo relaciones de las clases donde están matriculados sus estudiantes
    else if (tutorId) {
      const students = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", schoolId))
        .filter((q) => q.eq(q.field("tutorId"), tutorId))
        .collect();

      if (students.length === 0) return [];

      const studentClassArrays = await Promise.all(
        students.map((s) =>
          ctx.db
            .query("studentClass")
            .withIndex("by_student", (q) => q.eq("studentId", s._id))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect()
        )
      );

      const studentClasses = studentClassArrays.flat();
      const classIds = [...new Set(studentClasses.map((sc) => sc.classCatalogId))];

      if (classIds.length === 0) return [];

      const schedulesArrays = await Promise.all(
        classIds.map((classId) =>
          ctx.db
            .query("classSchedule")
            .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", classId))
            .collect()
        )
      );

      classScheduleRecords = schedulesArrays.flat();
    }

    // 3) Si es maestro -> relaciones de las clases que imparte (activas)
    else if (teacherId) {
      const teacherClasses = await ctx.db
        .query("classCatalog")
        .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId!))
        .filter((q) =>
          q.and(
            q.eq(q.field("schoolId"), schoolId),
            q.eq(q.field("status"), "active")
          )
        )
        .collect();

      if (teacherClasses.length === 0) return [];

      const schedulesArrays = await Promise.all(
        teacherClasses.map((c) =>
          ctx.db
            .query("classSchedule")
            .withIndex("by_class_catalog", (q) => q.eq("classCatalogId", c._id))
            .collect()
        )
      );

      classScheduleRecords = schedulesArrays.flat();
    }

    // 4) Si no tiene permisos específicos, devolver array vacío
    else {
      return [];
    }

    // Agrupar por classCatalogId
    const groupedSchedules = classScheduleRecords.reduce((acc, cs) => {
      const key = String(cs.classCatalogId);
      if (!acc[key]) acc[key] = [];
      acc[key].push(cs);
      return acc;
    }, {} as Record<string, typeof classScheduleRecords>);

    // Para cada grupo, construir la estructura enriquecida
    const classesWithSchedules = await Promise.all(
      Object.entries(groupedSchedules).map(async ([classCatalogId, schedules]) => {
        const classCatalog = await ctx.db.get(classCatalogId as Id<"classCatalog">);
        if (!classCatalog) return null;

        const scheduleDetails = await Promise.all(
          schedules.map(async (cs) => {
            const schedule = await ctx.db.get(cs.scheduleId);
            return schedule ? { ...schedule, relationId: cs._id } : null;
          })
        );

        // ✅ CAMBIO IMPORTANTE: Obtener también el schoolCycle
        const [subject, classroom, teacher, group, schoolCycle] = await Promise.all([
          ctx.db.get(classCatalog.subjectId),
          ctx.db.get(classCatalog.classroomId),
          ctx.db.get(classCatalog.teacherId),
          classCatalog.groupId ? ctx.db.get(classCatalog.groupId) : Promise.resolve(null),
          ctx.db.get(classCatalog.schoolCycleId), // ✅ NUEVO
        ]);

        const hasActiveRelations = schedules.some((cs) => cs.status === "active");
        const classStatus = hasActiveRelations ? "active" : "inactive";

        return {
          _id: classCatalog._id,
          classCatalogId: classCatalog._id,
          name: classCatalog.name,
          status: classStatus,
          schoolCycleId: classCatalog.schoolCycleId, // ✅ NUEVO
          schoolCycle, // ✅ NUEVO: Objeto completo del ciclo escolar
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

export const getSchedulesByClassCatalog = internalQuery({
  args: { classCatalogId: v.id("classCatalog") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("classSchedule")
      .withIndex("by_class_catalog", (q) =>
        q.eq("classCatalogId", args.classCatalogId)
      )
      .collect();
  },
});

// Mutación interna para borrar un horario específico por su ID
export const deleteScheduleById = internalMutation({
  args: { scheduleId: v.id("classSchedule") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.scheduleId);
  },
});

