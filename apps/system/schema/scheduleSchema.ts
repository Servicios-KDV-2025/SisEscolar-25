import { z } from '@repo/zod-config/index'

export const scheduleSchema =  z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  scheduleDate: z.string().min(1, 'La fecha del horario es obligatoria'),
  startTime: z.string().min(1, 'La hora de inicio es obligatoria'),
  endTime: z.string().min(1, 'La hora de fin es obligatoria'),
  status: z.enum(['active', 'inactive'], 'El estado es obligatorio')
}).refine(
  (data) => data.startTime !== data.endTime,
  {
    message: 'La hora de inicio y fin no pueden ser iguales',
    path: ['endTime']
  }
).refine(
  (data) => data.startTime < data.endTime,
  {
    message: 'La hora de inicio debe ser anterior a la hora de fin',
    path: ['startTime']
  }
)

export type ScheduleFormData = z.infer<typeof scheduleSchema>