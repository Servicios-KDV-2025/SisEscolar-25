import { Id } from "@repo/convex/convex/_generated/dataModel"

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
    pagos: Array<{
        id: string
        tipo: string
        amount: number
        statusBilling: "required" | "optional" | "inactive"
        totalAmount: number
        totalDiscount: number
        lateFee: number
        paidAt?: number
        startDate: string
        endDate: string
        appliedDiscounts: AppliedDiscount[]
        fechaVencimiento: string
        estado: "Pendiente" | "Vencido" | "Pagado" | "Rechazado" | "Parcial"
        diasRetraso: number
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