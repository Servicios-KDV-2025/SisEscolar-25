"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { CalendarDays, GraduationCap, Search, Plus, MoreHorizontal } from "@repo/ui/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/shadcn/dropdown-menu";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import { useCicloEscolarWithConvex } from "../../../../stores/useCicloEscolarStore";
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 hover:bg-green-200"
    case "archived":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    case "inactive":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Activo"
    case "archived":
      return "Archivado"
    case "inactive":
      return "Inactivo"
    default:
      return status
  }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function SchoolCyclesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Obtener la escuela actual del usuario
  const { currentSchool } = useCurrentSchool()

  // Usar el hook que combina Zustand con Convex
  const {
    ciclosEscolares,
    isLoading,
    error,
    createCicloEscolar,
    deleteCicloEscolar,
    clearError,
    setSelectedCiclo
  } = useCicloEscolarWithConvex(currentSchool?.school._id)

  // Filtrar ciclos basado en búsqueda y estado
  const filteredCycles = ciclosEscolares.filter((cycle) => {
    const matchesSearch = cycle.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || cycle.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Manejar creación de nuevo ciclo
  const handleCreateCycle = async () => {
    if (!currentSchool) {
      console.error("No hay escuela seleccionada");
      return;
    }

    // Aquí podrías abrir un modal o formulario
    // Por ahora solo simulamos la creación
    const newCycleData = {
      escuelaID: currentSchool.school._id,
      nombre: "Nuevo Ciclo Escolar",
      fechaInicio: Date.now(),
      fechaFin: Date.now() + (365 * 24 * 60 * 60 * 1000), // Un año después
      status: "inactive" as const,
    }
    
    const success = await createCicloEscolar(newCycleData)
    if (success) {
      // Éxito - podrías mostrar un toast o notificación
      console.log("Ciclo creado exitosamente")
    }
  }

  // Manejar eliminación de ciclo
 const handleDeleteCycle = async (cycleId: typeof ciclosEscolares[0]['_id']) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ciclo escolar?")) {
      const success = await deleteCicloEscolar(cycleId)
      if (success) {
        console.log("Ciclo eliminado exitosamente")
      }
    }
  }

  // Manejar selección de ciclo para editar
  const handleEditCycle = (cycle: typeof ciclosEscolares[0]) => {
    setSelectedCiclo(cycle)
    // Aquí podrías abrir un modal de edición
    console.log("Editando ciclo:", cycle)
  }

  // Limpiar errores cuando el componente se monta
  useEffect(() => {
    if (error) {
      // Opcional: limpiar error después de un tiempo
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  if (isLoading || !currentSchool) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {!currentSchool ? "Cargando información de la escuela..." : "Cargando ciclos escolares..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-2 h-auto p-1"
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              Ciclos Escolares
            </h1>
            <p className="text-muted-foreground">
              Gestiona los períodos académicos de tu institución ({ciclosEscolares.length} ciclos)
            </p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={handleCreateCycle}
          >
            <Plus className="h-4 w-4" />
            Nuevo Ciclo
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar ciclos escolares..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Todos ({ciclosEscolares.length})
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Activos ({ciclosEscolares.filter(c => c.status === 'active').length})
            </Button>
            <Button
              variant={statusFilter === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("archived")}
            >
              Archivados ({ciclosEscolares.filter(c => c.status === 'archived').length})
            </Button>
            <Button
              variant={statusFilter === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("inactive")}
            >
              Inactivos ({ciclosEscolares.filter(c => c.status === 'inactive').length})
            </Button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCycles.map((cycle) => (
            <Card key={cycle._id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg leading-tight">{cycle.name}</CardTitle>
                    <CardDescription className="text-sm">
                      Escuela: {currentSchool?.school.name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(cycle.status)}>
                      {getStatusText(cycle.status)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCycle(cycle)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log('Duplicando:', cycle._id)}>
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteCycle(cycle._id)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dates */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Inicio:</span>
                    <span className="font-medium">{formatDate(cycle.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fin:</span>
                    <span className="font-medium">{formatDate(cycle.endDate)}</span>
                  </div>
                </div>

                {/* Duration and metadata */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Duración:</span>
                    <span className="font-medium">
                      {Math.ceil((cycle.endDate - cycle.startDate) / (1000 * 60 * 60 * 24 * 30))} meses
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">Creado:</span>
                    <span className="font-medium">{formatDate(cycle.createdAt)}</span>
                  </div>
                  {cycle.updatedAt && (
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-muted-foreground">Actualizado:</span>
                      <span className="font-medium">{formatDate(cycle.updatedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 bg-transparent"
                    onClick={() => console.log('Ver detalles:', cycle._id)}
                  >
                    Ver Detalles
                  </Button>
                  {cycle.status === "active" && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => console.log('Gestionar:', cycle._id)}
                    >
                      Gestionar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCycles.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron ciclos escolares</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza creando tu primer ciclo escolar"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button onClick={handleCreateCycle}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Ciclo
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}