//ciclos escolares 
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
import { useUser } from "@clerk/nextjs";
import { Id } from '../../../../../../packages/convex/convex/_generated/dataModel';

// Funciones auxiliares para formato y estado de las tarjetas
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
};

const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Activo";
    case "archived":
      return "Archivado";
    case "inactive":
      return "Inactivo";
    default:
      return "Desconocido";
  }
};

const formatDate = (timestamp: number) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function SchoolCyclesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const { user, isLoaded: isClerkLoaded } = useUser();
  const userId = user?.publicMetadata?.userId as Id<"user">;

  const { currentSchool, isLoading: isSchoolLoading } = useCurrentSchool(userId);
  const schoolId = currentSchool?.school._id;

  const {
    ciclosEscolares,
    isLoading,
    error,
    createCicloEscolar,
    deleteCicloEscolar,
    clearError,
    setSelectedCiclo
  } = useCicloEscolarWithConvex();

  const filteredCycles = (ciclosEscolares || []).filter((cycle) => {
    if (!cycle?.name) return false;
    const matchesSearch = cycle.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cycle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateCycle = async () => {
    if (!schoolId) {
      console.error("No hay escuela seleccionada");
      return;
    }

    try {
      const newCycleData = {
        escuelaID: schoolId,
        nombre: "Nuevo Ciclo Escolar",
        fechaInicio: Date.now(),
        fechaFin: Date.now() + (365 * 24 * 60 * 60 * 1000),
        status: "inactive" as const,
      };

      console.log("Creando ciclo con datos:", newCycleData);
      const success = await createCicloEscolar(newCycleData);
      
      if (success) {
        console.log("Ciclo creado exitosamente");
      } else {
        console.error("No se pudo crear el ciclo escolar");
      }
    } catch (error) {
      console.error("Error al crear ciclo:", error);
    }
  };

  const handleDeleteCycle = async (cycleId: Id<"schoolCycle">) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ciclo escolar?")) {
      try {
        await deleteCicloEscolar(cycleId);
        console.log("Ciclo eliminado exitosamente");
      } catch (error) {
        console.error("Error al eliminar ciclo:", error);
      }
    }
  };

  const handleEditCycle = (cycle: any) => {
    setSelectedCiclo(cycle);
    console.log("Editando ciclo:", cycle);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Nuevo useEffect para manejar el estado de acceso de la escuela
  useEffect(() => {
    if (isClerkLoaded && !isSchoolLoading) {
      // Si la carga ha terminado y no se encontró una escuela, muestra el mensaje de error.
      if (!currentSchool) {
        setAccessDeniedMessage("No se pudo cargar la información de la escuela. Por favor, verifica que tengas acceso a esta escuela.");
      } else {
        // Si la escuela se cargó correctamente, borra el mensaje de error.
        setAccessDeniedMessage(null);
      }
    }
  }, [isClerkLoaded, isSchoolLoading, currentSchool]);

  useEffect(() => {
    console.log("Estado actual:", {
      userId,
      schoolId,
      isSchoolLoading,
      ciclosEscolares: ciclosEscolares?.length || 0,
      isLoading,
      error,
      currentSchool: currentSchool?.school?.name
    });
  }, [userId, schoolId, isSchoolLoading, ciclosEscolares, isLoading, error, currentSchool]);

  // Si Clerk aún no ha cargado
  if (!isClerkLoaded) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando información del usuario...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si la información de la escuela está cargando
  if (isSchoolLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando información de la escuela...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si hay un mensaje de acceso denegado (el estado final)
  if (accessDeniedMessage) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              {accessDeniedMessage}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
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
              {currentSchool?.school?.name ? `Gestiona los períodos académicos de ${currentSchool.school.name}` : 'Cargando datos de la escuela...'}
            </p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={handleCreateCycle}
            disabled={!schoolId || isLoading} 
          >
            <Plus className="h-4 w-4" />
            {isLoading ? "Creando..." : "Nuevo Ciclo"}
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
              Todos ({ciclosEscolares?.length || 0})
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Activos ({ciclosEscolares?.filter(c => c.status === 'active').length || 0})
            </Button>
            <Button
              variant={statusFilter === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("archived")}
            >
              Archivados ({ciclosEscolares?.filter(c => c.status === 'archived').length || 0})
            </Button>
            <Button
              variant={statusFilter === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("inactive")}
            >
              Inactivos ({ciclosEscolares?.filter(c => c.status === 'inactive').length || 0})
            </Button>
          </div>
        </div>

        {/* Cards Grid o estado de carga */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Cargando ciclos escolares...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCycles.map((cycle) => (
                <Card key={cycle._id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg leading-tight">{cycle.name}</CardTitle>
                        <CardDescription className="text-sm">
                          Escuela: {currentSchool?.school?.name || 'Cargando...'}
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
            {filteredCycles.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron ciclos escolares</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Comienza creando tu primer ciclo escolar"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={handleCreateCycle} disabled={!schoolId || isLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isLoading ? "Creando..." : "Crear Primer Ciclo"}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}