import { z } from '@repo/zod-config/index';

export const termSchema = z.object({
  name: z.string()
    .min(1, { message: 'El nombre es requerido' })
    .max(50, { message: 'El nombre no puede exceder 50 caracteres' }),
  key: z.string()
    .min(1, { message: 'La clave es requerida' })
    .max(10, { message: 'La clave no puede exceder 10 caracteres' }),
  startDate: z.string()
    .min(1, { message: 'La fecha de inicio es requerida' }),
  endDate: z.string()
    .min(1, { message: 'La fecha de fin es requerida' }),
  status: z.enum(["active", "inactive", "closed"]).default("active"),
  schoolCycleId: z.string()
    .min(1, { message: 'El ciclo escolar es requerido' }),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["endDate"],
});

export type TermFormValues = z.infer<typeof termSchema>;