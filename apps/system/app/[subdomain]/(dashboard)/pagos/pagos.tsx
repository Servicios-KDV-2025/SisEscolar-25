"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@repo/ui/components/shadcn/card"
import {
  Backpack,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Search,
  CreditCard,
  Banknote,
  CircleAlert as ClockAlert,
  TriangleAlert,
  Loader2,
} from "@repo/ui/icons"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@repo/ui/components/shadcn/select"
import { Button } from "@repo/ui/components/shadcn/button"
import { Checkbox } from "@repo/ui/components/shadcn/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@repo/ui/components/shadcn/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog"
import { toast } from "sonner"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { useUserWithConvex } from "../../../../stores/userStore"
import { useCurrentSchool } from "../../../../stores/userSchoolsStore"
import { Label } from "@repo/ui/components/shadcn/label"
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/shadcn/radio-group"
import { AlertCircle, Award, Calendar, ChevronDown, Equal, GraduationCap, Minus, Plus, Receipt, ShieldAlert, ShieldCheck, X } from "@repo/ui/icons"


interface Estudiante {
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
    paidAt?: number,
    appliedDiscounts: any[]
    fechaVencimiento: string
    estado: "Pendiente" | "Vencido" | "Pagado" | "Rechazado" | "Parcial"
    diasRetraso: number
  }>
}

interface BillingRecord {
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

interface Group {
  _id: Id<"group">
  name: string
  grade: string
  status: "active" | "inactive"
  schoolId: Id<"school">
  _creationTime: number
  updatedAt?: number
  updatedBy?: Id<"user">
}

interface PagosProps {
  selectedSchoolCycle: string
  setSelectedSchoolCycle: (cycle: string) => void
}

interface Discount {
  type: 'scholarship' | 'discount';
  percentage?: number;
  amount: number;
}

export default function BillingPage({ selectedSchoolCycle, setSelectedSchoolCycle }: PagosProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter] = useState<string | null>(null)
  const [tipoFilter] = useState<string | null>(null)
  const [gradeFilter, setGradeFilter] = useState<string | null>(null)
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [selectedBillings, setSelectedBillings] = useState<string[]>([])
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [selectedBillingInModal, setSelectedBillingInModal] = useState<string | null>(null)
  const [showBillingFormModal, setShowBillingFormModal] = useState(false)
  const [paymentMethod, setBillingMethod] = useState<"cash" | "bank_transfer" | "card" | "other">("cash")
  const [paymentAmount, setBillingAmount] = useState<string>("")
  const [isProcessingBilling, setIsProcessingBilling] = useState(false)

  // Hooks para obtener datos del usuario y escuela
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const { currentSchool } = useCurrentSchool(currentUser?._id)

  // Obtener ciclos escolares
  const schoolCycles = useQuery(
    api.functions.schoolCycles.getAllSchoolCycles,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  )

  // Obtener datos de pagos
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

  // Mutation para procesar el pago
  const processBilling = useMutation(api.functions.billing.processPayment)

  // Establecer el ciclo activo por defecto cuando se cargan los datos
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

  const estudiantes: Estudiante[] = (paymentsData?.students || []).map(student => ({
    ...student,
    fechaVencimiento: student.fechaVencimiento || new Date().toISOString().split('T')[0],
    pagos: student.pagos.map(pago => ({
      ...pago,
      fechaVencimiento: pago.fechaVencimiento || new Date().toISOString().split('T')[0],
    }))
  })).map(student => ({
    ...student,
    pagos: student.pagos.map(pago => ({
      ...pago,
      fechaVencimiento: pago.fechaVencimiento || new Date().toISOString().split('T')[0],
    }))
  })) as Estudiante[]

  const filteredEstudiantesByCycle = estudiantes.filter(
    (estudiante) => estudiante.schoolCycleId === selectedSchoolCycle
  );

  const totalColegiaturas = filteredEstudiantesByCycle.length
  const colegiaturasAlDia = filteredEstudiantesByCycle.filter((e) => e.estado === "al-dia").length
  const colegiaturasRetrasadas = filteredEstudiantesByCycle.filter((e) => e.estado === "retrasado").length
  const colegiaturasMorosas = filteredEstudiantesByCycle.filter((e) => e.estado === "moroso").length

  const filteredEstudiantes = filteredEstudiantesByCycle.filter((estudiante) => {
    const matchesSearch =
      estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.matricula.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && estudiante.estado === "al-dia") ||
      (statusFilter === "pending" && estudiante.estado === "retrasado") ||
      (statusFilter === "overdue" && estudiante.estado === "moroso")
    const matchesTipo = !tipoFilter || estudiante.tipo === tipoFilter
    const matchesGrade = !gradeFilter || estudiante.grado === gradeFilter
    const matchesGroup = !groupFilter || estudiante.grupo === groupFilter
    return matchesSearch && matchesStatus && matchesTipo && matchesGrade && matchesGroup
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "al-dia":
        return (
          <Badge className="bg-transparent text-green-800 ">
            <CheckCircle className="w-4 h-4 mr-1 text-green-800 " />
            Al día
          </Badge>
        )
      case "retrasado":
        return (
          <Badge className="bg-transparent text-yellow-800 ">
            <Clock className="w-4 h-4 mr-1 text-yellow-800" />
            Retrasado
          </Badge>
        )
      case "moroso":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Moroso
          </Badge>
        )
      default:
        return null
    }
  }

  const getBillingStatusBadge = (estado: string) => {
    switch (estado) {
      case "Pagado":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors">
            <CheckCircle className="w-3 h-3 mr-1" />
            {estado}
          </Badge>
        )
      case "Pendiente":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">
            <Clock className="w-3 h-3 mr-1" />
            {estado}
          </Badge>
        )
      case "Parcial":
        return (
          <Badge className="bg-blue-50 text-blue-400 border-blue-200 hover:bg-blue-100 transition-colors">
            <Clock className="w-3 h-3 mr-1" />
            {estado}
          </Badge>
        )
      case "Retrasado":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {estado}
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors">
            {estado}
          </Badge>
        )
    }
  }

  const createBillingRecords = (): BillingRecord[] => {
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
  }

  const paymentRecords = createBillingRecords()
  const unpaidBillingRecords = paymentRecords.filter((record) => record.status !== "Pagado")

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
    setShowBillingModal(true)
  }

  const getSelectedBillingsData = () => {
    if (selectedBillings.length > 0) {
      return paymentRecords.filter((payment) => selectedBillings.includes(payment.id))
    } else if (selectedBillingInModal) {
      return paymentRecords.filter((payment) => payment.id === selectedBillingInModal)
    }
    return []
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
    const paymentsToProcess = getSelectedBillingsData()

    if (paymentsToProcess.length === 0) {
      toast.error("No hay pagos seleccionados", {
        description: "Por favor selecciona al menos un pago para continuar.",
      })
      return
    }

    // Calcular el monto total
    const totalAmount = paymentsToProcess.reduce((sum, payment) => sum + payment.amount, 0)
    setBillingAmount(totalAmount.toString())

    // Cerrar el primer modal y abrir el formulario
    setShowBillingModal(false)
    setShowBillingFormModal(true)
  }

  const handleConfirmBilling = async () => {
    if (!currentUser || !currentSchool) {
      toast.error("Error de autenticación", {
        description: "No se pudo verificar tu identidad.",
      })
      return
    }

    const paymentsToProcess = getSelectedBillingsData()

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
      // Procesar cada pago seleccionado
      const results = []

      for (const paymentRecord of paymentsToProcess) {
        const estudiante = filteredEstudiantesByCycle.find((e) => e.id === paymentRecord.studentId)
        if (!estudiante) continue

        // Calcular el monto a pagar para este cobro específico
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

      // Mostrar notificación con opción de ver recibo (solo para pagos en efectivo)
      const firstResult = results[0]
      const hasInvoiceUrl = firstResult && 'invoiceUrl' in firstResult && firstResult.invoiceUrl
      
      toast.success("Pago procesado exitosamente", {
        description: `Se procesaron ${results.length} pago(s) correctamente.`,
        action: hasInvoiceUrl ? {
          label: "Ver recibo",
          onClick: () => window.open(firstResult.invoiceUrl as string, '_blank'),
        } : undefined,
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

  const stats = useMemo(() => {
    const configs = filteredEstudiantes ?? []
    return [
      {
        title: "Total de Cobros",
        value: totalColegiaturas,
        icon: Backpack,
        trend: "Estudiantes activos",
        variant: "default" as const
      },
      {
        title: "Cobros del Día",
        value: colegiaturasAlDia,
        icon: CheckCircle,
        trend: "Sin retrasos",
        variant: "secondary" as const
      },
      {
        title: "Cobros Pendientes",
        value: colegiaturasRetrasadas,
        icon: ClockAlert,
        trend: "Requieren atención",
        variant: "destructive" as const
      },
      {
        title: "Cobros Morosos",
        value: colegiaturasMorosas,
        icon: TriangleAlert,
        trend: "Atención inmediata",
        variant: "default" as const
      }
    ]
  }, [filteredEstudiantes])

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
    <div className="space-y-6">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
              <CardDescription>
                Encuentra los cobros por nombre, matrícula, ciclo escolar, grado y grupo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 text-base border-gray-200 focus:border-blue-300"
                />
              </div>
            </div>
            <div className="flex gap-3 max-lg:flex-col">
              <Select value={selectedSchoolCycle} onValueChange={setSelectedSchoolCycle}>
                <SelectTrigger className="w-[220px] max-lg:w-full h-11">
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

              <Select onValueChange={(v) => setGradeFilter(v === "all" ? null : v)} value={gradeFilter || ""}>
                <SelectTrigger className="w-[180px] max-lg:w-full h-11">
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
                <SelectTrigger className="w-[180px] max-lg:w-full h-11">
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
            <Accordion type="single" collapsible className="space-y-4">
              {filteredEstudiantes.map((estudiante) => {
                const studentBillings = estudiante.pagos
                const config = getEstadoConfig(estudiante.estado);
                const Icon = config.icon;
                const hasSelectedBillings = studentBillings.some((pago) => selectedBillings.includes(pago.id))

                const selectedBillingsData = studentBillings.filter(p => selectedBillings.includes(p.id));
                const totalSelected = selectedBillingsData.reduce((sum, p) => sum + p.totalAmount, 0);
                const totalBase = selectedBillingsData.reduce((sum, p) => sum + p.amount, 0);
                const totalDiscounts = selectedBillingsData.reduce((sum, p) => sum + p.totalDiscount, 0);
                const totalFees = selectedBillingsData.reduce((sum, p) => sum + p.lateFee, 0);

                return (
                  <AccordionItem
                    key={estudiante.id}
                    value={estudiante.id}
                    className={`border rounded-xl transition-all duration-300 shadow-sm ${hasSelectedBillings
                      ? "border-blue-300 bg-blue-50/50 shadow-lg ring-1 ring-blue-200"
                      : estudiante.estado === "retrasado"
                        ? "border-red-200 bg-red-50/30"
                        : estudiante.estado === "moroso"
                          ? "border-yellow-200 bg-yellow-50/30"
                          : "border-gray-200 bg-white hover:shadow-md"
                      }`}
                  >
                    <AccordionTrigger
                      className={`px-4 sm:px-6 py-4 hover:no-underline rounded-xl transition-colors cursor-pointer ${hasSelectedBillings
                        ? "hover:bg-blue-100/70"
                        : estudiante.estado === "retrasado"
                          ? "hover:bg-red-100/50"
                          : estudiante.estado === "moroso"
                            ? "hover:bg-yellow-100/50"
                            : "hover:bg-gray-50/50"
                        }`}
                    >
                      <div className={`w-1 h-16 lg:h-20 ${config.accentColor} ${config.hoverAccentColor} rounded-full flex-shrink-0 transition-colors duration-300`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-1">
                          <div className="flex flex-col">
                            <div className="flex min-w-0 flex-col sm:flex-row sm:gap-1">
                              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2 truncate">
                                {estudiante.nombre}
                              </h3>

                              <div className="flex items-center gap-2 sm:ml-3 mb-3 mt-1">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                  {config.label}
                                </span>
                              </div>

                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{estudiante.grado} · Grupo {estudiante.grupo}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{estudiante.matricula}</span>
                              </div>
                              <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-50 rounded-md border border-gray-200">
                                <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                                <span className="font-semibold text-gray-700">{estudiante.pagos.length} cobro{estudiante.pagos.length > 1 ? 's' : ''}</span>
                              </div>
                              {(estudiante.diasRetraso > 0 || estudiante.credit > 0) && (
                                <div className="flex flex-wrap gap-2">
                                  {estudiante.diasRetraso > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      {estudiante.diasRetraso} días de retraso
                                    </div>
                                  )}
                                  {estudiante.credit > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                                      <DollarSign className="w-3.5 h-3.5" />
                                      Crédito disponible: ${estudiante.credit.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-shrink-0 text-left md:text-right">
                            <div className="text-sm text-gray-500 mb-1">Monto Total</div>
                            <div className="text-2xl md:text-3xl font-bold text-gray-900">
                              ${estudiante.montoColegiatura.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">MXN</div>
                          </div>
                        </div>

                        {
                          selectedBillings.length > 0 && (
                            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                  <div className="flex items-center gap-6 text-sm">
                                    <div>
                                      <span className="text-gray-600">Pagos seleccionados: </span>
                                      <span className="font-semibold text-gray-900">{selectedBillings.length}</span>
                                    </div>
                                    {(totalDiscounts > 0 || totalFees > 0) && (
                                      <>
                                        <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
                                        <div>
                                          <span className="text-gray-600">Base: </span>
                                          <span className="font-semibold text-gray-900">${totalBase.toLocaleString()}</span>
                                        </div>
                                        {totalDiscounts > 0 && (
                                          <>
                                            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
                                            <div>
                                              <span className="text-gray-600">Descuentos: </span>
                                              <span className="font-semibold text-green-700">-${totalDiscounts.toLocaleString()}</span>
                                            </div>
                                          </>
                                        )}
                                        {totalFees > 0 && (
                                          <>
                                            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
                                            <div>
                                              <span className="text-gray-600">Recargos: </span>
                                              <span className="font-semibold text-red-700">+${totalFees.toLocaleString()}</span>
                                            </div>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>

                                  {/* Action Button */}
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500">Total</div>
                                      <div className="text-xl font-semibold text-gray-900">${totalSelected.toLocaleString()}</div>
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
                                </div>
                              </div>
                            </div>
                          )
                        }


                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-5 lg:px-6 pb-6">
                      <div className="border-t border-gray-100 pt-5">
                        <div className="mb-5">
                          <h3 className="text-base font-semibold text-gray-900 mb-1">Detalle de Cobros</h3>
                          <p className="text-sm text-gray-500">Selecciona los pagos que deseas procesar</p>
                        </div>
                        <div className="space-y-3">
                          {estudiante.pagos.map((pago) => {
                            const isBillingSelected = selectedBillings.includes(pago.id);
                            const isPaid = pago.estado === "Pagado";
                            const statusConfig = getBillingStatusConfig(pago.estado);
                            const config = getEstadoBillingConfig(pago.statusBilling);
                            const StatusIcon = statusConfig?.icon || CheckCircle;

                            return (
                              <div
                                key={pago.id}
                                className={`rounded-lg border transition-all duration-200 ${isBillingSelected
                                  ? 'border-blue-400 bg-blue-50/30 shadow-md'
                                  : isPaid
                                    ? 'border-emerald-200 bg-emerald-50/20'
                                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                                  }`}
                              >
                                <div className="flex flex-col gap-4 p-4 lg:p-5">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0 flex-1 pr-2">
                                      <Checkbox
                                        checked={isBillingSelected}
                                        onCheckedChange={(checked) => handleBillingSelection(pago.id, checked as boolean)}
                                        disabled={isPaid}
                                        className={`mt-1 flex-shrink-0 ${isBillingSelected ? "border-blue-500 data-[state=checked]:bg-blue-500" : "border-gray-400"}`}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                              <h5 className="text-base font-semibold text-gray-900">{pago.tipo.charAt(0).toUpperCase() + pago.tipo.slice(1).toLowerCase()}</h5>
                                              {config && (
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                                                  <Icon className="w-3.5 h-3.5" />
                                                  {config.label}
                                                </span>
                                              )}
                                              {statusConfig && (
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                  <StatusIcon className="w-3 h-3" />
                                                  {pago.estado}
                                                </span>
                                              )}
                                              {pago.diasRetraso > 0 && (
                                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold">
                                                  <AlertTriangle className="w-3 h-3" />
                                                  {pago.diasRetraso} días de retraso
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex flex-col sm:flex-row pt-1 text-sm text-gray-600 gap-3">
                                              <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>Vencimiento: <span className="font-medium text-gray-900">{pago.fechaVencimiento}</span></span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-gray-400" />
                                                <span>Monto base: <span className="font-medium text-gray-900">${pago.amount.toLocaleString()} MXN</span></span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex-shrink-0 text-left lg:text-right">
                                            <div className="text-xs text-gray-500 mb-1">{pago.estado === "Pagado" ? "Pagado" : "Total a pagar"}</div>
                                            <div className="text-2xl font-bold text-gray-900">
                                              ${pago.totalAmount.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">MXN</div>
                                          </div>
                                        </div>
                                        {(pago.totalDiscount > 0 || pago.lateFee > 0) && (
                                          <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="calculation" className="border-none">
                                              <AccordionTrigger className="py-3 px-4 hover:no-underline cursor-pointer  hover:bg-gray-50 rounded-lg transition-colors">
                                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                  <span>Ver desglose del cálculo</span>
                                                </div>
                                              </AccordionTrigger>

                                              <AccordionContent className="px-4 pb-4 pt-2">
                                                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 space-y-3">
                                                  <div className="flex items-center justify-between border-b border-gray-100">
                                                    <span className="text-sm font-medium text-gray-600">Monto base</span>
                                                    <span className="text-base font-semibold text-gray-900">
                                                      ${pago.amount.toLocaleString('es-MX')}
                                                    </span>
                                                  </div>
                                                  {pago.appliedDiscounts?.length > 0 && (
                                                    <div className="space-y-2">
                                                      {pago.appliedDiscounts.map((discount, idx) => (
                                                        <div
                                                          key={idx}
                                                          className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-md border border-green-100"
                                                        >
                                                          <div className="flex items-center gap-2">
                                                            <div className="bg-green-100 p-1 rounded-full">
                                                              <Minus className="w-3.5 h-3.5 text-green-700" />
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-700">
                                                              {discount.type === 'scholarship' ? 'Beca' : 'Descuento'}
                                                              {discount.percentage != null && (
                                                                <span className="ml-1 text-green-700 font-medium">
                                                                  ({discount.percentage}%)
                                                                </span>
                                                              )}
                                                            </span>
                                                          </div>
                                                          <span className="text-sm font-semibold text-green-700">
                                                            -${discount.amount.toLocaleString('es-MX')}
                                                          </span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  {pago.lateFee > 0 && (
                                                    <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-md border border-red-100">
                                                      <div className="flex items-center gap-2">
                                                        <div className="bg-red-100 p-1 rounded-full">
                                                          <Plus className="w-3.5 h-3.5 text-red-700" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                          <div className="font-bold text-sm text-gray-700">
                                                            Recargo por mora
                                                          </div>
                                                          <div className="text-xs text-rose-700 font-semibold">
                                                            {pago.diasRetraso} días de retraso
                                                          </div>
                                                        </div>

                                                      </div>
                                                      <span className="text-sm font-semibold text-red-700">
                                                        +${pago.lateFee.toLocaleString('es-MX')}
                                                      </span>
                                                    </div>
                                                  )}
                                                  <div className="pt-3 border-t-2 border-gray-200 mt-3">
                                                    <div className="flex items-center justify-between py-2 px-3 rounded-md border border-blue-100">
                                                      <div className="flex items-center gap-2">
                                                        <div className="bg-gray-100 p-1 rounded-full">
                                                          <Equal className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-900">Total a pagar</span>
                                                      </div>
                                                      <span className="text-base font-bold">
                                                        ${pago.totalAmount.toLocaleString('es-MX')}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </AccordionContent>
                                            </AccordionItem>
                                          </Accordion>
                                        )}

                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
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

            {getSelectedBillingsData().map((paymentRecord) => {
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

            {getSelectedBillingsData().length > 0 && (
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
                              {getSelectedBillingsData().length} cobro{getSelectedBillingsData().length > 1 ? "s" : ""}{" "}
                              seleccionado{getSelectedBillingsData().length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-2xl sm:text-4xl font-bold text-slate-900 mb-1">
                          $
                          {getSelectedBillingsData()
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
              {paymentMethodType === "manual" 
                ? "Completa la información del pago a procesar"
                : paymentMethodType === "stripe"
                  ? "Procesa el pago con tarjeta de crédito o débito"
                  : paymentMethodType === "spei"
                    ? "Genera los datos para realizar la transferencia bancaria"
                    : "Genera tu ficha para pagar en cualquier tienda OXXO"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen de Cobros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getSelectedBillingsData().map((payment) => (
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
                      ${getSelectedBillingsData()
                        .reduce((sum, payment) => sum + payment.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selección de tipo de pago */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Método de Pago</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setBillingMethod(value as "cash" | "bank_transfer" | "card" | "other")}>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Registro Manual</p>
                      <p className="text-xs text-muted-foreground">Efectivo u otro método - Confirmacion en minutos</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="oxxo" id="oxxo" />
                  <Label htmlFor="oxxo" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Store className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Pago en OXXO</p>
                      <p className="text-xs text-muted-foreground">Paga en OXXO - Confirmacion en minutos</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Pago con Tarjeta (Stripe)</p>
                      <p className="text-xs text-muted-foreground">Tarjeta de crédito o débito - Procesamiento inmediato</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="spei" id="spei" />
                  <Label htmlFor="spei" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building2 className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Transferencia Bancaria (SPEI)</p>
                      <p className="text-xs text-muted-foreground">Genera datos para transferencia - Confirmación en 1-2 días</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Contenido condicional basado en el tipo de pago */}
            {paymentMethodType === "stripe" ? (
              // Formulario de Stripe para tarjetas
              <>
                {(() => {
                  const selectedPaymentsData = getSelectedPaymentsData()
                  const firstPayment = selectedPaymentsData[0]
                  
                  if (selectedPaymentsData.length === 1 && firstPayment && currentSchool?.school._id && currentUser?._id) {
                    return (
                      <StripeCheckoutButton
                        billingId={firstPayment.id as Id<"billing">}
                        amount={firstPayment.amount}
                        schoolId={currentSchool.school._id}
                        studentId={firstPayment.studentId as Id<"student">}
                        tutorId={currentUser._id}
                        studentName={firstPayment.studentName}
                        paymentType={firstPayment.paymentType}
                        onCancel={closePaymentFormModal}
                      />
                    )
                  }
                  
                  if (selectedPaymentsData.length > 1) {
                    return (
                      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900">
                              Pagos múltiples con tarjeta
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Por el momento, solo puedes procesar un pago a la vez con tarjeta. 
                              Por favor, selecciona un solo cobro o usa el registro manual para múltiples pagos.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            Error de configuración
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            No se pudo cargar la información necesaria. Por favor, recarga la página e intenta nuevamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : paymentMethodType === "spei" ? (
              // Formulario de SPEI (transferencia bancaria)
              <>
                {(() => {
                  const selectedPaymentsData = getSelectedPaymentsData()
                  const firstPayment = selectedPaymentsData[0]
                  
                  if (selectedPaymentsData.length === 1 && firstPayment && currentSchool?.school._id && currentUser?._id) {
                    // Obtener información del estudiante y tutor
                    const estudiante = filteredEstudiantesByCycle.find((e) => e.id === firstPayment.studentId)
                    
                    // Usar el email del usuario actual (quien está haciendo el pago) o un email genérico
                    const customerEmail = clerkUser?.primaryEmailAddress?.emailAddress || `tutor-${firstPayment.studentId}@school.com`
                    const customerName = estudiante?.padre || firstPayment.studentName
                    
                    return (
                      <SPEIPaymentForm
                        billingId={firstPayment.id as Id<"billing">}
                        amount={firstPayment.amount}
                        schoolId={currentSchool.school._id}
                        studentId={firstPayment.studentId as Id<"student">}
                        tutorId={currentUser._id}
                        studentName={firstPayment.studentName}
                        paymentType={firstPayment.paymentType}
                        customerEmail={customerEmail}
                        customerName={customerName}
                        onSuccess={() => {
                          closePaymentFormModal()
                          closePaymentModal()
                        }}
                        onCancel={closePaymentFormModal}
                      />
                    )
                  }
                  
                  if (selectedPaymentsData.length > 1) {
                    return (
                      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900">
                              Pagos múltiples con SPEI
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Por el momento, solo puedes procesar un pago a la vez con SPEI. 
                              Por favor, selecciona un solo cobro o usa el registro manual para múltiples pagos.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            Error de configuración
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            No se pudo cargar la información necesaria. Por favor, recarga la página e intenta nuevamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : paymentMethodType === "oxxo" ? (
              // Formulario de OXXO
              <>
                {(() => {
                  const selectedPaymentsData = getSelectedPaymentsData()
                  const firstPayment = selectedPaymentsData[0]
                  
                  if (selectedPaymentsData.length === 1 && firstPayment && currentSchool?.school._id && currentUser?._id) {
                    // Obtener información del estudiante y tutor
                    const estudiante = filteredEstudiantesByCycle.find((e) => e.id === firstPayment.studentId)
                    
                    // Usar el email del usuario actual (quien está haciendo el pago) o un email genérico
                    const customerEmail = clerkUser?.primaryEmailAddress?.emailAddress || `tutor-${firstPayment.studentId}@school.com`
                    const customerName = estudiante?.padre || firstPayment.studentName
                    
                    return (
                      <OXXOPaymentForm
                        billingId={firstPayment.id as Id<"billing">}
                        amount={firstPayment.amount}
                        schoolId={currentSchool.school._id}
                        studentId={firstPayment.studentId as Id<"student">}
                        tutorId={currentUser._id}
                        studentName={firstPayment.studentName}
                        paymentType={firstPayment.paymentType}
                        customerEmail={customerEmail}
                        customerName={customerName}
                        onSuccess={() => {
                          closePaymentFormModal()
                          closePaymentModal()
                        }}
                        onCancel={closePaymentFormModal}
                      />
                    )
                  }
                  
                  if (selectedPaymentsData.length > 1) {
                    return (
                      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900">
                              Pagos múltiples con OXXO
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Por el momento, solo puedes procesar un pago a la vez con OXXO. 
                              Por favor, selecciona un solo cobro o usa el registro manual para múltiples pagos.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            Error de configuración
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            No se pudo cargar la información necesaria. Por favor, recarga la página e intenta nuevamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) :
            (
              // Formulario manual (el original)
              <>
                {/* Método de Pago */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Tipo de Pago</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "cash" | "bank_transfer" | "card" | "other")}>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Banknote className="h-4 w-4" />
                        Efectivo
                      </Label>
                    </div>        
                  
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="flex items-center gap-2 cursor-pointer flex-1">
                        <DollarSign className="h-4 w-4" />
                        Otro método
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

            {/* Monto a Pagar */}
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
