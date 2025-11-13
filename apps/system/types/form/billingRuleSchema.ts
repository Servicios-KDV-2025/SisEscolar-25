import { z } from "@repo/zod-config/index";

export const billingRuleSchema = z.object({
  name: z.string().min(1, "El nombre de la política es obligatorio.").max(80, "Máximo 80 caracteres"),
  description: z.string().max(400, 'Máximo 400 caracteres.').optional(),
  type: z.enum(["late_fee", "early_discount", "cutoff"]),
  scope: z.enum(["estandar", "becarios", "all_students"]),
  status: z.enum(["active", "inactive"]).default("active"),
  lateFeeType: z.enum(["percentage", "fixed"]).optional().nullable(),
  lateFeeValue: z.union([
    z.number().min(1, "El monto no debe ser menor a 1"),
  ]).optional().nullable(),
  startDay: z.union([
    z.number().min(1, "El día de inicio no debe ser menor a 1"),
  ]).optional().nullable(),
  endDay: z.union([
    z.number().min(1, "El día de finalización no debe ser menor a 1"),
  ]).optional().nullable(),
  maxUses: z.union([
    z.number().min(0, "El máximo de usos debe ser positivo"),
    z.undefined()
  ]).optional().nullable(),
  usedCount: z.union([
    z.number().min(0, "El contador de usos debe ser positivo"),
    z.undefined()
  ]).optional().nullable(),
  cutoffAfterDays: z.union([
    z.number().min(1, "El día para corte no debe ser menor a 1"),
  ]).optional().nullable(),
}).refine(
  (data) => {
    if (data.type === "cutoff") {
      return data.cutoffAfterDays && (data.cutoffAfterDays != undefined || data.cutoffAfterDays != null);
    }
    return true;
  },
  {
    message: "El día para corte es obligatorio",
    path: ["cutoffAfterDays"],
  }
).refine(
  (data) => {
    if ((data.type === "late_fee" || data.type === "early_discount")) {
      return data.startDay && (data.startDay != undefined || data.startDay != null);
    }
    return true;
  },
  {
    message: "El día de inicio es obligatorio",
    path: ["startDay"],
  }
).refine(
  (data) => {
    if (data.type === "late_fee" || data.type === "early_discount") {
      return data.endDay && (data.endDay != undefined || data.endDay != null);
    }
    return true;
  },
  {
    message: "El día de finalización es obligatorio",
    path: ["endDay"],
  }
).refine(
  (data) => {
    if (data.type === "late_fee" || data.type === "early_discount") {
      return data.lateFeeType;
    }
    return true;
  },
  {
    message: "El tipo es obligatorio",
    path: ["lateFeeType"],
  }
).refine(
  (data) => {
    if (data.type === "late_fee" || data.type === "early_discount") {
      return data.lateFeeValue;
    }
    return true;
  },
  {
    message: "El campo es obligatorio",
    path: ["lateFeeValue"],
  }
).refine(
  (data) => {
    if (data.lateFeeType === "percentage") {
      return data.lateFeeValue && data.lateFeeValue <= 100;
    }
    return true;
  },
  {
    message: "El porcentaje debe ser menor a 100",
    path: ["lateFeeValue"],
  }
);


export type BillingRuleFormValues = z.input<typeof billingRuleSchema>;