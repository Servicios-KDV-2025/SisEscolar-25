// packages/validators/school.ts
import { z } from 'zod';
// nombre 50  nombrecorto-cct 15 dirección 200 telefono 12 email 35 des 200
export const schoolValidationSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }).max(50,{message:"El nombre debe tener maximo 35 caracteres."}),
  shortName: z.string().min(2, { message: "El nombre corto es requerido." }).max(50,{message:"El nombre corto debe tener maximo 15 caracteres."}),
  cctCode: z.string().min(5, { message: "El CCT no es válido." }).max(15,{message:"El CCT debe tener maximo 15 caracteres."}),
  address: z.string().min(10, { message: "La dirección es muy corta." }).max(50,{message:"La dirección debe tener maximo 200 caracteres."}),
  phone: z.string()
  .regex(/^\d+$/, { message: "El teléfono solo debe contener números." })
  .min(10, { message: "El teléfono debe tener al menos 10 dígitos." })
  .max(12, { message: "El teléfono no puede tener más de 12 dígitos." }),
  email: z.string().email({ message: "El correo electrónico no es válido." }),
  description: z.string().min(10, { message: "La descripción es muy corta." }).max(500),
  imgUrl: z.string().url({ message: "La URL de la imagen no es válida." }).optional().or(z.literal('')),
});

export type SchoolValidationSchema = z.infer<typeof schoolValidationSchema>;