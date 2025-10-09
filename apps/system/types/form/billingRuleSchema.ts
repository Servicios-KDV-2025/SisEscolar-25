import { z } from "@repo/zod-config/index";

export const billingRuleSchema = z.object({
  name: z.string().min(1, "El nombre de la regla es obligatorio.").max(50, "Máximo 50 caracteres"),
  description: z.string().max(150, 'Máximo 150 caracteres.').optional(),
  type: z.enum(["late_fee", "early_discount", "cutoff"]),
  scope: z.enum(["estandar", "becarios", "all_students"]),
  status: z.enum(["active", "inactive"]).default("active"),
  lateFeeType: z.enum(["percentage", "fixed"]).optional(),
  lateFeeValue: z.union([
    z.number().min(0, "El valor debe ser positivo"),
    z.undefined()
  ]).optional().nullable(),
  startDay: z.union([
    z.number().min(0, "El día de inicio debe ser positivo"),
    z.undefined()
  ]).optional().nullable(),
  endDay: z.union([
    z.number().min(0, "El día de fin debe ser positivo"),
    z.undefined()
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
    z.undefined()
  ]).optional().nullable(),
});

export type BillingRuleFormValues = z.input<typeof billingRuleSchema>;