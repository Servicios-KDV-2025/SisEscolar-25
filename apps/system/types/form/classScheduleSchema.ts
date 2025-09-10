import { z } from "zod";

export const weekDays = [
  { value: "lun.", label: "Lunes" },
  { value: "mar.", label: "Martes" },
  { value: "mié.", label: "Miércoles" },
  { value: "jue.", label: "Jueves" },
  { value: "vie.", label: "Viernes" },
] as const;

// Esquema para horarios existentes de la tabla schedule
export const ScheduleSchema = z.object({
  _id: z.string(),
  schoolId: z.string(),
  name: z.string(),
  day: z.enum(["lun.", "mar.", "mié.", "jue.", "vie."]),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(["active", "inactive"]),
  updatedAt: z.number(),
});

// Esquema para crear/editar clases con horarios seleccionados
export const CreateClassFormSchema = z.object({
  classCatalogId: z.string().min(1, "Debe seleccionar una clase"),
  selectedScheduleIds: z.array(z.string()).min(1, "Debe seleccionar al menos un horario"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const EditClassFormSchema = z.object({
  _id: z.string(),
  classCatalogId: z.string().min(1, "Debe seleccionar una clase"),
  selectedScheduleIds: z.array(z.string()).min(1, "Debe seleccionar al menos un horario"),
  status: z.enum(["active", "inactive"]).default("active"),
});

// Esquemas para formularios sin schedules
export const CreateClassFormSchemaWithoutSchedules = CreateClassFormSchema.omit({ selectedScheduleIds: true });
export const EditClassFormSchemaWithoutSchedules = EditClassFormSchema.omit({ selectedScheduleIds: true, _id: true });

export type Schedule = z.infer<typeof ScheduleSchema>;
export type CreateClassFormData = z.infer<typeof CreateClassFormSchema>;
export type EditClassFormData = z.infer<typeof EditClassFormSchema>;

// Tipo para conflictos de horarios
export interface ScheduleConflict {
  type: "group" | "teacher" | "classroom";
  message: string;
  conflictingClass: string;
}