export const PAYMENT_TYPES = {
  inscripción: "Inscripción",
  colegiatura: "Colegiatura",
  examen: "Examen",
  "material-escolar": "Material Escolar",
  "seguro-vida": "Seguro de Vida",
  "plan-alimenticio": "Plan Alimenticio",
  otro: "Otro"
} as const

export const RECURRENCE_TYPES = {
  cuatrimestral: "Cuatrimestral",
  semestral: "Semestral",
  sabatino: "Sabatino",
  mensual: "Mensual",
  diario: "Diario",
  semanal: "Semanal",
  anual: "Anual",
  unico: "Único"
} as const

export const STATUS_TYPES = {
  required: "Obligatorio",
  optional: "Opcional",
  inactive: "Inactivo"
} as const

export const SCOPE_TYPES = {
  all_students: "Todos los estudiantes",
  specific_groups: "Grupos específicos",
  specific_grades: "Grados específicos",
  specific_students: "Estudiantes específicos"
} as const