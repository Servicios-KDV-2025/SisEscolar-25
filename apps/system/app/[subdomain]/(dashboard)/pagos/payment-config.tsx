"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@repo/ui/components/shadcn/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Filter, AlertTriangle, CheckCircle, DollarSign, Search, Settings, Calendar } from "lucide-react"
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

interface PaymentConfigProps {
  selectedSchoolCycle: string
  setSelectedSchoolCycle: (cycle: string) => void
}

export default function PaymentConfig({ selectedSchoolCycle, setSelectedSchoolCycle }: PaymentConfigProps) {
  const [configSearchTerm, setConfigSearchTerm] = useState("")
  const [configTypeFilter, setConfigTypeFilter] = useState<string | null>(null)
  const [configStatusFilter, setConfigStatusFilter] = useState<string | null>(null)

  const filteredConfigsByCycle = paymentConfigsMock.filter((config) => config.schoolCycleId === selectedSchoolCycle)

  const totalConfigs = filteredConfigsByCycle.length
  const activeConfigs = filteredConfigsByCycle.filter((config) => config.status === "active").length
  const inactiveConfigs = filteredConfigsByCycle.filter((config) => config.status === "inactive").length
  const totalConfigAmount = filteredConfigsByCycle.reduce((sum, config) => sum + config.amount, 0)

  const filteredConfigs = filteredConfigsByCycle.filter((config) => {
    const matchesSearch =
      config.type.toLowerCase().includes(configSearchTerm.toLowerCase()) ||
      config.schoolCycleId.toLowerCase().includes(configSearchTerm.toLowerCase())
    const matchesType = !configTypeFilter || config.type === configTypeFilter
    const matchesStatus = !configStatusFilter || config.status === configStatusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const uniquePaymentTypes = [...new Set(filteredConfigsByCycle.map((config) => config.type))]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ciclo Escolar
          </CardTitle>
          <CardDescription>Selecciona el ciclo escolar para ver las configuraciones correspondientes.</CardDescription>
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
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
              Total Configuraciones
            </CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Settings className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{totalConfigs}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
              Configuraciones Activas
            </CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{activeConfigs}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
              Configuraciones Inactivas
            </CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{inactiveConfigs}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
              Monto Total Configurado
            </CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-lg lg:text-3xl font-bold">${totalConfigAmount.toLocaleString()}</div>
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
              <CardDescription>Encuentra configuraciones por tipo de pago, estado o ciclo escolar.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por tipo de pago..."
                    value={configSearchTerm}
                    onChange={(e) => setConfigSearchTerm(e.target.value)}
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
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <Select onValueChange={(v) => setConfigTypeFilter(v === "all" ? null : v)} value={configTypeFilter || ""}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar tipo de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {uniquePaymentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={(v) => setConfigStatusFilter(v === "all" ? null : v)}
                value={configStatusFilter || ""}
              >
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="Filtrar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Pagos
          </CardTitle>
          <CardDescription>Administra los tipos de pagos, montos y fechas para el ciclo escolar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ciclo Escolar</TableHead>
                <TableHead>Tipo de Pago</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfigs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">{config.schoolCycleId}</TableCell>
                  <TableCell>{config.type}</TableCell>
                  <TableCell>${config.amount.toLocaleString()}</TableCell>
                  <TableCell>{config.startDate}</TableCell>
                  <TableCell>{config.endDate}</TableCell>
                  <TableCell>
                    {config.status === "active" ? (
                      <Badge className="bg-transparent text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1 text-green-800" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="bg-transparent text-red-500">
                        <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                        Inactivo
                      </Badge>
                    )}
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
