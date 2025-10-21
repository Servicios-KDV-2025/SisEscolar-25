"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@repo/ui/components/shadcn/card"
import { AlertCircle, ShieldAlert, ShieldCheck, X, Loader2, TriangleAlert, CircleAlert as ClockAlert, Minus, Banknote, Search, CreditCard, DollarSign, CheckCircle, AlertTriangle, Clock, Filter, Backpack, School } from "@repo/ui/icons"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@repo/ui/components/shadcn/select"
import { Button } from "@repo/ui/components/shadcn/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@repo/ui/components/shadcn/dialog"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { Label } from "@repo/ui/components/shadcn/label"
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/shadcn/radio-group"
import { useUserWithConvex } from "stores/userStore"
import { useCurrentSchool } from "stores/userSchoolsStore"
import { BillingAccordion } from "./BillingAccordion"
import { BillingRecord, Estudiante, Group } from "@/types/billing"

interface PagosProps {
    selectedSchoolCycle: string
    setSelectedSchoolCycle: (cycle: string) => void
}

export default function BillingPage({ selectedSchoolCycle, setSelectedSchoolCycle }: PagosProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [gradeFilter, setGradeFilter] = useState<string | null>(null)
    const [groupFilter, setGroupFilter] = useState<string | null>(null)
    const [selectedBillings, setSelectedBillings] = useState<string[]>([])
    const [showBillingModal, setShowBillingModal] = useState(false)
    const [selectedBillingInModal, setSelectedBillingInModal] = useState<string | null>(null)
    const [showBillingFormModal, setShowBillingFormModal] = useState(false)
    const [paymentMethod, setBillingMethod] = useState<"cash" | "bank_transfer" | "card" | "other">("cash")
    const [paymentAmount, setBillingAmount] = useState<string>("")
    const [isProcessingBilling, setIsProcessingBilling] = useState(false)

    const { user: clerkUser } = useUser()
    const { currentUser } = useUserWithConvex(clerkUser?.id)
    const { currentSchool } = useCurrentSchool(currentUser?._id)

    const schoolCycles = useQuery(
        api.functions.schoolCycles.getAllSchoolCycles,
        currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
    )

    const paymentsData = useQuery(
        api.functions.billing.getPaymentsPageData,
        currentSchool?.school._id && selectedSchoolCycle ? {
            schoolId: currentSchool.school._id,
            schoolCycleId: selectedSchoolCycle as Id<"schoolCycle">
        } : "skip"
    )

    const uniqueGrades = useQuery(
        api.functions.group.getUniqueGrades,
        currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
    )

    const groupeByGrade = useQuery(
        api.functions.group.getAllGroupsBySchool,
        currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
    )

    const processBilling = useMutation(api.functions.billing.processPayment)

    useEffect(() => {
        if (schoolCycles && schoolCycles.length > 0 && !selectedSchoolCycle) {
            const activeCycle = schoolCycles.find(cycle => cycle.isActive)
            if (activeCycle) {
                setSelectedSchoolCycle(activeCycle.id)
            } else if (schoolCycles[0]) {
                setSelectedSchoolCycle(schoolCycles[0].id)
            }
        }
    }, [schoolCycles, selectedSchoolCycle, setSelectedSchoolCycle])

    useEffect(() => {
        if (gradeFilter) {
            setGroupFilter(null)
        }
    }, [gradeFilter])

    const estudiantes: Estudiante[] = useMemo(() => (paymentsData?.students || []).map(student => ({
        ...student,
        fechaVencimiento: student.fechaVencimiento || new Date().toISOString().split('T')[0],

        pagos: student.pagos.map(pago => ({
            ...pago,
            fechaVencimiento: pago.fechaVencimiento || new Date().toISOString().split('T')[0],
        }))
    })) as Estudiante[], [paymentsData?.students])

    const filteredEstudiantesByCycle = useMemo(() =>
        estudiantes.filter((estudiante) => estudiante.schoolCycleId === selectedSchoolCycle),
        [estudiantes, selectedSchoolCycle]
    )

    const statsData = useMemo(() => {
        const totalColegiaturas = filteredEstudiantesByCycle.length
        const colegiaturasAlDia = filteredEstudiantesByCycle.filter((e) => e.estado === "al-dia").length
        const colegiaturasRetrasadas = filteredEstudiantesByCycle.filter((e) => e.estado === "retrasado").length
        const colegiaturasMorosas = filteredEstudiantesByCycle.filter((e) => e.estado === "moroso").length
        return { totalColegiaturas, colegiaturasAlDia, colegiaturasRetrasadas, colegiaturasMorosas }
    }, [filteredEstudiantesByCycle])

    const filteredEstudiantes = useMemo(() =>
        filteredEstudiantesByCycle.filter((estudiante) => {
            const matchesSearch =
                estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                estudiante.matricula.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesGrade = !gradeFilter || estudiante.grado === gradeFilter
            const matchesGroup = !groupFilter || estudiante.grupo === groupFilter
            return matchesSearch && matchesGrade && matchesGroup
        }),
        [filteredEstudiantesByCycle, searchTerm, gradeFilter, groupFilter]
    )

    const paymentRecords = useMemo((): BillingRecord[] => {
        const records: BillingRecord[] = []
        filteredEstudiantesByCycle.forEach((estudiante) => {
            estudiante.pagos.forEach((pago) => {
                records.push({
                    id: pago.id,
                    studentId: estudiante.id,
                    studentName: estudiante.nombre,
                    studentGrade: estudiante.grado,
                    studentGroup: estudiante.grupo,
                    studentMatricula: estudiante.matricula,
                    paymentType: pago.tipo,
                    amount: pago.totalAmount,
                    dueDate: (pago.fechaVencimiento || new Date().toISOString().split('T')[0]) as string,
                    status: pago.estado,
                    daysLate: pago.diasRetraso,
                })
            })
        })
        return records
    }, [filteredEstudiantesByCycle])

    const unpaidBillingRecords = useMemo(() =>
        paymentRecords.filter((record) => record.status !== "Pagado"),
        [paymentRecords]
    )

    const handleBillingSelection = (paymentId: string, checked: boolean) => {
        const paymentRecord = paymentRecords.find((p) => p.id === paymentId)

        if (paymentRecord?.status === "Pagado") {
            toast.error("Este pago ya ha sido realizado", {
                description: "No puedes seleccionar un pago que ya está pagado.",
            })
            return
        }

        if (checked) {
            setSelectedBillings((prev) => [...prev, paymentId])
        } else {
            setSelectedBillings((prev) => prev.filter((id) => id !== paymentId))
        }
    }

    const handleRealizarPagos = () => {
        console.log("Hola")
        toast.error("Este pago ya ha sido realizado", {
                description: "No puedes seleccionar un pago que ya está pagado.",
            })
        setShowBillingModal(true)
    }

    const selectedBillingsData = useMemo(() => {
        if (selectedBillings.length > 0) {
            return paymentRecords.filter((payment) => selectedBillings.includes(payment.id))
        } else if (selectedBillingInModal) {
            return paymentRecords.filter((payment) => payment.id === selectedBillingInModal)
        }
        return []
    }, [paymentRecords, selectedBillings, selectedBillingInModal])

    const handleBillingSelectionInModal = (paymentId: string) => {
        const paymentRecord = paymentRecords.find((p) => p.id === paymentId)

        if (paymentRecord?.status === "Pagado") {
            toast.error("Este pago ya ha sido realizado", {
                description: "No puedes seleccionar un pago que ya está pagado.",
            })
            return
        }

        setSelectedBillingInModal(paymentId)
    }

    const handleOpenBillingForm = () => {
        const paymentsToProcess = selectedBillingsData

        if (paymentsToProcess.length === 0) {
            toast.error("No hay pagos seleccionados", {
                description: "Por favor selecciona al menos un pago para continuar.",
            })
            return
        }

        const totalAmount = paymentsToProcess.reduce((sum, payment) => sum + payment.amount, 0)
        setBillingAmount(totalAmount.toString())
        setShowBillingModal(false)
        setShowBillingFormModal(true)
    }

    const closeBillingModal = () => {
        setShowBillingModal(false)
        setSelectedBillings([])
        setSelectedBillingInModal(null)
    }

    const closeBillingFormModal = () => {
        setShowBillingFormModal(false)
        setBillingMethod("cash")
        setBillingAmount("")
    }

    const handleConfirmBilling = async () => {
        if (!currentUser || !currentSchool) {
            toast.error("Error de autenticación", {
                description: "No se pudo verificar tu identidad.",
            })
            return
        }

        const paymentsToProcess = selectedBillingsData

        if (paymentsToProcess.length === 0) {
            toast.error("No hay pagos seleccionados")
            return
        }

        const amount = parseFloat(paymentAmount)
        if (isNaN(amount) || amount <= 0) {
            toast.error("Monto inválido", {
                description: "Por favor ingresa un monto válido mayor a 0.",
            })
            return
        }

        setIsProcessingBilling(true)

        try {
            const results = []

            for (const paymentRecord of paymentsToProcess) {
                const estudiante = filteredEstudiantesByCycle.find((e) => e.id === paymentRecord.studentId)
                if (!estudiante) continue
                const amountForThisBilling = paymentsToProcess.length === 1
                    ? amount
                    : Math.min(amount / paymentsToProcess.length, paymentRecord.amount)

                const result = await processBilling({
                    billingId: paymentRecord.id as Id<"billing">,
                    tutorId: estudiante.tutorId as Id<"user">,
                    studentId: paymentRecord.studentId as Id<"student">,
                    method: paymentMethod,
                    amount: amountForThisBilling,
                    createdBy: currentUser._id,
                })

                results.push(result)
            }

            toast.success("Pago procesado exitosamente", {
                description: `Se procesaron ${results.length} pago(s) correctamente.`,
            })

            closeBillingFormModal()
            closeBillingModal()

        } catch (error: unknown) {
            toast.error("Error al procesar el pago", {
                description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
            })
        } finally {
            setIsProcessingBilling(false)
        }
    }

    const stats = useMemo(() => [
        {
            title: "Total de Cobros",
            value: statsData.totalColegiaturas,
            icon: Backpack,
            trend: "Estudiantes activos",
            variant: "default" as const
        },
        {
            title: "Cobros del Día",
            value: statsData.colegiaturasAlDia,
            icon: CheckCircle,
            trend: "Sin retrasos",
            variant: "secondary" as const
        },
        {
            title: "Cobros Pendientes",
            value: statsData.colegiaturasRetrasadas,
            icon: ClockAlert,
            trend: "Requieren atención",
            variant: "destructive" as const
        },
        {
            title: "Cobros Morosos",
            value: statsData.colegiaturasMorosas,
            icon: TriangleAlert,
            trend: "Atención inmediata",
            variant: "default" as const
        }
    ], [statsData])

    const getEstadoConfig = (estado: string) => {
        const configs = {
            "al-dia": {
                borderColor: "border-emerald-200",
                hoverBorderColor: "hover:border-emerald-400",
                accentColor: "bg-emerald-500",
                hoverAccentColor: "group-hover:bg-emerald-600",
                badgeBg: "bg-emerald-50",
                badgeText: "text-emerald-700",
                badgeBorder: "border-emerald-200",
                icon: CheckCircle,
                label: "Al día"
            },
            "moroso": {
                borderColor: "border-gray-200",
                hoverBorderColor: "hover:border-gray-400",
                accentColor: "bg-gray-500",
                hoverAccentColor: "group-hover:bg-gray-600",
                badgeBg: "bg-gray-50",
                badgeText: "text-gray-700",
                badgeBorder: "border-gray-200",
                icon: AlertTriangle,
                label: "Moroso"
            },
            "retrasado": {
                borderColor: "border-rose-200",
                hoverBorderColor: "hover:border-rose-400",
                accentColor: "bg-rose-500",
                hoverAccentColor: "group-hover:bg-rose-600",
                badgeBg: "bg-rose-50",
                badgeText: "text-rose-700",
                badgeBorder: "border-rose-200",
                icon: Clock,
                label: "Retrasado"
            }
        };
        return configs[estado as keyof typeof configs] || configs["al-dia"];
    };

    const getEstadoBillingConfig = (estado: string) => {
        const configs = {
            "required": {
                borderColor: "border-white-200",
                hoverBorderColor: "hover:border-white-400",
                accentColor: "bg-black-500",
                hoverAccentColor: "group-hover:bg-white-600",
                badgeBg: "bg-black",
                badgeText: "text-white",
                badgeBorder: "border-black-200",
                icon: ShieldAlert,
                label: "Obligatorio"
            },
            "optional": {
                borderColor: "border-gray-200",
                hoverBorderColor: "hover:border-gray-400",
                accentColor: "bg-gray-500",
                hoverAccentColor: "group-hover:bg-gray-600",
                badgeBg: "bg-gray-50",
                badgeText: "text-gray-700",
                badgeBorder: "border-gray-200",
                icon: ShieldCheck,
                label: "Opcional"
            },
            "inactive": {
                borderColor: "border-rose-200",
                hoverBorderColor: "hover:border-rose-400",
                accentColor: "bg-rose-500",
                hoverAccentColor: "group-hover:bg-rose-600",
                badgeBg: "bg-rose-50",
                badgeText: "text-rose-700",
                badgeBorder: "border-rose-200",
                icon: X,
                label: "Inactivo"
            }
        };
        return configs[estado as keyof typeof configs] || configs["required"];
    };

    const getBillingStatusConfig = (estado: string) => {
        const configs = {
            "Pagado": {
                icon: CheckCircle,
                bg: "bg-emerald-50",
                text: "text-emerald-700",
                border: "border-emerald-200"
            },
            "Pendiente": {
                icon: Clock,
                bg: "bg-blue-50",
                text: "text-blue-700",
                border: "border-blue-200"
            },
            "Parcial": {
                icon: Minus,
                bg: "bg-sky-50",
                text: "text-sky-700",
                border: "border-sky-200"
            },
            "Vencido": {
                icon: AlertCircle,
                bg: "bg-rose-50",
                text: "text-rose-700",
                border: "border-rose-200"
            },
            "Retrasado": {
                icon: Clock,
                bg: "bg-rose-50",
                text: "text-rose-700",
                border: "border-rose-200"
            }
        };
        return configs[estado as keyof typeof configs];
    };

    return (
        <div className="space-y-6 pb-48 lg:pb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {stats.map((stat, index) => (
                    <Card
                        key={index}
                        className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
                            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <stat.icon className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1 lg:space-y-2">
                            <div className="text-xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.trend}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros y Búsqueda
                    </CardTitle>
                    <CardDescription>
                        Encuentra los cobros por nombre, matrícula, ciclo escolar, grado y grupo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex flex-col xl:flex-row space-y-4 gap-2">
                        <div className="flex-2 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o matrícula..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex flex-1 flex-col md:flex-row gap-3 justify-center">
                            <div className="flex flex-2 flex-row gap-3 justify-center">
                                <Select value={selectedSchoolCycle} onValueChange={setSelectedSchoolCycle}>
                                    <SelectTrigger className="w-full">
                                        <School className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Ciclo escolar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schoolCycles?.map((cycle) => (
                                            <SelectItem key={cycle.id} value={cycle.id}>
                                                {cycle.name} {cycle.isActive && "(Activo)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-1 flex-col sm:flex-row gap-3 justify-center">
                                <Select onValueChange={(v) => setGradeFilter(v === "all" ? null : v)} value={gradeFilter || ""}>
                                    <SelectTrigger className="w-full md:w-40">
                                        <SelectValue placeholder="Todos los grados" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los grados</SelectItem>
                                        {uniqueGrades?.map((grade) => (
                                            <SelectItem key={grade} value={grade}>
                                                {grade}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={(v) => setGroupFilter(v === "all" ? null : v)} value={groupFilter || ""}>
                                    <SelectTrigger className="w-full md:w-40">
                                        <SelectValue placeholder="Todos los grupos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los grupos</SelectItem>
                                        {gradeFilter && groupeByGrade?.filter((group: Group) => group.grade === gradeFilter).map((group: Group) => (
                                            <SelectItem key={group._id} value={group.name}>
                                                {group.grade}{group.name}
                                            </SelectItem>
                                        ))}
                                        {!gradeFilter && groupeByGrade?.map((group: Group) => (
                                            <SelectItem key={group._id} value={group.name}>
                                                {group.grade}{group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Lista de Cobros</span>
                        <div className="flex items-center gap-2">
                            {selectedBillings.length > 0 && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {selectedBillings.length} seleccionado{selectedBillings.length > 1 ? "s" : ""}
                                </Badge>
                            )}
                            <Badge variant="outline">{filteredEstudiantes.length} registros</Badge>
                        </div>
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600">
                        Selecciona los cobros que deseas procesar marcando las casillas correspondientes
                    </CardDescription>
                    {selectedBillings.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-200 bg-gray-50/50 -mx-6 px-6 py-4 mt-4 rounded-lg">
                            <div className="flex items-center gap-3 flex-wrap">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-gray-600 hover:bg-gray-50 bg-white"
                                    onClick={() => {
                                        const allVisibleUnpaidIds = unpaidBillingRecords
                                            .filter((record) => filteredEstudiantes.some((e) => e.id === record.studentId))
                                            .map((record) => record.id)
                                        setSelectedBillings(allVisibleUnpaidIds)
                                    }}
                                >
                                    Seleccionar todos los visibles
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent"
                                    onClick={() => setSelectedBillings([])}
                                >
                                    Deseleccionar todos
                                </Button>
                            </div>
                            <Button
                                onClick={handleRealizarPagos}
                                size="lg"
                                className="bg-black text-white hover:bg-gray-800 shadow-lg border-0 max-"
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Realizar Pago{selectedBillings.length > 1 ? "s" : ""}
                            </Button>
                        </div>
                    )}
                    {selectedBillings.length === 0 && (
                        <div className="flex justify-end pt-2 max-md:justify-center ">
                            <Button onClick={handleRealizarPagos} className="bg-black text-white hover:bg-gray-800 shadow-md max-md:w-full">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Realizar Pago
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {paymentsData === undefined ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Cargando datos de cobros...</span>
                            </div>
                        </div>
                    ) : filteredEstudiantes.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-sm text-muted-foreground">
                                No hay estudiantes con cobros en este ciclo escolar
                            </div>
                        </div>
                    ) : (
                        <BillingAccordion
                            filteredEstudiantes={filteredEstudiantes}
                            selectedBillings={selectedBillings}
                            handleBillingSelection={handleBillingSelection}
                            handleRealizarPagos={handleRealizarPagos}
                            getEstadoConfig={getEstadoConfig}
                            getEstadoBillingConfig={getEstadoBillingConfig}
                            getBillingStatusConfig={getBillingStatusConfig}
                            onClear={() => setSelectedBillings([])}

                        />

                    )}
                </CardContent>
            </Card>

            <Dialog open={showBillingModal} onOpenChange={setShowBillingModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-2 sm:mx-4">
                    <DialogHeader className="pb-3 sm:pb-4">
                        <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                            Realizar Pago{selectedBillings.length > 1 ? "s" : ""}
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            {selectedBillings.length > 0
                                ? `Información de cobro para ${selectedBillings.length} cobro${selectedBillings.length > 1 ? "s" : ""}`
                                : "Selecciona un cobro para procesar"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 sm:space-y-6">
                        {selectedBillings.length === 0 && !selectedBillingInModal && (
                            <Card className="border-2 border-dashed">
                                <CardHeader className="pb-3 sm:pb-4">
                                    <CardTitle className="text-base sm:text-lg">Seleccionar Cobro</CardTitle>
                                    <CardDescription className="text-sm">Elige un cobro pendiente del ciclo escolar activo para procesar</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Select onValueChange={handleBillingSelectionInModal}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar cobro..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {unpaidBillingRecords
                                                .filter((record) => filteredEstudiantesByCycle.some((e) => e.id === record.studentId))
                                                .map((paymentRecord) => (
                                                    <SelectItem key={paymentRecord.id} value={paymentRecord.id}>
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <span className="font-medium text-sm sm:text-base block truncate">{paymentRecord.studentName}</span>
                                                                <span className="text-xs sm:text-sm text-muted-foreground block">
                                                                    {paymentRecord.paymentType} - {paymentRecord.studentMatricula}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground block">
                                                                    Vence: {paymentRecord.dueDate}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm sm:text-base font-semibold text-right">${paymentRecord.amount.toLocaleString()}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                        )}

                        {selectedBillingsData.map((paymentRecord) => {
                            const estudiante = filteredEstudiantesByCycle.find((e) => e.id === paymentRecord.studentId)
                            if (!estudiante) return null

                            return (
                                <Card key={paymentRecord.id} className="border-2">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                            <span className="truncate">{paymentRecord.studentName}</span>
                                            <Badge
                                                className={`text-xs px-2 py-1 ${paymentRecord.status === "Pendiente"
                                                    ? "bg-transparent text-yellow-800"
                                                    : paymentRecord.status === "Vencido"
                                                        ? "bg-transparent text-red-500"
                                                        : "bg-transparent text-green-800"
                                                    }`}
                                            >
                                                {paymentRecord.status === "Pendiente" && <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                                                {paymentRecord.status === "Vencido" && <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                                                {paymentRecord.status === "Pagado" && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                                                {paymentRecord.status}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            {paymentRecord.studentGrade} - Grupo {paymentRecord.studentGroup} |{" "}
                                            {paymentRecord.studentMatricula}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3 sm:space-y-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground">INFORMACIÓN DEL ESTUDIANTE</h4>
                                                <div className="space-y-1 text-xs sm:text-sm">
                                                    <p className="break-words">
                                                        <span className="font-medium">Estudiante:</span> {paymentRecord.studentName}
                                                    </p>
                                                    <p className="break-words">
                                                        <span className="font-medium">Grado:</span> {paymentRecord.studentGrade} - Grupo{" "}
                                                        {paymentRecord.studentGroup}
                                                    </p>
                                                    <p className="break-words">
                                                        <span className="font-medium">Matrícula:</span> {paymentRecord.studentMatricula}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground">DETALLES DEL COBRO</h4>
                                                <div className="space-y-1 text-xs sm:text-sm">
                                                    <p className="break-words">
                                                        <span className="font-medium">Tipo de cobro:</span> {paymentRecord.paymentType}
                                                    </p>
                                                    <p className="break-words">
                                                        <span className="font-medium">Fecha de vencimiento:</span> {paymentRecord.dueDate}
                                                    </p>
                                                    <p className="break-words">
                                                        <span className="font-medium">Estado:</span> {paymentRecord.status}
                                                    </p>
                                                    {paymentRecord.daysLate > 0 && (
                                                        <p className="break-words">
                                                            <span className="font-medium">Días de retraso:</span> {paymentRecord.daysLate}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t pt-3 sm:pt-4">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                                                <span className="text-base sm:text-lg font-semibold">{paymentRecord.status === "Pagado" ? "Pagado:" : "Total a pagar:"}:</span>
                                                <span className="text-xl sm:text-2xl font-bold text-primary">
                                                    ${paymentRecord.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}

                        {selectedBillingsData.length > 0 && (
                            <div className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-slate-100 opacity-50" />
                                <Card className="relative border-2 border-slate-200 shadow-lg">
                                    <CardContent className="pt-4 sm:pt-8 pb-4 sm:pb-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="p-2 bg-slate-100 rounded-lg">
                                                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Costo Total</h3>
                                                        <p className="text-xs sm:text-sm text-slate-600">
                                                            {selectedBillingsData.length} cobro{selectedBillingsData.length > 1 ? "s" : ""}{" "}
                                                            seleccionado{selectedBillingsData.length > 1 ? "s" : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <div className="text-2xl sm:text-4xl font-bold text-slate-900 mb-1">
                                                    $
                                                    {selectedBillingsData
                                                        .reduce((total, payment) => total + payment.amount, 0)
                                                        .toLocaleString()}
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs">
                                                        MXN
                                                    </Badge>
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                                        Listo para procesar
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 flex-col sm:flex-row">
                        <Button variant="outline" onClick={closeBillingModal} className="w-full sm:w-auto order-2 sm:order-1">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleOpenBillingForm}
                            disabled={selectedBillings.length === 0 && !selectedBillingInModal}
                            className="w-full sm:w-auto order-1 sm:order-2"
                        >
                            Continuar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showBillingFormModal} onOpenChange={setShowBillingFormModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <DollarSign className="h-5 w-5" />
                            Procesar Pago
                        </DialogTitle>
                        <DialogDescription>
                            Completa la información del pago a procesar
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Resumen de Cobros</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {selectedBillingsData.map((payment) => (
                                        <div key={payment.id} className="flex justify-between items-center text-sm border-b pb-2">
                                            <div>
                                                <p className="font-medium">{payment.studentName}</p>
                                                <p className="text-xs text-muted-foreground">{payment.paymentType}</p>
                                            </div>
                                            <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 font-bold">
                                        <p>Total:</p>
                                        <p className="text-lg">
                                            ${selectedBillingsData
                                                .reduce((sum, payment) => sum + payment.amount, 0)
                                                .toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Método de Pago */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Método de Pago</Label>
                            <RadioGroup value={paymentMethod} onValueChange={(value) => setBillingMethod(value as "cash" | "bank_transfer" | "card" | "other")}>
                                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                                    <RadioGroupItem value="cash" id="cash" />
                                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                                        <Banknote className="h-4 w-4" />
                                        Efectivo
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                                    <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                                        <CreditCard className="h-4 w-4" />
                                        Transferencia Bancaria
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                                    <RadioGroupItem value="card" id="card" />
                                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                                        <CreditCard className="h-4 w-4" />
                                        Tarjeta
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                                    <RadioGroupItem value="other" id="other" />
                                    <Label htmlFor="other" className="flex items-center gap-2 cursor-pointer flex-1">
                                        <DollarSign className="h-4 w-4" />
                                        Otro
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="paymentAmount" className="text-base font-semibold">
                                Monto a Pagar
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={(e) => setBillingAmount(e.target.value)}
                                    className="pl-8 text-lg"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Puedes pagar el monto completo o realizar un abono parcial
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 flex-col sm:flex-row pt-4">
                        <Button
                            variant="outline"
                            onClick={closeBillingFormModal}
                            disabled={isProcessingBilling}
                            className="w-full sm:w-auto order-2 sm:order-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmBilling}
                            disabled={isProcessingBilling || !paymentAmount || parseFloat(paymentAmount) <= 0}
                            className="w-full sm:w-auto order-1 sm:order-2"
                        >
                            {isProcessingBilling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Confirmar Pago
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
