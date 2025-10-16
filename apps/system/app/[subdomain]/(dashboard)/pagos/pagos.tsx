"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@repo/ui/components/shadcn/card"
import {
  Backpack,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Search,
  User,
  CreditCard,
  Banknote,
  CircleAlert as ClockAlert,
  TriangleAlert,
  AlertCircle,
  Loader2,
  Building2,
  Store,
} from "lucide-react"
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
import { useQuery, useMutation } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { useUserWithConvex } from "../../../../stores/userStore"
import { useCurrentSchool } from "../../../../stores/userSchoolsStore"
import { Label } from "@repo/ui/components/shadcn/label"
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/shadcn/radio-group"
import { StripeCheckoutButton } from "../../../../components/stripe/StripeCheckoutButton"
import { SPEIPaymentForm } from "../../../../components/stripe/SPEIPaymentForm"
import { OXXOPaymentForm } from "../../../../components/stripe/OXXOPaymentForm"


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
    monto: number
    montoTotal: number
    montoPagado: number
    fechaVencimiento: string
    estado: "Pendiente" | "Vencido" | "Pagado"
    diasRetraso: number
  }>
}

interface PaymentRecord {
  id: string
  studentId: string
  studentName: string
  studentGrade: string
  studentGroup: string
  studentMatricula: string
  paymentType: string
  amount: number
  dueDate: string
  status: "Pendiente" | "Vencido" | "Pagado"
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

export default function Pagos({ selectedSchoolCycle, setSelectedSchoolCycle }: PagosProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter] = useState<string | null>(null)
  const [tipoFilter] = useState<string | null>(null)
  const [gradeFilter, setGradeFilter] = useState<string | null>(null)
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentInModal, setSelectedPaymentInModal] = useState<string | null>(null)
  const [showPaymentFormModal, setShowPaymentFormModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer" | "card" | "other">("cash")
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentMethodType, setPaymentMethodType] = useState<"manual" | "stripe" | "spei" | "oxxo">("manual")

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

  const uniqueGrades =useQuery(
    api.functions.group.getUniqueGrades,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  )

  const groupeByGrade = useQuery(
    api.functions.group.getAllGroupsBySchool,
    currentSchool?.school._id ? {schoolId: currentSchool.school._id} : "skip"
  )

  // Mutation para procesar el pago
  const processPayment = useMutation(api.functions.billing.processPayment)

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

  // Limpiar filtro de grupo cuando cambie el filtro de grado
  useEffect(() => {
    if (gradeFilter) {
      setGroupFilter(null)
    }
  }, [gradeFilter])

  // Manejar el retorno de Stripe Checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    
    if (paymentStatus === 'success') {
      toast.success("¡Pago procesado exitosamente!", {
        description: "El pago con tarjeta ha sido confirmado por Stripe.",
        duration: 5000,
      })
      // Limpiar el parámetro de la URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (paymentStatus === 'cancelled') {
      toast.info("Pago cancelado", {
        description: "El pago fue cancelado. Puedes intentarlo nuevamente cuando gustes.",
      })
      // Limpiar el parámetro de la URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Transformar datos de Convex para que coincidan con la interfaz
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

  const calcularMontoPagar = (estudiante: Estudiante) => {
    // montoColegiatura ahora ya incluye solo el monto pendiente (amount - deposit)
    // Sumamos las penalizaciones por días de retraso
    return estudiante.montoColegiatura + (estudiante.diasRetraso * 150)
  }

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
          <Badge className="bg-transparent text-red-500 ">
            <AlertTriangle className="w-4 h-4 mr-1 text-red-500 " />
            Moroso
          </Badge>
        )
      default:
        return null
    }
  }

  const handleDarDeBaja = (estudiante: Estudiante) => {
    if (confirm(`¿Estás seguro de que deseas dar de baja a ${estudiante.nombre}? Esta acción no se puede deshacer.`)) {
      alert(`${estudiante.nombre} ha sido dado de baja del sistema.`)
    }
  }

  const createPaymentRecords = (): PaymentRecord[] => {
    const records: PaymentRecord[] = []

    filteredEstudiantesByCycle.forEach((estudiante) => {
      estudiante.pagos.forEach((pago) => {
        // pago.monto ahora ya es el monto pendiente (amount - deposit)
        // Solo agregamos las penalizaciones por días de retraso si hay pagos pendientes
        const montoPendiente = pago.monto
        const penalizacion = pago.estado !== "Pagado" ? pago.diasRetraso * 150 : 0
        
        records.push({
          id: pago.id,
          studentId: estudiante.id,
          studentName: estudiante.nombre,
          studentGrade: estudiante.grado,
          studentGroup: estudiante.grupo,
          studentMatricula: estudiante.matricula,
          paymentType: pago.tipo,
          amount: montoPendiente + penalizacion, // Monto pendiente + penalización
          dueDate: (pago.fechaVencimiento || new Date().toISOString().split('T')[0]) as string,
          status: pago.estado,
          daysLate: pago.diasRetraso,
        })
      })
    })

    return records
  }

  const paymentRecords = createPaymentRecords()
  const unpaidPaymentRecords = paymentRecords.filter((record) => record.status !== "Pagado")

  const handlePaymentSelection = (paymentId: string, checked: boolean) => {
    const paymentRecord = paymentRecords.find((p) => p.id === paymentId)

    if (paymentRecord?.status === "Pagado") {
      toast.error("Este pago ya ha sido realizado", {
        description: "No puedes seleccionar un pago que ya está pagado.",
      })
      return
    }

    if (checked) {
      setSelectedPayments((prev) => [...prev, paymentId])
    } else {
      setSelectedPayments((prev) => prev.filter((id) => id !== paymentId))
    }
  }

  const handleRealizarPagos = () => {
    setShowPaymentModal(true)
  }

  const getSelectedPaymentsData = () => {
    if (selectedPayments.length > 0) {
      return paymentRecords.filter((payment) => selectedPayments.includes(payment.id))
    } else if (selectedPaymentInModal) {
      return paymentRecords.filter((payment) => payment.id === selectedPaymentInModal)
    }
    return []
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedPayments([])
    setSelectedPaymentInModal(null)
  }

  const closePaymentFormModal = () => {
    setShowPaymentFormModal(false)
    setPaymentMethod("cash")
    setPaymentAmount("")
  }

  const handlePaymentSelectionInModal = (paymentId: string) => {
    const paymentRecord = paymentRecords.find((p) => p.id === paymentId)

    if (paymentRecord?.status === "Pagado") {
      toast.error("Este pago ya ha sido realizado", {
        description: "No puedes seleccionar un pago que ya está pagado.",
      })
      return
    }

    setSelectedPaymentInModal(paymentId)
  }

  const handleOpenPaymentForm = () => {
    const paymentsToProcess = getSelectedPaymentsData()
    
    if (paymentsToProcess.length === 0) {
      toast.error("No hay pagos seleccionados", {
        description: "Por favor selecciona al menos un pago para continuar.",
      })
      return
    }

    // Calcular el monto total
    const totalAmount = paymentsToProcess.reduce((sum, payment) => sum + payment.amount, 0)
    setPaymentAmount(totalAmount.toString())
    
    // Cerrar el primer modal y abrir el formulario
    setShowPaymentModal(false)
    setShowPaymentFormModal(true)
  }

  const handleConfirmPayment = async () => {
    if (!currentUser || !currentSchool) {
      toast.error("Error de autenticación", {
        description: "No se pudo verificar tu identidad.",
      })
      return
    }

    const paymentsToProcess = getSelectedPaymentsData()
    
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

    setIsProcessingPayment(true)

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

        const result = await processPayment({
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

      // Limpiar y cerrar modales
      closePaymentFormModal()
      closePaymentModal()
      
    } catch (error: unknown) {
      toast.error("Error al procesar el pago", {
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Total de Cobros</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Backpack className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{totalColegiaturas}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Cobros al Día</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Banknote className="h-3 w-3 lg:h-4 lg:w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{colegiaturasAlDia}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Cobros Pendientes</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <ClockAlert className="h-3 w-3 lg:h-4 lg:w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{colegiaturasRetrasadas}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Cobros Morosos</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <TriangleAlert className="h-3 w-3 lg:h-4 lg:w-4 " />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{colegiaturasMorosas}</div>
          </CardContent>
        </Card>
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
                {/* Encuentra los cobros por nombre, matrícula, tipo, estado o ciclo escolar. */}
                Encuentra los cobros por nombre, matrícula, ciclo escolar, grado y grupo.

              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2  max-md:flex-col">
              <Select value={selectedSchoolCycle} onValueChange={setSelectedSchoolCycle}>
                <SelectTrigger className="w-[200px] max-md:w-full">
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
                <SelectTrigger className="w-[160px] max-md:w-full">
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
                <SelectTrigger className="w-[160px] max-md:w-full">
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
              {selectedPayments.length > 0 && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {selectedPayments.length} seleccionado{selectedPayments.length > 1 ? "s" : ""}
                </Badge>
              )}
              <Badge variant="outline">{filteredEstudiantes.length} registros</Badge>
            </div>
          </CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            Selecciona los cobros que deseas procesar marcando las casillas correspondientes
          </CardDescription>
          {selectedPayments.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t bg-gray-50/50 -mx-6 px-6 py-4 mt-4 rounded-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent"
                  onClick={() => {
                    const allVisibleUnpaidIds = unpaidPaymentRecords
                      .filter((record) => filteredEstudiantes.some((e) => e.id === record.studentId))
                      .map((record) => record.id)
                    setSelectedPayments(allVisibleUnpaidIds)
                  }}
                >
                  Seleccionar todos los visibles
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent"
                  onClick={() => setSelectedPayments([])}
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
                {selectedPayments.length === 1
                  ? "Realizar Pago"
                  : selectedPayments.length > 1
                    ? "Realizar Pagos"
                    : "Realizar Pago"}
              </Button>
            </div>
          )}
          {selectedPayments.length === 0 && (
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
          <Accordion type="single" collapsible className="space-y-2 max-md:space-y-6">
            {filteredEstudiantes.map((estudiante) => { 
              const studentPayments = estudiante.pagos
              const hasSelectedPayments = studentPayments.some((pago) => selectedPayments.includes(pago.id))

              return (
                <AccordionItem
                  key={estudiante.id}
                  value={estudiante.id}
                  className={`border rounded-lg transition-all duration-200  ${
                    hasSelectedPayments ? "border-blue-300 bg-blue-50/70 shadow-md" : "border-border bg-accent/50"
                  }`}
                >
                  <AccordionTrigger
                    className={`px-3  sm:px-4 py-3 hover:no-underline rounded-lg transition-colors ${
                      hasSelectedPayments ? "hover:bg-blue-100/70" : "hover:bg-accent/70"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mr-2 sm:mr-4 gap-3 sm:gap-4">
                      {/* Información principal - siempre visible */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <h3 className={`font-semibold text-sm sm:text-base truncate w-full ${hasSelectedPayments ? "text-blue-900" : "text-foreground"}`}>
                            {estudiante.nombre}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 truncate w-full">
                            {estudiante.grado} - Grupo {estudiante.grupo}
                          </p>
                          <p className="text-xs text-gray-500 truncate w-full">
                            Matrícula: {estudiante.matricula}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              {estudiante.tipo}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {studentPayments.length} cobro{studentPayments.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Información de estado y monto  */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:flex-shrink-0">
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          {getEstadoBadge(estudiante.estado)}
                        </div>
                        <div className="text-left sm:text-right">
                          <p className={`font-semibold text-sm sm:text-base ${hasSelectedPayments ? "text-blue-900" : "text-foreground"}`}>
                            ${calcularMontoPagar(estudiante).toLocaleString()}
                          </p>
                          {estudiante.diasRetraso > 0 && (
                            <p className="text-xs sm:text-sm text-gray-500">{estudiante.diasRetraso} días de retraso</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-3 sm:px-4 pb-4">
                    <div className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
                      <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base">
                          <CreditCard className="w-4 h-4" />
                          Cobros Asociados
                        </h4>
                        <div className="space-y-2 sm:space-y-3">
                          {studentPayments.map((pago) => {
                            const isPaymentSelected = selectedPayments.includes(pago.id)
                            const isPaid = pago.estado === "Pagado"

                            return (
                              <div
                                key={pago.id}
                                className={`border rounded-lg p-3 sm:p-4 transition-all duration-200 ${
                                  isPaymentSelected
                                    ? "border-blue-300 bg-blue-50/70"
                                    : isPaid
                                      ? "border-green-200 bg-green-50/30"
                                      : "border-gray-200 bg-gray-50/30"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                    <Checkbox
                                      checked={isPaymentSelected}
                                      onCheckedChange={(checked) => handlePaymentSelection(pago.id, checked as boolean)}
                                      disabled={isPaid}
                                      className={`mt-1 sm:mt-0 flex-shrink-0 ${isPaymentSelected ? "border-blue-500 data-[state=checked]:bg-blue-500" : "border-gray-400"}`}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`font-medium text-sm sm:text-base truncate ${isPaymentSelected ? "text-blue-900" : "text-gray-700"}`}
                                      >
                                        {pago.tipo}
                                      </p>
                                      <p className="text-xs sm:text-sm text-gray-500">Vence: {pago.fechaVencimiento}</p>
                                      {pago.diasRetraso > 0 && (
                                        <p className="text-xs text-red-600">{pago.diasRetraso} días de retraso</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                                    <Badge
                                      className={`text-xs px-2 py-1 ${
                                        pago.estado === "Pendiente"
                                          ? "bg-transparent text-yellow-800"
                                          : pago.estado === "Vencido"
                                            ? "bg-transparent text-red-500"
                                            : "bg-transparent text-green-800"
                                      }`}
                                    >
                                      {pago.estado === "Pendiente" && <Clock className="w-3 h-3 mr-1" />}
                                      {pago.estado === "Vencido" && <AlertTriangle className="w-3 h-3 mr-1" />}
                                      {pago.estado === "Pagado" && <CheckCircle className="w-3 h-3 mr-1" />}
                                      {pago.estado}
                                    </Badge>
                                    <p
                                      className={`font-semibold text-sm sm:text-base ${isPaymentSelected ? "text-blue-900" : "text-gray-700"}`}
                                    >
                                      ${(pago.monto + (pago.estado !== "Pagado" ? pago.diasRetraso * 150 : 0)).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Información del padre/tutor */}
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                            <User className="w-4 h-4" />
                            Información del Padre/Tutor
                          </h4>
                          <div className="space-y-2 text-xs sm:text-sm">
                            <p className="break-words">
                              <span className="text-muted-foreground">Nombre:</span>{" "}
                              <span className="text-foreground">{estudiante.padre}</span>
                            </p>
                            <p className="break-words">
                              <span className="text-muted-foreground">Teléfono:</span>{" "}
                              <span className="text-foreground">{estudiante.telefono}</span>
                            </p>
                          </div>
                        </div>

                        {/* Información de pago */}
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                            <CreditCard className="w-4 h-4" />
                            Información de Pago
                          </h4>
                          <div className="space-y-2 text-xs sm:text-sm">
                            <p className="break-words">
                              <span className="text-muted-foreground">Tipo:</span>{" "}
                              <span className="text-foreground">{estudiante.tipo}</span>
                            </p>
                            <p className="break-words">
                              <span className="text-muted-foreground">Método de pago:</span>{" "}
                              <span className="text-foreground">{estudiante.metodoPago}</span>
                            </p>
                            <p className="break-words">
                              <span className="text-muted-foreground">Fecha de vencimiento:</span>{" "}
                              <span className="text-foreground">{estudiante.fechaVencimiento}</span>
                            </p>
                            <p className="break-words">
                              <span className="text-muted-foreground">Monto base:</span>{" "}
                              <span className="text-foreground">${estudiante.montoColegiatura.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>

                        <div className="lg:col-span-2">
                          <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base">
                            <DollarSign className="w-4 h-4" />
                            Cálculo del Pago
                          </h4>

                          {estudiante.estado === "al-dia" && (
                            <div className="bg-success/10 border border-success/20 rounded-lg p-3 sm:p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                                <span className="font-semibold text-success text-sm sm:text-base">Estudiante al día</span>
                              </div>
                              <p className="text-xs sm:text-sm text-foreground">
                                El estudiante está al corriente con sus pagos. Monto a pagar:{" "}
                                <span className="font-bold">${estudiante.montoColegiatura.toLocaleString()}</span>
                              </p>
                            </div>
                          )}

                          {estudiante.estado === "retrasado" && (
                            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 sm:p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                                <span className="font-semibold text-warning text-sm sm:text-base">Pago retrasado</span>
                              </div>
                              <div className="space-y-2 text-xs sm:text-sm text-foreground">
                                <p>Monto base: ${estudiante.montoColegiatura.toLocaleString()}</p>
                                <p>
                                  Penalización ({estudiante.diasRetraso} días × $150): $
                                  {(estudiante.diasRetraso * 150).toLocaleString()}
                                </p>
                                <p className="font-bold text-lg">
                                  Total a pagar: ${calcularMontoPagar(estudiante).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}

                          {estudiante.estado === "moroso" && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 sm:p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                                <span className="font-semibold text-destructive text-sm sm:text-base">Estudiante moroso</span>
                              </div>
                              <div className="space-y-3">
                                <p className="text-xs sm:text-sm text-foreground">
                                  El estudiante lleva <span className="font-bold">{estudiante.diasRetraso} días</span>{" "}
                                  sin pagar.
                                </p>
                                <div className="space-y-2 text-xs sm:text-sm text-foreground">
                                  <p>Monto base: ${estudiante.montoColegiatura.toLocaleString()}</p>
                                  <p>
                                    Penalización ({estudiante.diasRetraso} días × $150): $
                                    {(estudiante.diasRetraso * 150).toLocaleString()}
                                  </p>
                                  <p className="font-bold text-base sm:text-lg text-destructive">
                                    Deuda total: ${calcularMontoPagar(estudiante).toLocaleString()}
                                  </p>
                                </div>
                                <div className="pt-3 border-t border-destructive/20">
                                  <p className="text-xs sm:text-sm text-foreground mb-3">
                                    ¿Deseas dar de baja a este estudiante de la escuela?
                                  </p>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDarDeBaja(estudiante)}
                                    className="bg-destructive text-white hover:bg-destructive/90 text-xs sm:text-sm px-3 py-2 max-md:w-full"
                                  >
                                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-white " />
                                    Dar de baja
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
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

      <Dialog open={ showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-2 sm:mx-4">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              Realizar Pago{selectedPayments.length > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedPayments.length > 0
                ? `Información de cobro para ${selectedPayments.length} cobro${selectedPayments.length > 1 ? "s" : ""}`
                : "Selecciona un cobro para procesar"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {selectedPayments.length === 0 && !selectedPaymentInModal && (
              <Card className="border-2 border-dashed">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Seleccionar Cobro</CardTitle>
                  <CardDescription className="text-sm">Elige un cobro pendiente del ciclo escolar activo para procesar</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select onValueChange={handlePaymentSelectionInModal}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar cobro..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unpaidPaymentRecords
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

            {getSelectedPaymentsData().map((paymentRecord) => {
              const estudiante = filteredEstudiantesByCycle.find((e) => e.id === paymentRecord.studentId)
              if (!estudiante) return null

              return (
                <Card key={paymentRecord.id} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <span className="truncate">{paymentRecord.studentName}</span>
                      <Badge
                        className={`text-xs px-2 py-1 ${
                          paymentRecord.status === "Pendiente"
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
                        <span className="text-base sm:text-lg font-semibold">Total a pagar:</span>
                        <span className="text-xl sm:text-2xl font-bold text-primary">
                          ${paymentRecord.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {getSelectedPaymentsData().length > 0 && (
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
                              {getSelectedPaymentsData().length} cobro{getSelectedPaymentsData().length > 1 ? "s" : ""}{" "}
                              seleccionado{getSelectedPaymentsData().length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-2xl sm:text-4xl font-bold text-slate-900 mb-1">
                          $
                          {getSelectedPaymentsData()
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
            <Button variant="outline" onClick={closePaymentModal} className="w-full sm:w-auto order-2 sm:order-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleOpenPaymentForm} 
              disabled={selectedPayments.length === 0 && !selectedPaymentInModal}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Formulario de Pago */}
      <Dialog open={showPaymentFormModal} onOpenChange={setShowPaymentFormModal}>
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
            {/* Resumen de pagos seleccionados */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen de Cobros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getSelectedPaymentsData().map((payment) => (
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
                      ${getSelectedPaymentsData()
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
              <RadioGroup value={paymentMethodType} onValueChange={(value) => setPaymentMethodType(value as "manual" | "stripe" | "spei" | "oxxo")}>
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
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-8 text-lg"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Puedes pagar el monto completo o realizar un abono parcial
                  </p>
                </div>

                <DialogFooter className="gap-2 flex-col sm:flex-row pt-4">
                  <Button 
                    variant="outline" 
                    onClick={closePaymentFormModal} 
                    disabled={isProcessingPayment}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleConfirmPayment} 
                    disabled={isProcessingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    {isProcessingPayment ? (
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
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
