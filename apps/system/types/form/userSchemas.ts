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
 * Schema para super-administradores (para creación)
 * Los super-administradores tienen acceso completo sin restricciones departamentales
 * Incluye password requerido para creación
 */
export const superAdminCreateSchema = userSchema.extend({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

/**
 * Schema para super-administradores (para edición)
 * Los super-administradores tienen acceso completo sin restricciones departamentales
 * Sin password para edición
 */
export const superAdminEditSchema = userSchema;

/**
 * Schema combinado para super-administradores (retrocompatibilidad)
 * Hace el password opcional para que funcione tanto para crear como editar
 */
export const superAdminSchema = userSchema.extend({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional(),
});

/**
 * Schema para administradores
 * Los administradores tienen acceso administrativo con restricciones departamentales
 */
export const adminSchema = userSchema;

/**
 * Schema para auditores
 * Los auditores tienen acceso de solo lectura para verificar y auditar
 */
export const auditorSchema = userSchema;

/**
 * Schema para docentes
 * Los docentes tienen acceso a funcionalidades relacionadas con la enseñanza
 */
export const teacherSchema = userSchema;

/**
 * Schema para tutores
 * Los tutores tienen acceso a información de sus alumnos asignados
 */
export const tutorSchema = userSchema;

// =====================================================
// SCHEMAS DE RELACIONES USUARIO-ESCUELA
// =====================================================

/**
 * Schema para la relación usuario-escuela
 * Define los roles y departamentos de un usuario en una escuela específica
 */
export const userSchoolSchema = z.object({
  userId: z.string(),
  schoolId: z.string(),
  role: z.array(z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"])),
  status: z.enum(["active", "inactive"]),
  department: z.enum(["secretary", "direction", "schoolControl", "technology"]).optional(),
});

// =====================================================
// SCHEMAS DE ALUMNOS (TABLA SEPARADA)
// =====================================================

/**
 * Schema para alumnos
 * Los alumnos son una entidad separada que no extiende de user
 */
export const studentSchema = z.object({
  schoolId: z.string(),
  groupId: z.string(),
  tutorId: z.string(),
  enrollment: z.string(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().optional(),
  birthDate: z.number().optional(),
  admissionDate: z.number().optional(),
  imgUrl: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

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
export type SuperAdminCreate = z.infer<typeof superAdminCreateSchema>;
export type SuperAdminEdit = z.infer<typeof superAdminEditSchema>;
export type Admin = z.infer<typeof adminSchema>;
export type Auditor = z.infer<typeof auditorSchema>;
export type Teacher = z.infer<typeof teacherSchema>;
export type Tutor = z.infer<typeof tutorSchema>;
export type Student = z.infer<typeof studentSchema>;
export type UserSchool = z.infer<typeof userSchoolSchema>;

// Tipos completos con metadata del sistema
export type UserWithMetadata = User & WithSystemMetadata & WithClerkId;
export type SuperAdminWithMetadata = SuperAdmin & WithSystemMetadata & WithClerkId;
export type AdminWithMetadata = Admin & WithSystemMetadata & WithClerkId;
export type AuditorWithMetadata = Auditor & WithSystemMetadata & WithClerkId;
export type TeacherWithMetadata = Teacher & WithSystemMetadata & WithClerkId;
export type TutorWithMetadata = Tutor & WithSystemMetadata & WithClerkId;
export type StudentWithMetadata = Student & WithSystemMetadata;

// Tipo para usuarios con información de escuela
export type UserWithSchoolInfo = UserWithMetadata & {
  userSchool?: UserSchool & WithSystemMetadata;
};

// Tipos específicos para cada rol con información de escuela
export type AdminWithSchoolInfo = AdminWithMetadata & {
  userSchool?: UserSchool & WithSystemMetadata;
};

export type AuditorWithSchoolInfo = AuditorWithMetadata & {
  userSchool?: UserSchool & WithSystemMetadata;
};

export type TeacherWithSchoolInfo = TeacherWithMetadata & {
  userSchool?: UserSchool & WithSystemMetadata;
};

export type TutorWithSchoolInfo = TutorWithMetadata & {
  userSchool?: UserSchool & WithSystemMetadata;
};
