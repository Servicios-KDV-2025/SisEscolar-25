import { z } from "@repo/zod-config/index";

export const CalendarSchema = z.object({
    date: z.date().min(1, "La fecha es obligatoria"),
    eventTypeId: z.string().min(1, "Debe seleccionar un tipo de evento"),
    description: z
        .string()
        .max(500, "La descripción no puede exceder 500 caracteres")
        .optional(),
    schoolCycleId: z.string(),
    status: z.enum(['active', 'inactive']).optional()
});

export type CalendarFormValues = z.infer<typeof CalendarSchema>;