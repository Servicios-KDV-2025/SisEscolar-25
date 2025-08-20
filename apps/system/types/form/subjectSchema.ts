import { z } from "@repo/zod-config/index";

export const subjectSchema = z.object({
  name: z.string().min(1, "El nombre de la materia es obligatorio.").max(25, "Máximo 25 caractéres"),
  description: z.string().max(150, 'Máximo 150 caractéres.').optional(),
  credits: z.union([
    z.number().min(0, "Los créditos deben ser positivos").max(10, "Máximo 10 créditos"),
    z.undefined()
  ]).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type SubjectFormValues = z.input<typeof subjectSchema>;