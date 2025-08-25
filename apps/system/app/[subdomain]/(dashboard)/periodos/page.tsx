"use client";

import { useState, useEffect } from "react"
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Label } from "@repo/ui/components/shadcn/label";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Search, Plus, Edit, Trash2, Calendar } from "@repo/ui/icons";
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../stores/userStore";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel"
// Tipos de datos
interface Term {
  _id: Id<"term">; // El ID de Convex
  _creationTime: number;
  name: string
  key: string
  startDate: number // Cambiado a número (timestamp)
  endDate: number // Cambiado a número (timestamp)
  status: "active" | "inactive" | "closed" // Cambiado a minúsculas
  schoolCycleId: Id<"schoolCycle">;
}

export default function PeriodsManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [schoolCycleFilter, setSchoolCycleFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<Term | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    startDate: "",
    endDate: "",
    status: "active",
    schoolCycleId: "",
  })

  const { user: clerkUser } = useUser();
      const { currentUser } = useUserWithConvex(clerkUser?.id);
      
      // Get current school information using the subdomain
      const {
        currentSchool,
        isLoading: schoolLoading,
      } = useCurrentSchool(currentUser?._id);

  // === INTEGRACIÓN CONVEX ===

  // 1. Obtener los ciclos escolares del backend
  // Asumimos una query para obtener todos los ciclos escolares.
  const schoolCycles = useQuery(api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool ? { escuelaID: currentSchool.school._id } : "skip"
  )

  // 2. Obtener los periodos filtrados por ciclo escolar (luego los filtraremos en el frontend)
   const allTerms = useQuery(
    api.functions.terms.getTermsByCycleId,
    // Pasamos el argumento solo si se selecciona un ciclo escolar
    schoolCycleFilter === "all" ? "skip" : { schoolCycleId: schoolCycleFilter as Id<"schoolCycle"> }
  )

  // 3. Crear los mutators para las operaciones de escritura y eliminación
  const createTerm = useMutation(api.functions.terms.createTerm)
  const updateTerm = useMutation(api.functions.terms.updateTerm)
  const deleteTermMutation = useMutation(api.functions.terms.deleteTerm)


  // 4. Manejar el estado de carga y el ciclo inicial
     useEffect(() => {
    if (schoolCycles && schoolCycles.length > 0 && schoolCycleFilter === "all") {
      // Se corrigió el error usando una variable temporal, lo que satisface a TypeScript.
      const lastCycle = schoolCycles[schoolCycles.length - 1];
      setSchoolCycleFilter(lastCycle!._id as string);
    }
  }, [schoolCycles, schoolCycleFilter]);

  if (allTerms === undefined || schoolLoading || schoolCycles === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando datos...</p>
      </div>
    )
  }

  // === LÓGICA DE FILTRADO EN EL FRONTEND ===
  // Filtramos los datos después de que se cargan de Convex
  const filteredTerms = allTerms.filter((term) => {
    const matchesSearch =
      term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.key.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || term.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // === LÓGICA DE LA INTERFAZ ===

  // Abrir modal para crear/editar
  const openModal = (term?: Term) => {
     if (term) {
      setEditingTerm(term)
      // Corregir el error de tipo: Se asegura que startDate y endDate son números.
      const startDateStr = term.startDate ? new Date(term.startDate).toISOString().split('T')[0] : '';
      const endDateStr = term.endDate ? new Date(term.endDate).toISOString().split('T')[0] : '';
      setFormData({
        name: term.name,
        key: term.key,
        startDate: startDateStr!,
        endDate: endDateStr!,
        status: term.status,
        schoolCycleId: term.schoolCycleId as string,
      })
    } else {
      setEditingTerm(null)
      setFormData({
        name: "",
        key: "",
        startDate: "",
        endDate: "",
        status: "active",
        schoolCycleId: "",
      })
    }
    setIsModalOpen(true)
  }

  // Guardar periodo (crear o actualizar)
  const saveTerm = async () => {
    try {
      // Se desestructuran todos los campos para evitar la advertencia de ESLint
      const { name, key, startDate, endDate, status, schoolCycleId } = formData;
      const startDateTimestamp = new Date(startDate).getTime();
      const endDateTimestamp = new Date(endDate).getTime();

      if (editingTerm) {
        // Actualizar un periodo existente
        await updateTerm({
          termId: editingTerm._id,
          data: {
            name,
            key,
            startDate: startDateTimestamp,
            endDate: endDateTimestamp,
            status: status as "active" | "inactive" | "closed",
          }
        })
      } else {
        // Crear un nuevo periodo
        // Se excluye el campo 'status' ya que el backend lo asigna por defecto
        await createTerm({
          name,
          key,
          startDate: startDateTimestamp,
          endDate: endDateTimestamp,
          schoolCycleId: schoolCycleId as Id<"schoolCycle">,
        })
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error al guardar el periodo:", error)
    }
  }

  // Eliminar periodo
  const handleDeleteTerm = async (id: Id<"term">) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este periodo?")) {
      try {
        await deleteTermMutation({ termId: id })
      } catch (error) {
        console.error("Error al eliminar el periodo:", error)
      }
    }
  }

  // Obtener badge de estado
  const getStatusBadge = (status: Term["status"]) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      closed: "outline",
    } as const
    const displayText = {
        active: "Activo",
        inactive: "Inactivo",
        closed: "Cerrado",
    }
    return <Badge variant={variants[status]}>{displayText[status]}</Badge>
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
                  {editingTerm ? "Editar Periodo" : "Crear Nuevo Periodo"}
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
                <div className="grid grid-cols-2 gap-4">
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
                      {/* Aquí se usa el array de Convex */}
                      {schoolCycles.map((cycle) => (
                        <SelectItem key={cycle._id} value={cycle._id as string}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editingTerm && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={saveTerm} className="flex-1">
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
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={schoolCycleFilter} onValueChange={setSchoolCycleFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filtrar por ciclo escolar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los ciclos</SelectItem>
                  {/* Aquí se usa el array de Convex */}
                  {schoolCycles.map((cycle) => (
                    <SelectItem key={cycle._id} value={cycle._id as string}>
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
                  {filteredTerms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron periodos que coincidan con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTerms.map((term) => (
                      <TableRow key={term._id}>
                        <TableCell className="font-medium">{term.name}</TableCell>
                        <TableCell className="font-mono text-sm">{term.key}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(term.startDate).toLocaleDateString("es-ES")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(term.endDate).toLocaleDateString("es-ES")}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(term.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openModal(term)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTerm(term._id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
