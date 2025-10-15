import { Id } from "@repo/convex/convex/_generated/dataModel"
import { PAYMENT_TYPES, RECURRENCE_TYPES, SCOPE_TYPES, STATUS_TYPES } from "lib/billing/constants";


export interface PaymentData {
  balanceUpdated: boolean;
  enrollment: string;
  group: string;
  balance: number;
  paymentId: string;
  studentId: string;
  studentName: string;
}

export interface PaymentConfig {
  amount: number;
  id: string;
  recurrence_type: keyof typeof RECURRENCE_TYPES;
  scope: keyof typeof SCOPE_TYPES;
  status: keyof typeof STATUS_TYPES;
  type: keyof typeof PAYMENT_TYPES;
  ciclo: string;
  cicloStatus: string;
}

export interface ResultData {
  createdPayments: PaymentData[];
  message: string;
  paymentConfig: PaymentConfig;
}

export interface BillingConfigType extends Record<string, unknown> {
  _id: Id<"billingConfig">;
  _creationTime: number;
  schoolId: Id<"school">;
  schoolCycleId: Id<"schoolCycle">;
  scope: "all_students" | "specific_groups" | "specific_grades" | "specific_students";
  targetGroup?: Id<"group">[];
  targetGrade?: string[];
  targetStudent?: Id<"student">[];
  recurrence_type: "cuatrimestral" | "semestral" | "sabatino" | "mensual" | "diario" | "semanal" | "anual" | "unico";
  type: "inscripción" | "colegiatura" | "examen" | "material-escolar" | "seguro-vida" | "plan-alimenticio" | "otro";
  amount: number;
  ruleIds?: Id<"billingRule">[];
  startDate: number;
  endDate: number;
  status: "required" | "optional" | "inactive";
  createdBy: Id<"user">;
  updatedBy: Id<"user">;
  createdAt: number;
  updatedAt: number;
}