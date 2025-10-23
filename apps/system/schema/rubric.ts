import z from "zod";

export const rubricSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  weight: z.number(),
  maxScore: z.number().min(1, 'La puntuación máxima debe ser...'),
  schoolCycle: z.string(),
  class: z.string(),
  term: z.string(),
})

export type RubricFormValues = z.infer<typeof rubricSchema>