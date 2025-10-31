import z from "zod";

export const rubricSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  weight: z.array(z.number()).min(1, 'El porcentaje es obligatorio'),
  maxScore: z.number()
    .min(1, 'La puntuación máxima debe ser entre 1 y 100')
    .max(100, 'La puntuación máxima debe ser entre 1 y 100')
    .refine((val) => !isNaN(val), 'La calificación máxima debe ser un número válido'),
  class: z.string().min(1, 'La clase es obligatoria'),
  term: z. string().min(1, 'El período es obligatorio'),
})

export type RubricFormValues = z.infer<typeof rubricSchema>