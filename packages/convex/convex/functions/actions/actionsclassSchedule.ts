"use node"; 

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

export const createClassWithSchedule = action({
  args: {
    classData: v.object({
      schoolId: v.id("school"),
      schoolCycleId: v.id("schoolCycle"),
      subjectId: v.id("subject"),
      classroomId: v.id("classroom"),
      teacherId: v.id("user"),
      groupId: v.id("group"),
      name: v.string(),
      status: v.union(v.literal("active"), v.literal("inactive")),
      createdBy: v.optional(v.id("user")),
    }),
    selectedScheduleIds: v.array(v.id("schedule")),
  },
  //                                  👇 AÑADE ESTA LÍNEA
  handler: async (ctx, args): Promise<{ success: boolean; classId: Id<"classCatalog"> }> => {
    let newClassId: Id<"classCatalog"> | null = null;
    
    try {
      newClassId = await ctx.runMutation(internal.functions.classCatalog.internalCreateClassCatalog, {
        ...args.classData,
      });

      if (!newClassId) { throw new Error("La creación de la clase retornó un ID nulo."); }

      if (args.selectedScheduleIds.length > 0) {
        await ctx.runMutation(api.functions.classSchedule.createClassSchedule, {
          classCatalogId: newClassId,
          selectedScheduleIds: args.selectedScheduleIds,
          status: args.classData.status,
        });
      }

      return { success: true, classId: newClassId };
      
    } catch (error) {
      if (newClassId) {
        await ctx.runMutation(internal.functions.classCatalog.internalDeleteClassCatalog, {
          classCatalogId: newClassId,
        });
      }
      throw new Error("Falló la operación. Los cambios han sido revertidos.");
    }
  },
});

export const deleteClassAndSchedules = action({
  // Recibe el ID de la clase que se va a eliminar
  args: { classCatalogId: v.id("classCatalog") },
  handler: async (ctx, args) => {
    
    // Paso 1: Buscar todos los horarios que pertenecen a esa clase
    const schedulesToDelete = await ctx.runQuery(
      internal.functions.classSchedule.getSchedulesByClassCatalog,
      { classCatalogId: args.classCatalogId }
    );

    // Paso 2: Borrar cada uno de los horarios encontrados
    for (const schedule of schedulesToDelete) {
      await ctx.runMutation(internal.functions.classSchedule.deleteScheduleById, {
        scheduleId: schedule._id,
      });
    }

    // Paso 3: Una vez borrados los horarios, borrar la clase principal
    await ctx.runMutation(internal.functions.classCatalog.internalDeleteClassCatalog, {
      classCatalogId: args.classCatalogId,
    });

    return { success: true };
  },
});