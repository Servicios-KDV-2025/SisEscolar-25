import { Id } from "@repo/convex/convex/_generated/dataModel"
import { GenericId } from "convex/values"
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

export interface BillingConfigType {
  _id: GenericId<"paymentConfig">
  schoolId: Id<"school">
  schoolCycleId: Id<"schoolCycle">
  scope: "all_students" | "specific_groups" | "specific_grades" | "specific_students";
  targetGroup?: string[];
  targetGrade?: string[];
  targetStudent?: string[];
  recurrence_type: "cuatrimestral" | "semestral" | "sabatino" | "mensual"
  paymentType: "colegiatura" | "inscripcion" | "material-escolar" | "seguro-vida" | "plan-alimenticio" | "otro"
  amount: number
  status: "obligatorio" | "opcional" | "inactivo"
  startDate: number
  endDate: number
  createdAt?: number
  updatedAt?: number
  createdBy?: Id<"user">
  //updatedBy?: Id<"user">
}