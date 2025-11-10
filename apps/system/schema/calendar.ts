import { z } from "@repo/zod-config/index";
const requiredDateSchema = z
  .coerce
  .date()
  .refine(d => !isNaN(d.getTime()), {
    message: "La fecha es obligatoria y debe ser válida.",
  });

export const CalendarSchema = z.object({
  title: z
    .string()
    .min(1, { message: "El título es obligatorio." })
    .max(50, { message: "El título no puede exceder 50 caracteres." })
    .default("")
    .refine((value) => !/^\s*$/.test(value), {
      message: "El título no puede ser solo espacios en blanco.",
    }),

  location: z
    .string()
    .max(100, { message: "La ubicación no puede exceder 100 caracteres." })
    .optional()
    .or(z.literal("")),
  startDate: requiredDateSchema,
  endDate: requiredDateSchema,

  allDay: z.boolean().optional(),

  eventTypeId: z.string().min(1, "Debe seleccionar un tipo de evento"),

  description: z
    .string()
    .max(200, "La descripción no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),

  schoolCycleId: z.string().min(1, "Debe seleccionar un ciclo escolar"),
  status: z.enum(['active', 'inactive']).optional(),
})
.refine((data) => {
    if (data.startDate instanceof Date && !isNaN(data.startDate.getTime()) &&
        data.endDate instanceof Date && !isNaN(data.endDate.getTime())) {
      return data.endDate >= data.startDate;
    }
    return true; 
  }, {
  message: "La fecha final no puede ser anterior a la fecha de inicio.",
  path: ["endDate"], 
});

export type CalendarFormValues = z.infer<typeof CalendarSchema>;