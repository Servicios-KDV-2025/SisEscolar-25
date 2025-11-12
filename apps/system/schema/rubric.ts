import z from "zod";

export const rubricSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  weight: z.array(z.number()).min(1, 'El porcentaje es obligatorio'),
  maxScore: z.union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? Number.parseInt(val) || 0 : val)
    .pipe(
      z.number()
        .min(1, 'La puntuación máxima debe ser al menos 1')
        .max(100, 'La puntuación máxima no puede ser mayor a 100')
    ),
  class: z.string().min(1, 'La clase es obligatoria'),
  term: z. string().min(1, 'El período es obligatorio'),
})

export type RubricFormValues = z.infer<typeof rubricSchema>