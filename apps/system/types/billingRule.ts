import { Id } from "@repo/convex/convex/_generated/dataModel";

export interface BillingRule extends Record<string, unknown> {
  _id: Id<"billingRule">;
  _creationTime: number;
  schoolId: Id<"school">;
  name: string;
  description?: string;
  type: "late_fee" | "early_discount" | "cutoff";
  scope: "estandar" | "becarios" | "all_students";
  status: "active" | "inactive";
  lateFeeType?: "percentage" | "fixed";
  lateFeeValue?: number;
  startDay?: number;
  endDay?: number;
  maxUses?: number;
  usedCount?: number;
  cutoffAfterDays?: number;
  createdBy: Id<"user">;
  updatedBy: Id<"user">;
  createdAt: number;
  updatedAt?: number;
}

export interface CreateBillingRuleData {
  schoolId: Id<"school">;
  name: string;
  description?: string;
  type: "late_fee" | "early_discount" | "cutoff";
  scope: "estandar" | "becarios" | "all_students";
  status: "active" | "inactive";
  lateFeeType?: "percentage" | "fixed";
  lateFeeValue?: number;
  startDay?: number;
  endDay?: number;
  maxUses?: number;
  usedCount?: number;
  cutoffAfterDays?: number;
  createdBy: Id<"user">;
  updatedBy: Id<"user">;
}

export interface UpdateBillingRuleData {
  _id: Id<"billingRule">;
  schoolId?: Id<"school">;
  name?: string;
  description?: string;
  type?: "late_fee" | "early_discount" | "cutoff";
  scope?: "estandar" | "becarios" | "all_students";
  status?: "active" | "inactive";
  lateFeeType?: "percentage" | "fixed";
  lateFeeValue?: number;
  startDay?: number;
  endDay?: number;
  maxUses?: number;
  usedCount?: number;
  cutoffAfterDays?: number;
  updatedBy?: Id<"user">;
  updatedAt?: number;
}

export type BillingRuleType = "late_fee" | "early_discount" | "cutoff";
export type BillingRuleScope = "estandar" | "becarios" | "all_students";
export type BillingRuleStatus = "active" | "inactive";
export type LateFeeType = "percentage" | "fixed";

export const BILLING_RULE_TYPES = {
  late_fee: "Recargo por mora",
  early_discount: "Descuento anticipado",
  cutoff: "Corte"
} as const;

export const BILLING_RULE_SCOPES = {
  estandar: "Estándar",
  becarios: "Becarios",
  all_students: "Todos los estudiantes"
} as const;

export const BILLING_RULE_STATUSES = {
  active: "Activo",
  inactive: "Inactivo"
} as const;

export const LATE_FEE_TYPES = {
  percentage: "Porcentaje",
  fixed: "Fijo"
} as const;

export const SCHOOLAR_TYPES = {
  inactive: "Estandar",
  active: "Becado"
} as const;