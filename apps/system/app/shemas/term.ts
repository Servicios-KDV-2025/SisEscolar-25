import { z } from 'zod';

// Esquema de validación para los datos del formulario de periodos.
// Este esquema define las reglas de negocio para cada campo del formulario.
export const termFormSchema = z.object({
  // El nombre debe ser una cadena de texto con una longitud entre 3 y 50 caracteres.
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(50, "El nombre debe tener menos de 50 caracteres."),

  // La clave no puede estar vacía.
  key: z.string().min(1, "La clave no puede estar vacía."),

  // Ambas fechas son requeridas.
  startDate: z.string().min(1, "La fecha de inicio es requerida."),
  endDate: z.string().min(1, "La fecha de fin es requerida."),

  // El ID del ciclo escolar es requerido.
  schoolCycleId: z.string().min(1, "Debes seleccionar un ciclo escolar."),

  // El estado es opcional y debe ser uno de los valores definidos.
  status: z.enum(["active", "inactive", "closed"]).optional(),
}).refine(data => {
  // Verificamos que la fecha de inicio sea anterior a la fecha de fin.
  return new Date(data.startDate).getTime() < new Date(data.endDate).getTime();
}, {
  // Mensaje de error si la validación falla.
  message: "La fecha de inicio debe ser anterior a la fecha de fin.",
  path: ["dates"],
});
