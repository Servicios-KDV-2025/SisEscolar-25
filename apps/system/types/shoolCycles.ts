
// shoolCycles.ts
import { z } from "@repo/zod-config/index";

export const cicloEscolarSchema = z.object({
  name: z.string()
    .min(3, "El nombre es requerido y debe tener al menos 3 caracteres")
    .max(50, "El nombre debe tener máximo 50 caracteres"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  status: z.enum(["active", "inactive", "archived"]),
})
.refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["endDate"],
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const diffInMs = endDate.getTime() - startDate.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  return diffInDays >= 28; 
}, {
  message: "El ciclo escolar debe durar al menos 28 días",
  path: ["endDate"],
})
.refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const diffInYears = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return diffInYears <= 5;
}, {
  message: "El ciclo escolar no puede durar más de 5 años",
  path: ["endDate"],
});

export type CicloEscolarFormValues = z.input<typeof cicloEscolarSchema>;