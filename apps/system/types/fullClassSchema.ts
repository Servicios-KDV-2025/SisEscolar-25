import { z } from "zod";

export const FullClassSchema = z.object({
  
  name: z.string().min(1, "El nombre es requerido"),
  status: z.enum(["active", "inactive"]),
  schoolCycleId: z.string().min(1, "El ciclo escolar es requerido"),
  subjectId: z.string().min(1, "La materia es requerida"),
  classroomId: z.string().min(1, "El aula es requerida"),
  teacherId: z.string().min(1, "El profesor es requerido"),
  groupId: z.string().min(1, "El grupo es requerido"),
  selectedScheduleIds: z.array(z.string())
    .min(1, "Debes seleccionar al menos un horario"),
});