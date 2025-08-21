import { z } from '@repo/zod-config/index';

export const groupSchema = z.object({
  grade: z.enum(["1°", "2°", "3°", "4°", "5°", "6°"], { message: "Selecciona un grado válido" }),
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type GroupFormValues = z.infer<typeof groupSchema>;
