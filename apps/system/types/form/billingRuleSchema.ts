import { z } from "@repo/zod-config/index";

export const billingRuleSchema = z.object({
  name: z.string().min(1, "El nombre de la regla es obligatorio.").max(50, "Máximo 50 caracteres"),
  description: z.string().max(400, 'Máximo 400 caracteres.').optional(),
  type: z.enum(["late_fee", "early_discount", "cutoff"]),
  scope: z.enum(["estandar", "becarios", "all_students"]),
  status: z.enum(["active", "inactive"]).default("active"),
  lateFeeType: z.enum(["percentage", "fixed"]).optional().nullable(),
  lateFeeValue: z.union([
    z.number().min(0, "El valor debe ser positivo"),
  ]).optional().nullable(),
  startDay: z.union([
    z.number(),
  ]).optional().nullable(),
  endDay: z.union([
    z.number().min(0, "El día de fin debe ser positivo"),
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
    z.number().min(0, "Los días de corte deben ser positivos"),
  ]).optional().nullable(),
}).refine(
    (data) => {
      if (data.type === "cutoff") {
        return data.cutoffAfterDays;
      }
      return true;
    },
    {
      message: "Días para corte es obligatorio",
      path: ["cutoffAfterDays"],
    }
  ).refine(
    (data) => {
      if (data.type === "late_fee" || data.type === "early_discount") {
        return data.lateFeeType;
      }
      return true;
    },
    {
      message: "Tipo de recargo o descuento es obligatorio",
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
      message: "Días para corte es obligatorio",
      path: ["lateFeeValue"],
    }
  ).refine(
    (data) => {
      if ((data.type === "late_fee" || data.type === "early_discount" ) && data.startDay) {
        return data.startDay >= 0;
      }
      return true;
    },
    {
      message: "Día de inicio es obligatorio",
      path: ["startDay"],
    }
  ).refine(
    (data) => {
      if (data.type === "late_fee" || data.type === "early_discount") {
        return data.endDay;
      }
      return true;
    },
    {
      message: "Día de fin es obligatorio",
      path: ["endDay"],
    }
  );
  

export type BillingRuleFormValues = z.input<typeof billingRuleSchema>;