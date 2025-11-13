import { z } from "@repo/zod-config/index";

const validColorNames = [
  "blue", "green", "yellow", "red", "purple", "cyan", "orange", "pink", "gray" // Añade 'gray' por si acaso
] as const;

export const EventTypeSchema = z.object({
  name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .refine(
      (value) => !value.includes("  "),
      "El nombre no puede contener espacios dobles"
    ),
  key: z.string()
    .min(2, "La clave debe tener al menos 2 caracteres")
    .max(20, "La clave no puede exceder 10 caracteres")
    .regex(/^[A-Z0-9_]+$/, "La clave debe contener solo mayúsculas, números y guiones bajos")
    .refine(
      (value) => !value.startsWith("_") && !value.endsWith("_"),
      "La clave no puede comenzar o terminar con guión bajo"
    ),
  description: z.string()
    .max(200, "La descripción no puede exceder 200 caracteres")
    .optional(),
  color: z.enum(validColorNames).optional(),
  icon: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export type EventTypeFormData = z.infer<typeof EventTypeSchema>;