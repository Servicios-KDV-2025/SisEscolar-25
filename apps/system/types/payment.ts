import { Id } from "@repo/convex/convex/_generated/dataModel"

export interface Payment {
  _id: Id<"payments">
  billingId: Id<"billing">
  studentId: Id<"student">
  method: "cash" | "bank_transfer" | "card" | "other"
  amount: number
  facturapiInvoiceId?: string
  facturapiInvoiceNumber?: string
  facturapiInvoiceStatus?: string
  createdBy: Id<"user">
  createdAt: number
  updatedAt: number
  stripePaymentIntentId?: string
  stripeTransferId?: string
  stripeChargeId?: string
}

export interface PaymentHistoryItem {
  id: Id<"payments">;
  paymentId: Id<"payments">;
  tutorId: Id<"user"> | undefined;
  studentId: Id<"student">;
  studentName: string;
  studentEnrollment: string;
  studentGrade: string;
  studentGroup: string;
  billingId: Id<"billing">;
  billingConfigId: Id<"billingConfig">;
  paymentType: string;
  billingStatus: string | undefined;
  amount: number;
  method: string;
  methodLabel: string;
  billingAmount: number;
  billingDeposit: number;
  billingRemaining: number;
  paidAt: number;
  createdBy: string;
  createdAt: number;
  facturapiInvoiceId: string | null;
  facturapiInvoiceNumber: string | null;
  facturapiInvoiceStatus: string | null;
}