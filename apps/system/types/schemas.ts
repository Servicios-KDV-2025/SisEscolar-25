import { z } from "@repo/zod-config/index";

// =====================================================
// SCHEMAS DE USUARIOS
// =====================================================

/**
 * Schema base para usuarios del sistema
 * Contiene todos los campos comunes a cualquier tipo de usuario
 */
export const userSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().optional(),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.number().optional(),
  admissionDate: z.number().optional(),
  imgUrl: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

/**
 * Schema para super-administradores
 * Los super-administradores tienen acceso completo sin restricciones departamentales
 * Extiende del schema base de usuarios sin campos adicionales
 */
export const superAdminSchema = userSchema;

// -----------------------------------------------------
// TIPOS DERIVADOS
// -----------------------------------------------------

/**
 * Tipo base para entidades con metadata del sistema (Convex)
 */
export type WithSystemMetadata = {
  _id: string;
  _creationTime: number;
  createdAt: number;
  updatedAt: number;
};

/**
 * Tipo base para entidades con ClerkId
 */
export type WithClerkId = {
  clerkId: string;
};

// Tipos derivados de los schemas
export type User = z.infer<typeof userSchema>;
export type SuperAdmin = z.infer<typeof superAdminSchema>;

// Tipos completos con metadata del sistema
export type UserWithMetadata = User & WithSystemMetadata & WithClerkId;
export type SuperAdminWithMetadata = SuperAdmin & WithSystemMetadata & WithClerkId;
