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
    isEdit: v.optional(v.boolean()), // Indica si es una edición
    originalClassCatalogId: v.optional(v.id("classCatalog")), // ID de la clase original en edición
  },
  handler: async (ctx, args) => {
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) {
      throw new Error("Clase no encontrada");
    }

    // Obtener el ciclo escolar de la clase para validar solo conflictos dentro del mismo ciclo
    const classCycle = await ctx.db.get(classCatalog.schoolCycleId);
    if (!classCycle) {
      throw new Error("Ciclo escolar de la clase no encontrado");
    }

    const conflicts = [];

    for (const scheduleId of args.selectedScheduleIds) {
      const schedule = await ctx.db.get(scheduleId);
      if (!schedule) continue;

      // Verificar conflictos con el mismo grupo (solo dentro del mismo ciclo escolar)
      if (classCatalog.groupId) {
        const groupConflicts = await ctx.db
          .query("classSchedule")
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        for (const cs of groupConflicts) {
          const existingClass = await ctx.db.get(cs.classCatalogId);
          if (!existingClass ||
            existingClass.groupId !== classCatalog.groupId ||
            existingClass.schoolCycleId !== classCatalog.schoolCycleId) continue;

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

      // Verificar conflictos con el mismo profesor (solo dentro del mismo ciclo escolar)
      const teacherConflicts = await ctx.db
        .query("classSchedule")
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const cs of teacherConflicts) {
        const existingClass = await ctx.db.get(cs.classCatalogId);
        if (!existingClass ||
          existingClass.teacherId !== classCatalog.teacherId ||
          existingClass.schoolCycleId !== classCatalog.schoolCycleId) continue;

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

      // Verificar conflictos con el mismo aula (solo dentro del mismo ciclo escolar)
      const classroomConflicts = await ctx.db
        .query("classSchedule")
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const cs of classroomConflicts) {
        const existingClass = await ctx.db.get(cs.classCatalogId);
        if (!existingClass ||
          existingClass.classroomId !== classCatalog.classroomId ||
          existingClass.schoolCycleId !== classCatalog.schoolCycleId) continue;

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
      // obtener estudiantes del tutor en esa escuela
      const students = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", schoolId))
        .filter((q) => q.eq(q.field("tutorId"), tutorId))
        .collect();

      if (students.length === 0) return [];

      // obtener studentClass de cada estudiante (solo activos)
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

    // Para cada grupo, construir la estructura enriquecida (igual a tu versión original)
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

        const [subject, classroom, teacher, group] = await Promise.all([
          ctx.db.get(classCatalog.subjectId),
          ctx.db.get(classCatalog.classroomId),
          ctx.db.get(classCatalog.teacherId),
          classCatalog.groupId ? ctx.db.get(classCatalog.groupId) : Promise.resolve(null),
        ]);

        const hasActiveRelations = schedules.some((cs) => cs.status === "active");
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