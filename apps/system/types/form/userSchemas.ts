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
  phone: z.string()
    .regex(/^\d+$/, "El teléfono solo puede contener números (dígitos).")
    .min(9, "El teléfono debe tener al menos 9 caracteres")
    .max(12, "El teléfono no puede tener más de 12 caracteres")
    .optional(),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres").max(150, "La dirección no puede tener más de 150 caracteres").optional(),
  birthDate: z.number().optional(),
  admissionDate: z.number().optional(),
  imgUrl: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

/**
 * Schema para super-administradores (para creación)
 * Los super-administradores tienen acceso completo sin restricciones departamentales
 * Password opcional porque puede asignar usuarios existentes
 */
export const superAdminCreateSchema = userSchema.extend({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional(),
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
 * Schema para tutores (creación)
 * Los tutores tienen acceso a información de sus alumnos asignados
 */
export const tutorCreateSchema = userSchema.extend({
  password: z.string().optional().refine((val) => {
    // Si se proporciona password, debe tener al menos 8 caracteres
    if (val && val.length > 0) {
      return val.length >= 8;
    }
    return true;
  }, {
    message: "La contraseña debe tener al menos 8 caracteres"
  }),
});

/**
 * Schema para tutores (edición)
 * Los tutores tienen acceso a información de sus alumnos asignados
 */
export const tutorEditSchema = userSchema;

/**
 * Schema para tutores (general)
 * Los tutores tienen acceso a información de sus alumnos asignados
 */
export const tutorSchema = userSchema.extend({
  password: z.string().optional().refine((val) => {
    // Si se proporciona password, debe tener al menos 8 caracteres
    if (val && val.length > 0) {
      return val.length >= 8;
    }
    return true;
  }, {
    message: "La contraseña debe tener al menos 8 caracteres"
  }),
});

/**
 * Schema unificado para gestión de usuarios
 * Incluye selección de rol y departamento para el CrudDialog unificado
 * Soporta tanto un rol único (string) como múltiples roles (array)
 */
export const unifiedUserCreateSchema = userSchema.extend({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional(),
  role: z.union([
    z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"]),
    z.array(z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"])).min(1, "Debe seleccionar al menos un rol")
  ], {
    message: "Debe seleccionar un rol"
  }),
  department: z.enum(["secretary", "direction", "schoolControl", "technology"]).optional(),
}).refine((data) => {
  // Si el rol es admin (o incluye admin en el array), el departamento es requerido
  const roles = Array.isArray(data.role) ? data.role : [data.role];
  if (roles.includes("admin") && !data.department) {
    return false;
  }
  return true;
}, {
  message: "El departamento es requerido para administradores",
  path: ["department"]
});

export const unifiedUserEditSchema = userSchema.extend({
  role: z.union([
    z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"]),
    z.array(z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"])).min(1, "Debe seleccionar al menos un rol")
  ], {
    message: "Debe seleccionar un rol"
  }),
  department: z.enum(["secretary", "direction", "schoolControl", "technology"]).optional(),
}).refine((data) => {
  // Si el rol es admin (o incluye admin en el array), el departamento es requerido
  const roles = Array.isArray(data.role) ? data.role : [data.role];
  if (roles.includes("admin") && !data.department) {
    return false;
  }
  return true;
}, {
  message: "El departamento es requerido para administradores",
  path: ["department"]
});

export const unifiedUserSchema = userSchema.extend({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional(),
  role: z.union([
    z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"]),
    z.array(z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"])).min(1, "Debe seleccionar al menos un rol")
  ], {
    message: "Debe seleccionar un rol"
  }),
  department: z.enum(["secretary", "direction", "schoolControl", "technology"]).optional(),
}).refine((data) => {
  // Si el rol es admin (o incluye admin en el array), el departamento es requerido
  const roles = Array.isArray(data.role) ? data.role : [data.role];
  if (roles.includes("admin") && !data.department) {
    return false;
  }
  return true;
}, {
  message: "El departamento es requerido para administradores",
  path: ["department"]
});

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
export type TutorCreate = z.infer<typeof tutorCreateSchema>;
export type TutorEdit = z.infer<typeof tutorEditSchema>;
export type Student = z.infer<typeof studentSchema>;
export type UserSchool = z.infer<typeof userSchoolSchema>;

// Tipos para schemas unificados
export type UnifiedUser = z.infer<typeof unifiedUserSchema>;
export type UnifiedUserCreate = z.infer<typeof unifiedUserCreateSchema>;
export type UnifiedUserEdit = z.infer<typeof unifiedUserEditSchema>;

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
