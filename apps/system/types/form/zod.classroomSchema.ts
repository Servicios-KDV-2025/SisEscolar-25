import { z } from '@repo/zod-config/index';

export const classroomSchema = z.object({
  schoolId: z.string(),
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  capacity: z.number().positive({ message: 'La capacidad debe ser mayor a 0' }),
  location: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ClassroomFormValues = z.infer<typeof classroomSchema>;
