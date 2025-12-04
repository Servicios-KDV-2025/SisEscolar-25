import { z } from "@repo/zod-config/index";

// Esquema para validar el formulario de tareas
export const taskFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre de la tarea es obligatorio")
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  
  dueDate: z
    .string()
    .min(1, "La fecha de entrega es obligatoria"),
  
  dueTime: z
    .string()
    .min(1, "La hora límite es obligatoria")
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  
  maxScore: z
    .number()
    .min(1, "La puntuación máxima es obligatoria")
    .refine((val) => {
      const num = val;
      return !isNaN(num) && num > 0 && num <= 100;
    }, "La puntuación debe ser un número entre 1 y 100"),
  
  classCatalogId: z
    .string()
    .min(1, "Debes seleccionar una clase"),
  
  termId: z
    .string()
    .min(1, "Debes seleccionar un período"),
  
  gradeRubricId: z
    .string()
    .min(1, "Debes seleccionar una rúbrica de calificación"),
})
.refine((data) => {
  // Validar que la fecha y hora combinadas no sean en el pasado
  const dueDateTime = new Date(`${data.dueDate}T${data.dueTime}`);
  const now = new Date();
  
  return dueDateTime > now;
}, {
  message: "La fecha y hora de entrega no pueden ser en el pasado",
  path: ["dueDate"], // El error se mostrará en el campo de fecha
});

// Tipo derivado del esquema
export type TaskFormData = z.infer<typeof taskFormSchema>;

// Función helper para validar datos
export const validateTaskForm = (data: unknown) => {
  return taskFormSchema.safeParse(data);
};

// Función helper para obtener errores de validación
export const getValidationErrors = (data: unknown) => {
  const result = taskFormSchema.safeParse(data);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    const formErrors = result.error.flatten().formErrors;
    
    // Si hay errores de formulario (como el refine), los agregamos al campo correspondiente
    if (formErrors.length > 0) {
      // Buscar el error de fecha/hora en el pasado
      const dateTimeError = formErrors.find(error => 
        error.includes("fecha y hora de entrega no pueden ser en el pasado")
      );
      
      if (dateTimeError) {
        fieldErrors.dueDate = [dateTimeError];
      }
    }
    
    return fieldErrors;
  }
  return null;
};
