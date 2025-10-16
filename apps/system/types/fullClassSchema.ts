import { z } from "zod";

export const FullClassSchema = z.object({
  
  name: z.string().min(1, "El nombre es requerido"),
  schoolCycleId: z.string().min(1, "El ciclo escolar es requerido"),
  subjectId: z.string().min(1, "La materia es requerida"),
  classroomId: z.string().min(1, "El salón es requerido"),
  teacherId: z.string().min(1, "El maestro es requerido"),
  groupId: z.string().min(1, "El grupo es requerido"),
  status: z.enum(["active", "inactive"]),
  

  selectedScheduleIds: z.array(z.string()).optional(),
});