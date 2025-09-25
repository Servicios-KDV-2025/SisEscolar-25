"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@repo/ui/components/shadcn/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Filter, AlertTriangle, CheckCircle, Clock, Search, History, FileText, TrendingUp } from "lucide-react"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@repo/ui/components/shadcn/select"

interface SchoolCycle {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface PaymentConfig {
  id: string
  schoolCycleId: string
  type: string
  amount: number
  startDate: string
  endDate: string
  status: "active" | "inactive"
}

interface PaymentHistory {
  id: string
  studentId: string
  paymentConfigId: string
  status: string
  amount: number
  paidAt: string
  paymentMethod: string
  invoiceId: string
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

const paymentConfigsMock: PaymentConfig[] = [
  {
    id: "1",
    schoolCycleId: "2024-2025",
    type: "Colegiatura Mensual",
    amount: 2500,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "active",
  },
  {
    id: "2",
    schoolCycleId: "2024-2025",
    type: "Inscripción",
    amount: 5000,
    startDate: "2024-08-01",
    endDate: "2024-08-31",
    status: "active",
  },
  {
    id: "3",
    schoolCycleId: "2024-2025",
    type: "Material Escolar",
    amount: 1200,
    startDate: "2024-08-15",
    endDate: "2024-09-15",
    status: "inactive",
  },
  {
    id: "4",
    schoolCycleId: "2024-2025",
    type: "Seguro Escolar",
    amount: 800,
    startDate: "2024-09-01",
    endDate: "2024-09-30",
    status: "active",
  },
  {
    id: "5",
    schoolCycleId: "2023-2024",
    type: "Colegiatura Mensual",
    amount: 2300,
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    status: "inactive",
  },
]

const paymentHistoryMock: PaymentHistory[] = [
  {
    id: "1",
    studentId: "EST001",
    paymentConfigId: "1",
    status: "Pagado",
    amount: 2500,
    paidAt: "2024-01-05",
    paymentMethod: "Transferencia Bancaria",
    invoiceId: "INV-2024-001",
  },
  {
    id: "2",
    studentId: "EST002",
    paymentConfigId: "1",
    status: "Pendiente",
    amount: 2500,
    paidAt: "",
    paymentMethod: "Efectivo",
    invoiceId: "INV-2024-002",
  },
  {
    id: "3",
    studentId: "EST003",
    paymentConfigId: "2",
    status: "Pagado",
    amount: 5000,
    paidAt: "2024-08-15",
    paymentMethod: "Tarjeta de Crédito",
    invoiceId: "INV-2024-003",
  },
  {
    id: "4",
    studentId: "EST004",
    paymentConfigId: "1",
    status: "Pagado",
    amount: 2500,
    paidAt: "2024-01-03",
    paymentMethod: "Transferencia Bancaria",
    invoiceId: "INV-2024-004",
  },
  {
    id: "5",
    studentId: "EST005",
    paymentConfigId: "3",
    status: "Vencido",
    amount: 1200,
    paidAt: "",
    paymentMethod: "Efectivo",
    invoiceId: "INV-2024-005",
  },
]

interface PaymentHistoryProps {
  selectedSchoolCycle: string
  setSelectedSchoolCycle: (cycle: string) => void
}

export default function PaymentHistoryComponent({ selectedSchoolCycle, setSelectedSchoolCycle }: PaymentHistoryProps) {
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string | null>(null)
  const [historyStartDateFilter, setHistoryStartDateFilter] = useState<string>("")
  const [historyEndDateFilter, setHistoryEndDateFilter] = useState<string>("")

  const totalPayments = paymentHistoryMock.length
  const paidPayments = paymentHistoryMock.filter((p) => p.status === "Pagado").length
  const pendingPayments = paymentHistoryMock.filter((p) => p.status === "Pendiente").length
  const overduePayments = paymentHistoryMock.filter((p) => p.status === "Vencido").length
  const totalAmountCollected = paymentHistoryMock
    .filter((p) => p.status === "Pagado")
    .reduce((sum, p) => sum + p.amount, 0)

  const filteredHistory = paymentHistoryMock.filter((payment) => {
    const matchesSearch =
      payment.studentId.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      payment.invoiceId.toLowerCase().includes(historySearchTerm.toLowerCase())
    const matchesStatus = !historyStatusFilter || payment.status === historyStatusFilter

    // Get payment config to check date range
    const paymentConfig = paymentConfigsMock.find((config) => config.id === payment.paymentConfigId)
    const matchesStartDate =
      !historyStartDateFilter || !paymentConfig || paymentConfig.startDate >= historyStartDateFilter
    const matchesEndDate = !historyEndDateFilter || !paymentConfig || paymentConfig.endDate <= historyEndDateFilter

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
  })

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Pagado":
        return (
          <Badge className="bg-transparent text-green-800">
            <CheckCircle className="w-4 h-4 mr-1 text-green-800" />
            Pagado
          </Badge>
        )
      case "Pendiente":
        return (
          <Badge className="bg-transparent text-yellow-800">
            <Clock className="w-4 h-4 mr-1 text-yellow-800" />
            Pendiente
          </Badge>
        )
      case "Vencido":
        return (
          <Badge className="bg-transparent text-red-500">
            <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
            Vencido
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Total de Pagos</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <History className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{totalPayments}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Pagos Completados</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{paidPayments}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Pagos Pendientes</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{pendingPayments + overduePayments}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Total Recaudado</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-lg lg:text-3xl font-bold">${totalAmountCollected.toLocaleString()}</div>
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
              <CardDescription>Encuentra pagos por estudiante, factura, estado o rango de fechas.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por estudiante o factura..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
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
                <Select
                  onValueChange={(v) => setHistoryStatusFilter(v === "all" ? null : v)}
                  value={historyStatusFilter || ""}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filtrar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pagado">Pagados</SelectItem>
                    <SelectItem value="Pendiente">Pendientes</SelectItem>
                    <SelectItem value="Vencido">Vencidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Fecha de inicio (desde):</label>
                <Input
                  type="date"
                  value={historyStartDateFilter}
                  onChange={(e) => setHistoryStartDateFilter(e.target.value)}
                  placeholder="Fecha de inicio"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Fecha de fin (hasta):</label>
                <Input
                  type="date"
                  value={historyEndDateFilter}
                  onChange={(e) => setHistoryEndDateFilter(e.target.value)}
                  placeholder="Fecha de fin"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Pagos
          </CardTitle>
          <CardDescription>Consulta el historial completo de pagos realizados por los estudiantes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Config. Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha de Pago</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Factura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.studentId}</TableCell>
                  <TableCell>{payment.paymentConfigId}</TableCell>
                  <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                  <TableCell>${payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{payment.paidAt || "N/A"}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {payment.invoiceId}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
