"use client"

import { useState } from "react"
import { Button } from "@repo/ui/components/shadcn/button"
import { Input } from "@repo/ui/components/shadcn/input"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/shadcn/dialog"
import { Label } from "@repo/ui/components/shadcn/label"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Search, Plus, Edit, Trash2, Calendar} from "@repo/ui/icons"

// Tipos de datos
interface Period {
  id: string
  name: string
  key: string
  startDate: string
  endDate: string
  status: "Activo" | "Inactivo" | "Cerrado"
  schoolCycleId: string
}

interface SchoolCycle {
  id: string
  name: string
}

// Datos de ejemplo
const mockPeriods: Period[] = [
  {
    id: "1",
    name: "Primer Bimestre",
    key: "BIM1-2024",
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    status: "Activo",
    schoolCycleId: "cycle1",
  },
  {
    id: "2",
    name: "Segundo Bimestre",
    key: "BIM2-2024",
    startDate: "2024-03-16",
    endDate: "2024-05-15",
    status: "Inactivo",
    schoolCycleId: "cycle1",
  },
  {
    id: "3",
    name: "Tercer Bimestre",
    key: "BIM3-2024",
    startDate: "2024-05-16",
    endDate: "2024-07-15",
    status: "Cerrado",
    schoolCycleId: "cycle1",
  },
]

const mockSchoolCycles: SchoolCycle[] = [
  { id: "cycle1", name: "Ciclo Escolar 2024-2025" },
  { id: "cycle2", name: "Ciclo Escolar 2023-2024" },
]

export default function PeriodsManagement() {
  const [periods, setPeriods] = useState<Period[]>(mockPeriods)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [schoolCycleFilter, setSchoolCycleFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    startDate: "",
    endDate: "",
    status: "Activo" as Period["status"],
    schoolCycleId: "",
  })

  // Filtrar periodos
  const filteredPeriods = periods.filter((period) => {
    const matchesSearch =
      period.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      period.key.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || period.status === statusFilter
    const matchesSchoolCycle = schoolCycleFilter === "all" || period.schoolCycleId === schoolCycleFilter
    return matchesSearch && matchesStatus && matchesSchoolCycle
  })

  // Abrir modal para crear/editar
  const openModal = (period?: Period) => {
    if (period) {
      setEditingPeriod(period)
      setFormData({
        name: period.name,
        key: period.key,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        schoolCycleId: period.schoolCycleId,
      })
    } else {
      setEditingPeriod(null)
      setFormData({
        name: "",
        key: "",
        startDate: "",
        endDate: "",
        status: "Activo",
        schoolCycleId: "",
      })
    }
    setIsModalOpen(true)
  }

  // Guardar periodo
  const savePeriod = () => {
    if (editingPeriod) {
      // Editar periodo existente
      setPeriods(periods.map((p) => (p.id === editingPeriod.id ? { ...editingPeriod, ...formData } : p)))
    } else {
      // Crear nuevo periodo
      const newPeriod: Period = {
        id: Date.now().toString(),
        ...formData,
      }
      setPeriods([...periods, newPeriod])
    }
    setIsModalOpen(false)
  }

  // Eliminar periodo
  const deletePeriod = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este periodo?")) {
      setPeriods(periods.filter((p) => p.id !== id))
    }
  }

  // Obtener badge de estado
  const getStatusBadge = (status: Period["status"]) => {
    const variants = {
      Activo: "default",
      Inactivo: "secondary",
      Cerrado: "outline",
    } as const

    return <Badge variant={variants[status]}>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif text-foreground">Gestión de Periodos</h1>
            <p className="text-muted-foreground mt-1">Administra los periodos académicos del sistema escolar</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openModal()} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear nuevo periodo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">
                  {editingPeriod ? "Editar Periodo" : "Crear Nuevo Periodo"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del periodo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Primer Bimestre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key">Clave del periodo</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="Ej: BIM1-2024"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha de fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolCycle">Ciclo escolar</Label>
                  <Select
                    value={formData.schoolCycleId}
                    onValueChange={(value) => setFormData({ ...formData, schoolCycleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un ciclo escolar" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSchoolCycles.map((cycle) => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editingPeriod && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Period["status"]) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                        <SelectItem value="Cerrado">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button onClick={savePeriod} className="flex-1">
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o clave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                  <SelectItem value="Cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={schoolCycleFilter} onValueChange={setSchoolCycleFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filtrar por ciclo escolar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los ciclos</SelectItem>
                  {mockSchoolCycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de periodos */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Periodos Académicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Clave</TableHead>
                    <TableHead>Fecha de inicio</TableHead>
                    <TableHead>Fecha de fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeriods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">{period.name}</TableCell>
                      <TableCell className="font-mono text-sm">{period.key}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(period.startDate).toLocaleDateString("es-ES")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(period.endDate).toLocaleDateString("es-ES")}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(period.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openModal(period)} className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePeriod(period.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredPeriods.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron periodos que coincidan con los filtros aplicados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
