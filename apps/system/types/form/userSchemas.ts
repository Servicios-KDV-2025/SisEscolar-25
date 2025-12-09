import { z } from "@repo/zod-config/index";
import validateRfc from "validate-rfc";

// =====================================================
// SCHEMAS DE USUARIOS
// =====================================================

/**
 * Schema base para usuarios del sistema
 * Contiene todos los campos comunes a cualquier tipo de usuario
 */
export const userSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.email("El formato del correo es inválido"),
  phone: z.string()
    .regex(/^\d+$/, "El teléfono es un campo obligatorio")
    .min(10, "El teléfono debe tener al menos 9 caracteres")
    .max(10, "El teléfono no puede tener más de 10 caracteres"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres").max(150, "La dirección no puede tener más de 150 caracteres"),
  birthDate: z.number().optional(),
  admissionDate: z.number().optional(),
  imgUrl: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active")
});

const passwordSchema = z.string().check((ctx) => {
  const missing: string[] = [];

  if (ctx.value.length < 8) {
    missing.push("al menos 8 caracteres");
  }
  if (!/[A-Z]/.test(ctx.value)) {
    missing.push("una letra mayúscula");
  }
  if (!/[a-z]/.test(ctx.value)) {
    missing.push("una letra minúscula");
  }
  if (!/\d/.test(ctx.value)) {
    missing.push("un número");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]/.test(ctx.value)) {
    missing.push("un carácter especial (ej. !@#$%&*)");
  }

  if (missing.length > 0) {
    const message =
      "La contraseña debe incluir " +
      missing
        .map((m, i) => {
          if (i === 0) return m;
          if (i === missing.length - 1) return "y " + m;
          return m;
        })
        .join(", ") +
      ".";
    
    // agregamos un *solo* issue con el mensaje combinado
    ctx.issues.push({
      code: "custom",
      message,
      path: [],
      input: ctx.value,
    });
  }

});


/**
 * Schema para super-administradores (para creación)
 * Los super-administradores tienen acceso completo sin restricciones departamentales
 * Password opcional porque puede asignar usuarios existentes
 */
export const superAdminCreateSchema = userSchema.extend({
  password: passwordSchema,
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
  password: passwordSchema,
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
  password: passwordSchema.optional(),
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
  password: passwordSchema,
});

/**
 * Schema unificado para gestión de usuarios
 * Incluye selección de rol y departamento para el CrudDialog unificado
 * Soporta tanto un rol único (string) como múltiples roles (array)
 */
export const unifiedUserCreateSchema = userSchema.extend({
  password: passwordSchema.optional(),
  role: z.union([
    z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"], "Es obligatorio seleccionar un rol"),
    z.array(z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"], "Es obligatorio seleccionar un rol")).min(1, "Debe seleccionar al menos un rol")
  ], {
    message: "Es obligatorio seleccionar un rol"
  }),
  department: z.enum(["secretary", "direction", "schoolControl", "technology"]).optional(),
  isTutor: z.boolean().optional(), // 👈 Campo auxiliar solo para UI
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
    z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"], "Es obligatorio seleccionar un rol"),
    z.array(z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"], "Es obligatorio seleccionar un rol")).min(1, "Debe seleccionar al menos un rol")
  ], {
    message: "Es obligatorio seleccionar un rol"
  }),
  department: z.enum(["secretary", "direction", "schoolControl", "technology"]).optional(),
  isTutor: z.boolean().optional(), // 👈 Campo auxiliar solo para UI
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

/**
 * Schema unificado para visualización o casos generales
 */
export const unifiedUserSchema = userSchema.extend({
  password: passwordSchema,
  role: z.union([
    z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"]),
    z.array(z.enum(["superadmin", "admin", "auditor", "teacher", "tutor"])).min(1, "Debe seleccionar al menos un rol")
  ], {
    message: "Es obligatorio seleccionar un rol"
  }),
  department: z.enum(["secretary", "direction", "schoolControl", "technology"]).optional(),
  isTutor: z.boolean().optional(), // 👈 Campo auxiliar solo para UI
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
  schoolCycleId: z.string(),
  enrollment: z.string(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().optional(),
  birthDate: z.number().optional(),
  admissionDate: z.number().optional(),
  imgUrl: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  scholarshipType: z.union([z.literal("inactive"), z.literal("active")]),
  scholarshipPercentage: z.number().max(100, "El porcentaje debe ser menor a 100").optional(),
}).refine(
  (data) => {
    if (data.scholarshipType === "active") {
      return data.scholarshipPercentage && data.scholarshipPercentage > 0;
    }
    return true;
  },
  {
    message: "El porcentaje no puede ser 0",
    path: ["scholarshipPercentage"],
  }
);

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

function isValidRFC(rfc: string): boolean {
  const result = validateRfc(rfc);
  return result.isValid;
}

export const fiscalDataSchema = z.object({
  legalName: z
    .string()
    .trim()
    .nonempty("El nombre o razón social es obligatorio")
    .min(2, "El nombre o razón social debe tener al menos 2 caracteres")
    .max(120, "El nombre o razón social no puede tener más de 120 caracteres")
    .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,&'-]+$/, "El nombre contiene caracteres inválidos"),
  taxId: z
    .string()
    .min(12, "El RFC no tiene un formato válido")
    .max(13)
    .refine((val) => isValidRFC(val), {
      message: "El RFC no tiene un formato válido",
    }),
  taxSystem: z.enum(["605", "606", "612", "616"], {
    message: "Debe seleccionar un régimen fiscal válido",
  }),
  cfdiUse: z.enum(["G03", "D10"], {
    message: "Debe seleccionar un uso de CFDI válido",
  }),
  street: z
    .string()
    .trim()
    .nonempty("La calle es obligatoria")
    .min(3, "La calle debe tener al menos 3 caracteres")
    .max(100, "La calle no puede tener más de 100 caracteres"),
  exteriorNumber: z
    .string()
    .nonempty("El número exterior es obligatorio")
    .trim()
    .refine((val) => (val !== undefined && val !== null) || val === "", "El número exterior es requerido")
    .regex(/^[\w-]+$/, "El número exterior contiene caracteres inválidos")
    .min(1, "El número exterior es requerido"),
  interiorNumber: z
    .string()
    .optional(),
  neighborhood: z
    .string()
    .trim()
    .nonempty("La colonia es obligatoria")
    .min(2, "La colonia debe tener al menos 2 caracteres")
    .max(100, "La colonia no puede tener más de 100 caracteres"),
  city: z
    .string()
    .trim()
    .nonempty("La ciudad es obligatoria")
    .min(2, "La ciudad debe tener al menos 2 caracteres")
    .max(100, "La ciudad no puede tener más de 100 caracteres"),
  state: z
    .string()
    .trim()
    .nonempty("El estado es obligatorio")
    .min(2, "El estado debe tener al menos 2 caracteres")
    .max(100, "El estado no puede tener más de 100 caracteres"),
  zip: z
    .string()
    .trim()
    .nonempty("El código es obligatorio")
    .regex(/^\d{5}$/, "El código postal debe tener exactamente 5 dígitos"),
  country: z.literal("MXN").default("MXN"),
  email: z
    .string()
    .nonempty("El correo es obligatorio")
    .email("Correo inválido"),
  phone: z
    .string()
    .trim()
    .nonempty("El teléfono es obligatorio")
    .regex(/^\d{10}$/, "El teléfono debe tener exactamente 10 dígitos (solo números)")
    .optional(),
});

export const fiscalDataCreateSchema = fiscalDataSchema.extend({
  userId: z.string(),
});

export const fiscalDataEditSchema = fiscalDataSchema;

export type FiscalData = z.infer<typeof fiscalDataSchema>;
export type FiscalDataCreate = z.infer<typeof fiscalDataCreateSchema>;
export type FiscalDataEdit = z.infer<typeof fiscalDataEditSchema>;
