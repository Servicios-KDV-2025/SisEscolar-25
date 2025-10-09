import { z } from "zod"

export const billingConfigSchema = z
  .object({
    _id: z.string().optional(),
    schoolCycleId: z.string().min(1, "El ciclo escolar es obligatorio"),
    scope: z.enum(
      [
        "all_students",
        "specific_groups",
        "specific_grades",
        "specific_students",
      ],
    ),
    targetGroup: z.array(z.string()).optional(),
    targetGrade: z.array(z.string()).optional(),
    targetStudent: z.array(z.string()).optional(),
    recurrence_type: z.enum(
      [
        "cuatrimestral",
        "semestral",
        "sabatino",
        "mensual",
        "diario",
        "semanal",
        "anual",
        "unico",
      ],
    ),
    type: z.enum(
      [
        "inscripción",
        "colegiatura",
        "examen",
        "material-escolar",
        "seguro-vida",
        "plan-alimenticio",
        "otro",
      ],
    ),
    amount: z
      .number()
      .positive("El monto debe ser mayor a 0")
      .max(1000000, "El monto no puede exceder $1,000,000"),
    status: z.enum(["required", "optional", "inactive"]),
    startDate: z
      .string()
      .min(1, "La fecha de inicio es obligatoria")
      .refine(
        (date) => !isNaN(Date.parse(date)),
        "La fecha de inicio debe ser válida"
      ),
    endDate: z
      .string()
      .min(1, "La fecha de fin es obligatoria")
      .refine(
        (date) => !isNaN(Date.parse(date)),
        "La fecha de fin debe ser válida"
      ),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate).getTime();
        const end = new Date(data.endDate).getTime();
        return start <= end;
      }
      return true;
    },
    {
      message: "La fecha de fin debe ser posterior a la fecha de inicio",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.scope === "specific_groups") {
        return data.targetGroup && data.targetGroup.length > 0;
      }
      return true;
    },
    {
      message: "Debes seleccionar al menos un grupo",
      path: ["targetGroup"],
    }
  )
  .refine(
    (data) => {
      if (data.scope === "specific_grades") {
        return data.targetGrade && data.targetGrade.length > 0;
      }
      return true;
    },
    {
      message: "Debes seleccionar al menos un grado",
      path: ["targetGrade"],
    }
  )
  .refine(
    (data) => {
      if (data.scope === "specific_students") {
        return data.targetStudent && data.targetStudent.length > 0;
      }
      return true;
    },
    {
      message: "Debes seleccionar al menos un estudiante",
      path: ["targetStudent"],
    }
  );

export type BillingConfigDto = z.infer<typeof billingConfigSchema>;