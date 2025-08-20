import { z } from '@repo/zod-config/index'

export const scheduleSchema =  z.object({
  name: z.string().min(1, 'Limite de caracteres alcanzado'),
  day: z.string().min(1, 'El día es obligatorio'),
  week: z.string().min(1, 'La semana es obligatoria')
    .regex(/^[0-9]+$/, { message: 'Solo se permiten números del 0 al 9' }),
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
    message: 'La hora de inicio no debe ser posterior a la hora de fin',
    path: ['startTime']
  }
).refine(
  (data) => {
    const startTime = data.startTime.split(':').map(Number);
    const startHour = startTime[0] ?? 0;
    const startMinute = startTime[1] ?? 0;
    const startMinutes = startHour * 60 + startMinute;
    return startMinutes >= 360 && startMinutes <= 900; // 6:00 = 360 min, 15:00 = 900 min
  },
  {
    message: 'La hora de inicio debe estar entre 6:00 y 15:00',
    path: ['startTime']
  }
).refine(
  (data) => {
    const endTime = data.endTime.split(':').map(Number);
    
    const endHour = endTime[0] ?? 0;
    const endMinute = endTime[1] ?? 0;
    const endMinutes = endHour * 60 + endMinute;
    return endMinutes >= 360 && endMinutes <= 900; // 6:00 = 360 min, 15:00 = 900 min
  },
  {
    message: 'La hora de fin debe estar entre 6:00 y 15:00',
    path: ['endTime']
  }
)

export type ScheduleFormData = z.infer<typeof scheduleSchema>