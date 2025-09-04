import { z } from "zod";

export const studentClassSchema = z.object({
  _id: z.string().optional(),
  schoolId: z.string().optional(),
  classCatalogId: z.string().min(1, "Debe seleccionar una clase"),
  studentId: z.string().min(1, "Debe seleccionar un alumno"),
  enrollmentDate: z.string().min(1, "La fecha de inscripción es requerida"),
  status: z.enum(["active", "inactive"]),
  averageScore: z.number().min(0).max(100, "El promedio debe estar entre 0 y 100").optional(),
});

export type StudentClassDto = z.infer<typeof studentClassSchema>;