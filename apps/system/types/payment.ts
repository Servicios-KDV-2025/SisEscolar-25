import { Id } from "@repo/convex/convex/_generated/dataModel"

export interface Payment {
  _id: Id<"payments">
  billingId: Id<"billing">
  studentId: Id<"student">
  method: "cash" | "bank_transfer" | "card" | "other"
  amount: number
  invoiceId?: string
  invoiceFilename?: string
  invoiceMimeType?: string
  createdBy: Id<"user">
  createdAt: number
  updatedAt: number
  stripePaymentIntentId?: string
  stripeTransferId?: string
  stripeChargeId?: string
}