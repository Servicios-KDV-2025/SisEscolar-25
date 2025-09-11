import { z } from '@repo/zod-config/index';

export const classCatalogSchema = z.object({
  schoolCycleId: z.string(),
  subjectId: z.string(),
  classroomId: z.string(),
  teacherId: z.string(),
  groupId: z.string(),
  name: z.string().min(1, { message: 'El nombre es es requerído' }),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type ClassCatalogFormValues = z.infer<typeof classCatalogSchema>;
