"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@repo/ui/components/shadcn/card"
import {
  Backpack,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Search,
  Calendar,
  User,
  CreditCard,
  Banknote,
  CircleAlert as ClockAlert,
  TriangleAlert,
  AlertCircle,
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

interface SchoolCycle {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface Estudiante {
  id: string
  nombre: string
  grado: string
  grupo: string
  matricula: string
  padre: string
  telefono: string
  metodoPago: string
  fechaVencimiento: string
  montoColegiatura: number
  diasRetraso: number
  estado: "al-dia" | "retrasado" | "moroso"
  schoolCycleId: string
  tipo: "Inscripciones" | "Colegiatura"
  pagos: Array<{
    id: string
    tipo: string
    monto: number
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

const schoolCyclesMock: SchoolCycle[] = [
  {
    id: "2024-2025",
    name: "Ciclo Escolar 2024-2025",
    startDate: "2024-08-01",
    endDate: "2025-07-31",
    isActive: true,
  },
  {
    id: "2023-2024",
    name: "Ciclo Escolar 2023-2024",
    startDate: "2023-08-01",
    endDate: "2024-07-31",
    isActive: false,
  },
  {
    id: "2022-2023",
    name: "Ciclo Escolar 2022-2023",
    startDate: "2022-08-01",
    endDate: "2023-07-31",
    isActive: false,
  },
]

const estudiantesMock: Estudiante[] = [
  {
    id: "1",
    nombre: "Ana García López",
    grado: "3° Primaria",
    grupo: "A",
    matricula: "EST001",
    padre: "Carlos García Mendoza",
    telefono: "555-0123",
    metodoPago: "Transferencia Bancaria",
    fechaVencimiento: "2024-01-05",
    montoColegiatura: 2500,
    diasRetraso: 0,
    estado: "al-dia",
    schoolCycleId: "2024-2025",
    tipo: "Colegiatura",
    pagos: [
      {
        id: "pago-1-1",
        tipo: "Colegiatura Enero",
        monto: 2500,
        fechaVencimiento: "2024-01-05",
        estado: "Pagado",
        diasRetraso: 0,
      },
      {
        id: "pago-1-2",
        tipo: "Colegiatura Febrero",
        monto: 2500,
        fechaVencimiento: "2024-02-05",
        estado: "Pendiente",
        diasRetraso: 0,
      },
      {
        id: "pago-1-3",
        tipo: "Material Escolar",
        monto: 800,
        fechaVencimiento: "2024-02-15",
        estado: "Pendiente",
        diasRetraso: 0,
      },
    ],
  },
  {
    id: "2",
    nombre: "Luis Martínez Ruiz",
    grado: "5° Primaria",
    grupo: "B",
    matricula: "EST002",
    padre: "María Ruiz Hernández",
    telefono: "555-0456",
    metodoPago: "Efectivo",
    fechaVencimiento: "2024-01-05",
    montoColegiatura: 2500,
    diasRetraso: 12,
    estado: "retrasado",
    schoolCycleId: "2024-2025",
    tipo: "Colegiatura",
    pagos: [
      {
        id: "pago-2-1",
        tipo: "Colegiatura Enero",
        monto: 2500,
        fechaVencimiento: "2024-01-05",
        estado: "Vencido",
        diasRetraso: 12,
      },
      {
        id: "pago-2-2",
        tipo: "Inscripción",
        monto: 5000,
        fechaVencimiento: "2024-01-15",
        estado: "Pendiente",
        diasRetraso: 0,
      },
    ],
  },
  {
    id: "3",
    nombre: "Sofia Hernández Cruz",
    grado: "1° Secundaria",
    grupo: "A",
    matricula: "EST003",
    padre: "Roberto Hernández Silva",
    telefono: "555-0789",
    metodoPago: "Tarjeta de Crédito",
    fechaVencimiento: "2024-01-05",
    montoColegiatura: 3200,
    diasRetraso: 45,
    estado: "moroso",
    schoolCycleId: "2024-2025",
    tipo: "Inscripciones",
    pagos: [
      {
        id: "pago-3-1",
        tipo: "Inscripción",
        monto: 5000,
        fechaVencimiento: "2024-01-05",
        estado: "Vencido",
        diasRetraso: 45,
      },
      {
        id: "pago-3-2",
        tipo: "Colegiatura Enero",
        monto: 3200,
        fechaVencimiento: "2024-01-05",
        estado: "Vencido",
        diasRetraso: 45,
      },
      {
        id: "pago-3-3",
        tipo: "Seguro Escolar",
        monto: 800,
        fechaVencimiento: "2024-01-20",
        estado: "Vencido",
        diasRetraso: 30,
      },
    ],
  },
]

interface PagosProps {
  selectedSchoolCycle: string
  setSelectedSchoolCycle: (cycle: string) => void
}

export default function Pagos({ selectedSchoolCycle, setSelectedSchoolCycle }: PagosProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [tipoFilter, setTipoFilter] = useState<string | null>(null)
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentInModal, setSelectedPaymentInModal] = useState<string | null>(null)

  const filteredEstudiantesByCycle = estudiantesMock.filter(
    (estudiante) => estudiante.schoolCycleId === selectedSchoolCycle,
  )

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
    return matchesSearch && matchesStatus && matchesTipo
  })

  const calcularMontoPagar = (estudiante: Estudiante) => {
    if (estudiante.estado === "al-dia") {
      return estudiante.montoColegiatura
    } else if (estudiante.estado === "retrasado") {
      return estudiante.montoColegiatura + estudiante.diasRetraso * 150
    } else {
      return estudiante.montoColegiatura + estudiante.diasRetraso * 150
    }
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
          <Badge className="bg-transparent text-yellow-800">
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
        records.push({
          id: pago.id,
          studentId: estudiante.id,
          studentName: estudiante.nombre,
          studentGrade: estudiante.grado,
          studentGroup: estudiante.grupo,
          studentMatricula: estudiante.matricula,
          paymentType: pago.tipo,
          amount: pago.monto + pago.diasRetraso * 150, // Include late fees
          dueDate: pago.fechaVencimiento,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ciclo Escolar
          </CardTitle>
          <CardDescription>Selecciona el ciclo escolar para ver los pagos correspondientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSchoolCycle} onValueChange={setSelectedSchoolCycle}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Seleccionar ciclo escolar" />
            </SelectTrigger>
            <SelectContent>
              {schoolCyclesMock.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.name} {cycle.isActive && "(Activo)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Total de Pagos</CardTitle>
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
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Pagos al Día</CardTitle>
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
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Pagos Pendientes</CardTitle>
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
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Pagos Morosos</CardTitle>
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
                Encuentra los pagos por nombre, matrícula, tipo, estado o ciclo escolar.
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
            <div className="flex gap-2">
              <Select value={selectedSchoolCycle} onValueChange={setSelectedSchoolCycle}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Ciclo escolar" />
                </SelectTrigger>
                <SelectContent>
                  {schoolCyclesMock.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name} {cycle.isActive && "(Activo)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => setTipoFilter(v === "all" ? null : v)} value={tipoFilter || ""}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Inscripciones">Inscripciones</SelectItem>
                  <SelectItem value="Colegiatura">Colegiaturas</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => setStatusFilter(v === "all" ? null : v)} value={statusFilter || ""}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Pagadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="overdue">Morosas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Pagos</span>
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
            Selecciona los pagos que deseas procesar marcando las casillas correspondientes
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
                className="bg-black text-white hover:bg-gray-800 shadow-lg border-0"
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
            <div className="flex justify-end pt-2">
              <Button onClick={handleRealizarPagos} className="bg-black text-white hover:bg-gray-800 shadow-md">
                <CreditCard className="h-4 w-4 mr-2" />
                Realizar Pago
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {filteredEstudiantes.map((estudiante) => {
              const studentPayments = estudiante.pagos
              const hasSelectedPayments = studentPayments.some((pago) => selectedPayments.includes(pago.id))

              return (
                <AccordionItem
                  key={estudiante.id}
                  value={estudiante.id}
                  className={`border rounded-lg transition-all duration-200 ${
                    hasSelectedPayments ? "border-blue-300 bg-blue-50/70 shadow-md" : "border-border bg-accent/50"
                  }`}
                >
                  <AccordionTrigger
                    className={`px-4 py-3 hover:no-underline rounded-lg transition-colors ${
                      hasSelectedPayments ? "hover:bg-blue-100/70" : "hover:bg-accent/70"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-start">
                          <h3 className={`font-semibold ${hasSelectedPayments ? "text-blue-900" : "text-foreground"}`}>
                            {estudiante.nombre}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {estudiante.grado} - Grupo {estudiante.grupo} | {estudiante.matricula}
                          </p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {estudiante.tipo}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {studentPayments.length} pago{studentPayments.length > 1 ? "s" : ""} asociado
                            {studentPayments.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {getEstadoBadge(estudiante.estado)}
                        <div className="text-right">
                          <p className={`font-semibold ${hasSelectedPayments ? "text-blue-900" : "text-foreground"}`}>
                            ${calcularMontoPagar(estudiante).toLocaleString()}
                          </p>
                          {estudiante.diasRetraso > 0 && (
                            <p className="text-sm text-gray-500">{estudiante.diasRetraso} días de retraso</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-6 mt-4">
                      <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                          <CreditCard className="w-4 h-4" />
                          Pagos Asociados
                        </h4>
                        <div className="space-y-3">
                          {studentPayments.map((pago) => {
                            const isPaymentSelected = selectedPayments.includes(pago.id)
                            const isPaid = pago.estado === "Pagado"

                            return (
                              <div
                                key={pago.id}
                                className={`border rounded-lg p-4 transition-all duration-200 ${
                                  isPaymentSelected
                                    ? "border-blue-300 bg-blue-50/70"
                                    : isPaid
                                      ? "border-green-200 bg-green-50/30"
                                      : "border-gray-200 bg-gray-50/30"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={isPaymentSelected}
                                      onCheckedChange={(checked) => handlePaymentSelection(pago.id, checked as boolean)}
                                      disabled={isPaid}
                                      className={`${isPaymentSelected ? "border-blue-500 data-[state=checked]:bg-blue-500" : "border-gray-400"}`}
                                    />
                                    <div>
                                      <p
                                        className={`font-medium ${isPaymentSelected ? "text-blue-900" : "text-gray-700"}`}
                                      >
                                        {pago.tipo}
                                      </p>
                                      <p className="text-sm text-gray-500">Vence: {pago.fechaVencimiento}</p>
                                      {pago.diasRetraso > 0 && (
                                        <p className="text-xs text-red-600">{pago.diasRetraso} días de retraso</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge
                                      className={
                                        pago.estado === "Pendiente"
                                          ? "bg-transparent text-yellow-800"
                                          : pago.estado === "Vencido"
                                            ? "bg-transparent text-red-500"
                                            : "bg-transparent text-green-800"
                                      }
                                    >
                                      {pago.estado === "Pendiente" && <Clock className="w-3 h-3 mr-1" />}
                                      {pago.estado === "Vencido" && <AlertTriangle className="w-3 h-3 mr-1" />}
                                      {pago.estado === "Pagado" && <CheckCircle className="w-3 h-3 mr-1" />}
                                      {pago.estado}
                                    </Badge>
                                    <p
                                      className={`font-semibold ${isPaymentSelected ? "text-blue-900" : "text-gray-700"}`}
                                    >
                                      ${(pago.monto + pago.diasRetraso * 150).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Información del padre/tutor */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Información del Padre/Tutor
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="text-muted-foreground">Nombre:</span>{" "}
                              <span className="text-foreground">{estudiante.padre}</span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Teléfono:</span>{" "}
                              <span className="text-foreground">{estudiante.telefono}</span>
                            </p>
                          </div>
                        </div>

                        {/* Información de pago */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Información de Pago
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="text-muted-foreground">Tipo:</span>{" "}
                              <span className="text-foreground">{estudiante.tipo}</span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Método de pago:</span>{" "}
                              <span className="text-foreground">{estudiante.metodoPago}</span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Fecha de vencimiento:</span>{" "}
                              <span className="text-foreground">{estudiante.fechaVencimiento}</span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Monto base:</span>{" "}
                              <span className="text-foreground">${estudiante.montoColegiatura.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                            <DollarSign className="w-4 h-4" />
                            Cálculo del Pago
                          </h4>

                          {estudiante.estado === "al-dia" && (
                            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-success" />
                                <span className="font-semibold text-success">Estudiante al día</span>
                              </div>
                              <p className="text-sm text-foreground">
                                El estudiante está al corriente con sus pagos. Monto a pagar:{" "}
                                <span className="font-bold">${estudiante.montoColegiatura.toLocaleString()}</span>
                              </p>
                            </div>
                          )}

                          {estudiante.estado === "retrasado" && (
                            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-warning" />
                                <span className="font-semibold text-warning">Pago retrasado</span>
                              </div>
                              <div className="space-y-2 text-sm text-foreground">
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
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-5 h-5 text-destructive" />
                                <span className="font-semibold text-destructive">Estudiante moroso</span>
                              </div>
                              <div className="space-y-3">
                                <p className="text-sm text-foreground">
                                  El estudiante lleva <span className="font-bold">{estudiante.diasRetraso} días</span>{" "}
                                  sin pagar.
                                </p>
                                <div className="space-y-2 text-sm text-foreground">
                                  <p>Monto base: ${estudiante.montoColegiatura.toLocaleString()}</p>
                                  <p>
                                    Penalización ({estudiante.diasRetraso} días × $150): $
                                    {(estudiante.diasRetraso * 150).toLocaleString()}
                                  </p>
                                  <p className="font-bold text-lg text-destructive">
                                    Deuda total: ${calcularMontoPagar(estudiante).toLocaleString()}
                                  </p>
                                </div>
                                <div className="pt-3 border-t border-destructive/20">
                                  <p className="text-sm text-foreground mb-3">
                                    ¿Deseas dar de baja a este estudiante de la escuela?
                                  </p>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDarDeBaja(estudiante)}
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2 text-white" />
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
        </CardContent>
      </Card>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Realizar Pago{selectedPayments.length > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedPayments.length > 0
                ? `Información de pago para ${selectedPayments.length} pago${selectedPayments.length > 1 ? "s" : ""}`
                : "Selecciona un pago para procesar"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {selectedPayments.length === 0 && !selectedPaymentInModal && (
              <Card className="border-2 border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Seleccionar Pago</CardTitle>
                  <CardDescription>Elige un pago pendiente del ciclo escolar activo para procesar</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={handlePaymentSelectionInModal}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar pago..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unpaidPaymentRecords
                        .filter((record) => filteredEstudiantesByCycle.some((e) => e.id === record.studentId))
                        .map((paymentRecord) => (
                          <SelectItem key={paymentRecord.id} value={paymentRecord.id}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <span className="font-medium">{paymentRecord.studentName}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({paymentRecord.paymentType} - {paymentRecord.studentMatricula})
                                </span>
                                <span className="text-xs text-muted-foreground block">
                                  Vence: {paymentRecord.dueDate}
                                </span>
                              </div>
                              <span className="ml-4 font-semibold">${paymentRecord.amount.toLocaleString()}</span>
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
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{paymentRecord.studentName}</span>
                      <Badge
                        className={
                          paymentRecord.status === "Pendiente"
                            ? "bg-transparent text-yellow-800"
                            : paymentRecord.status === "Vencido"
                              ? "bg-transparent text-red-500"
                              : "bg-transparent text-green-800"
                        }
                      >
                        {paymentRecord.status === "Pendiente" && <Clock className="w-4 h-4 mr-1" />}
                        {paymentRecord.status === "Vencido" && <AlertTriangle className="w-4 h-4 mr-1" />}
                        {paymentRecord.status === "Pagado" && <CheckCircle className="w-4 h-4 mr-1" />}
                        {paymentRecord.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {paymentRecord.studentGrade} - Grupo {paymentRecord.studentGroup} |{" "}
                      {paymentRecord.studentMatricula}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">INFORMACIÓN DEL ESTUDIANTE</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Estudiante:</span> {paymentRecord.studentName}
                          </p>
                          <p>
                            <span className="font-medium">Grado:</span> {paymentRecord.studentGrade} - Grupo{" "}
                            {paymentRecord.studentGroup}
                          </p>
                          <p>
                            <span className="font-medium">Matrícula:</span> {paymentRecord.studentMatricula}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">DETALLES DEL PAGO</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Tipo de pago:</span> {paymentRecord.paymentType}
                          </p>
                          <p>
                            <span className="font-medium">Fecha de vencimiento:</span> {paymentRecord.dueDate}
                          </p>
                          <p>
                            <span className="font-medium">Estado:</span> {paymentRecord.status}
                          </p>
                          {paymentRecord.daysLate > 0 && (
                            <p>
                              <span className="font-medium">Días de retraso:</span> {paymentRecord.daysLate}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total a pagar:</span>
                        <span className="text-2xl font-bold text-primary">
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
                  <CardContent className="pt-8 pb-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Costo Total</h3>
                            <p className="text-sm text-slate-600">
                              {getSelectedPaymentsData().length} pago{getSelectedPaymentsData().length > 1 ? "s" : ""}{" "}
                              seleccionado{getSelectedPaymentsData().length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-slate-900 mb-1">
                          $
                          {getSelectedPaymentsData()
                            .reduce((total, payment) => total + payment.amount, 0)
                            .toLocaleString()}
                        </div>
                        <div className="flex items-center justify-end gap-2">
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

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closePaymentModal}>
              Cancelar
            </Button>
            <Button onClick={closePaymentModal} disabled={selectedPayments.length === 0 && !selectedPaymentInModal}>
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
