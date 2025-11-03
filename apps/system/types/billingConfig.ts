import { Id } from "@repo/convex/convex/_generated/dataModel"
import { PAYMENT_TYPES, RECURRENCE_TYPES, SCOPE_TYPES, STATUS_TYPES } from "lib/billing/constants";
import { Billing } from "./billing";
import { Student } from "./student";


export interface PaymentData {
  studentId: string;
  studentName: string;
  enrollment: string;
  groupId: string;
  group: string;
  paymentId: string;
}

export interface PaymentConfig {
  id: Id<"billingConfig">
  type: keyof typeof PAYMENT_TYPES;
  scope: keyof typeof SCOPE_TYPES;
  recurrence_type: keyof typeof RECURRENCE_TYPES;
  status: keyof typeof STATUS_TYPES;
  ruleIds: Id<"billingRule">[]
  endDate: number
  startDate: number
  amount: number;
  ciclo: string;
  cicloStatus: string;
}

export interface CompletedBillings {
  student: Student
  billing: Billing
}

export interface ResultData {
  affectedStudents: PaymentData[];
  message: string;
  paymentConfig: PaymentConfig;
  completedBillings?: CompletedBillings[]
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