import { Id } from "@repo/convex/convex/_generated/dataModel"
import { Payment } from "./payment"

export interface Estudiante {
    id: string
    nombre: string
    grado: string
    grupo: string
    matricula: string
    padre: string
    tutorId: string
    telefono: string
    metodoPago: string
    fechaVencimiento: string
    montoColegiatura: number
    diasRetraso: number
    estado: "al-dia" | "retrasado" | "moroso"
    schoolCycleId: string
    tipo: "Inscripciones" | "Colegiatura"
    credit: number
    scholarshipType: "inactive" | "active"
    scholarshipPercentage: number
    pagos: Array<{
        id: string
        ruleIds: Id<"billingRule">[]
        tipo: string
        amount: number
        statusBilling: "required" | "optional" | "inactive"
        totalAmount: number
        totalDiscount: number
        lateFee: number
        paidAt?: number
        startDate: number
        endDate: number
        appliedDiscounts: AppliedDiscount[]
        fechaVencimiento: string
        estado: "Pendiente" | "Vencido" | "Pagado" | "Rechazado" | "Parcial"
        diasRetraso: number
        amountOutstanding: number
        payments: Payment[]
    }>
}

export interface AppliedDiscount {
    type: "scholarship" | "discount"
    percentage?: number
    amount: number
}

export interface EstadoConfig {
    borderColor: string
    hoverBorderColor: string
    accentColor: string
    hoverAccentColor: string
    badgeBg: string
    badgeText: string
    badgeBorder: string
    icon: any
    label: string
}

export interface EstadoBillingConfig {
    borderColor: string
    hoverBorderColor: string
    accentColor: string
    hoverAccentColor: string
    badgeBg: string
    badgeText: string
    badgeBorder: string
    icon: any
    label: string
}

export interface BillingStatusConfig {
    icon: any
    bg: string
    text: string
    border: string
}

export interface BillingRecord {
    id: string
    studentId: string
    studentName: string
    studentGrade: string
    studentGroup: string
    studentMatricula: string
    paymentType: string
    amount: number
    dueDate: string
    status: "Pendiente" | "Vencido" | "Pagado" | "Rechazado" | "Parcial"
    daysLate: number
}

 export interface Group {
    _id: Id<"group">
    name: string
    grade: string
    status: "active" | "inactive"
    schoolId: Id<"school">
    _creationTime: number
    updatedAt?: number
    updatedBy?: Id<"user">
}
export interface Billing {
  _id: Id<"billing">
  studentId: Id<"student">
  billingConfigId: Id<"billingConfig">
  status: "Pago pendiente" | "Pago cumplido" | "Pago vencido" | "Pago parcial" | "Pago retrasado"
  amount: number
  lateFee?: number
  totalAmount?: number
  paidAt?: number
  appliedDiscounts?: Array<{
    ruleId?: Id<"billingRule">
    reason: string
    amount: number
    percentage?: number
    type: "scholarship" | "rule"
  }>
  totalDiscount?: number
  lateFeeRuleId?: Id<"billingRule">
  createdAt: number
  updatedAt: number
}