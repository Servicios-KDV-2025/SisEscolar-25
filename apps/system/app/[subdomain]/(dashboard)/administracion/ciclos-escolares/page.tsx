"use client";

import { useUser } from "@clerk/nextjs";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { useState, useEffect, useMemo } from "react";
import { SchoolCycleCard } from "../../../../../components/SchoolCycleCard";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Filter,
  Plus,
  Search,
  XCircle,
} from "@repo/ui/icons";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import {
  CicloEscolar,
  useCicloEscolarWithConvex,
} from "stores/useSchoolCiclesStore";
import {
  CrudDialog,
  useCrudDialog,
  WithId,
} from "@repo/ui/components/dialog/crud-dialog";
import { cicloEscolarSchema } from "@/types/shoolCycles";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/shadcn/form";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { usePermissions } from "../../../../../hooks/usePermissions";
import NotAuth from "../../../../../components/NotAuth";
import { useCrudToastMessages } from "../../../../../hooks/useCrudToastMessages";
import { GeneralDashboardSkeleton } from "../../../../../components/skeletons/GeneralDashboardSkeleton";


export default function SchoolCyclesPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(
    clerkUser?.id
  );
  const [cycles, setCycles] = useState<CicloEscolar[]>([]);
  const [filteredCycles, setFilteredCycles] = useState<CicloEscolar[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "archived" | "inactive"
  >("all");
  const [duplicateNameError, setDuplicateNameError] = useState<string | null>(
    null
  );

  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(
    currentUser?._id
  );

  const {
    canCreateSchoolCycle,
    canReadSchoolCycle,
    canUpdateSchoolCycle,
    canDeleteSchoolCycle,
  } = usePermissions(currentSchool?.school._id);

  const isLoading = !isLoaded || userLoading || schoolLoading;

  const {
    ciclosEscolares,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
    createCicloEscolar,
    updateCicloEscolar,
    deleteCicloEscolar,
    clearErrors,
  } = useCicloEscolarWithConvex(currentSchool?.school._id);

  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
  } = useCrudDialog(cicloEscolarSchema, {
    name: "",
    startDate: "",
    endDate: "",
    status: "inactive",
  });

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Ciclo Escolar");

  const validateUniqueName = (name: string, currentId?: string) => {
    const normalizedName = name.trim().toLowerCase();
    return !ciclosEscolares.some(
      (cycle) =>
        cycle.name.toLowerCase() === normalizedName && cycle._id !== currentId
    );
  };

  // Funciones adaptadoras para los tipos
  const handleOpenEdit = (ciclo: CicloEscolar) => {
    openEdit(ciclo as unknown as Record<string, unknown> & Partial<WithId>);
  };

  const handleOpenView = (ciclo: CicloEscolar) => {
    openView(ciclo as unknown as Record<string, unknown> & Partial<WithId>);
  };

  const handleOpenDelete = (ciclo: CicloEscolar) => {
    openDelete(ciclo as unknown as Record<string, unknown> & Partial<WithId>);
  };

  const handleClose = () => {
    setDuplicateNameError(null);
    close();
  };

  const handleDelayedClose = () => {
    setDuplicateNameError(null);
    setTimeout(() => {
      close();
    }, 1000);
  };

  // Función para formatear el timestamp al formato YYYY-MM-DD
  const formatTimestampToInputDate = (timestamp: number | undefined) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      // Ajuste para la zona horaria local para evitar errores de un día
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
      return adjustedDate.toISOString().split("T")[0];
    } catch (_error) {
      return _error instanceof Error ? _error.message : String(_error);
    }
  };

  // Prepara los datos para el diálogo, convirtiendo las fechas.
  const dialogData = useMemo(() => {
    if (!data) {
      return undefined;
    }
    return {
      ...data,
      startDate: formatTimestampToInputDate(data.startDate as number),
      endDate: formatTimestampToInputDate(data.endDate as number),
    };
  }, [data]);

  useEffect(() => {
    setCycles(ciclosEscolares);
    setFilteredCycles(ciclosEscolares);
  }, [ciclosEscolares]);

  useEffect(() => {
    let filtered = cycles;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((cycle) =>
        cycle.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((cycle) => cycle.status === statusFilter);
    }

    setFilteredCycles(filtered);
  }, [cycles, searchTerm, statusFilter]);

  // Limpiar errores cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      setDuplicateNameError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school._id) {
      return;
    }
    if (!validateUniqueName(values.name as string, data?._id as string)) {
      setDuplicateNameError("Ya existe un ciclo escolar con este nombre");
      return;
    }
    try {
      if (operation === "create") {
        await createCicloEscolar({
          schoolId: currentSchool.school._id,
          name: values.name as string,
          startDate: new Date(values.startDate as string).getTime(),
          endDate: new Date(values.endDate as string).getTime(),
          status: values.status as "active" | "archived" | "inactive",
        });
        handleDelayedClose();
      } else if (operation === "edit" && data?._id) {
        await updateCicloEscolar({
          cicloEscolarID: data._id as Id<"schoolCycle">,
          schoolId: currentSchool.school._id,
          name: values.name as string,
          startDate: new Date(values.startDate as string).getTime(),
          endDate: new Date(values.endDate as string).getTime(),
          status: values.status as "active" | "archived" | "inactive",
        });
        handleDelayedClose();
      }
    } catch (error) {
      console.error("Error al enviar datos:", error);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCicloEscolar(id as Id<"schoolCycle">);
  };

  if (isLoading) {
    return <GeneralDashboardSkeleton nc={3} />;
  }

  return (
    <>
      {canReadSchoolCycle ? (
        <div className="space-y-8 p-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight">
                        Ciclos Escolares
                      </h1>
                      <p className="text-lg text-muted-foreground">
                        Administra los ciclos escolares registrados
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mostrar errores del store de ciclos */}
          {(createError ||
            updateError ||
            deleteError ||
            duplicateNameError) && (
              <div className="space-y-4">
                {createError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error al crear el ciclo: {createError}
                    </AlertDescription>
                  </Alert>
                )}
                {updateError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error al actualizar el ciclo: {updateError}
                    </AlertDescription>
                  </Alert>
                )}
                {deleteError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error al eliminar el ciclo: {deleteError}
                    </AlertDescription>
                  </Alert>
                )}
                {duplicateNameError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error de validación: {duplicateNameError}
                    </AlertDescription>
                  </Alert>
                )}
                <button
                  onClick={() => {
                    clearErrors();
                    setDuplicateNameError(null);
                  }}
                  className="text-xs text-blue-500 underline mt-1"
                >
                  Limpiar errores
                </button>
              </div>
            )}

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Ciclos Escolares
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">{cycles.length || 0}</div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Activos
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">
                  {cycles?.filter((g) => g.status === "active").length || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inactivos
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <XCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">
                  {cycles?.filter((g) => g.status === "inactive").length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y búsqueda */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros y Búsqueda
                  </CardTitle>
                  <CardDescription>
                    Encuentra los cliclos escolares por nombre, activos,
                    archivados o inactivos
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
                      placeholder="Buscar ciclos escolares..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(
                      value: "all" | "active" | "archived" | "inactive"
                    ) => setStatusFilter(value)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="archived">Archivado</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Ciclos Escolares */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>
                <div className="flex flex-col gap-2">
                  <span>Lista de Ciclos Escolares</span>
                    {canCreateSchoolCycle && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 w-fit">
                        {filteredCycles.length} ciclos escolares
                      </Badge>
                    )}
                </div>
              </CardTitle>
              {canCreateSchoolCycle ? (
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={openCreate}
                    disabled={isCreating}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Ciclo Escolar
                  </Button>
                ) : canReadSchoolCycle ? (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 w-fit">
                    {filteredCycles.length} ciclos escolares
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <GeneralDashboardSkeleton nc={3} />
              ) : filteredCycles.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No se encontraron ciclos escolares
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Intenta ajustar los filtros o no hay ciclos escolares
                    registrados.
                  </p>
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={openCreate}
                    disabled={isCreating}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Ciclo Escolar
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-9">
                  {filteredCycles.map((cycle) => (
                    <SchoolCycleCard
                      key={cycle._id}
                      ciclo={cycle}
                      isUpdating={isUpdating}
                      isDeleting={isDeleting}
                      openEdit={handleOpenEdit}
                      openView={handleOpenView}
                      openDelete={handleOpenDelete}
                      canUpdateSchoolCycle={canUpdateSchoolCycle}
                      canDeleteSchoolCycle={canDeleteSchoolCycle}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* CrudDialog */}
          <CrudDialog
            operation={operation}
            title={
              operation === "create"
                ? "Crear Nuevo Ciclo Escolar"
                : operation === "edit"
                  ? "Editar Ciclo Escolar"
                  : "Ver Ciclo Escolar"
            }
            description={
              operation === "create"
                ? "Completa la información del nuevo ciclo escolar"
                : operation === "edit"
                  ? "Modifica la información del ciclo escolar"
                  : "Información del ciclo escolar"
            }
            schema={cicloEscolarSchema}
            defaultValues={{
              name: "",
              startDate: "",
              endDate: "",
              status: "inactive",
            }}
            data={dialogData}
            isOpen={isOpen}
            onOpenChange={handleClose}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            toastMessages={toastMessages}
            disableDefaultToasts={false}
          >
            {(form, operation) => (
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Ciclo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Ciclo Escolar 2024-2025"
                          value={(field.value as string) || ""}
                          onChange={(e) => {
                            field.onChange(e);
                            // Limpiar errores cuando el usuario empiece a escribir
                            if (form.formState.errors.name) {
                              form.clearErrors("name");
                            }
                            setDuplicateNameError(null);
                          }}
                          onBlur={() => {
                            if (
                              field.value &&
                              !validateUniqueName(
                                field.value as string,
                                data?._id as string
                              )
                            ) {
                              setDuplicateNameError(
                                "Ya existe un ciclo escolar con este nombre"
                              );
                            } else {
                              setDuplicateNameError(null);
                            }
                          }}
                          disabled={operation === "view"}
                        />
                      </FormControl>
                      {/* Solo mostrar el texto de ayuda si no hay errores de validación */}
                      {!form.formState.errors.name && !duplicateNameError && (
                        <div className="text-sm text-muted-foreground">
                          El máximo de caracteres es de 50
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={(field.value as string) || ""}
                          onChange={(e) => {
                            field.onChange(e);
                            // Limpiar errores de fecha cuando cambie
                            if (form.formState.errors.startDate) {
                              form.clearErrors("startDate");
                            }
                            // Limpiar error de refinamiento si existe
                            if (form.formState.errors.endDate) {
                              form.clearErrors("endDate");
                            }
                          }}
                          disabled={operation === "view"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Fin</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={(field.value as string) || ""}
                          onChange={(e) => {
                            field.onChange(e);
                            // Limpiar errores de fecha cuando cambie
                            if (form.formState.errors.endDate) {
                              form.clearErrors("endDate");
                            }
                          }}
                          disabled={operation === "view"}
                        />
                      </FormControl>
                      {/* Solo mostrar el texto de ayuda si no hay errores de validación */}
                      {!form.formState.errors.endDate && (
                        <div className="text-sm text-muted-foreground">
                          El ciclo debe durar mínimo 28 días y máximo 5 años
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Limpiar errores de status cuando cambie
                          if (form.formState.errors.status) {
                            form.clearErrors("status");
                          }
                        }}
                        value={field.value as string}
                        disabled={operation === "view"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="archived">Archivado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CrudDialog>
        </div>
      ) : (
        <NotAuth
          pageName="Ciclos Escolares"
          pageDetails="Administra los ciclos escolares registrados"
          icon={Calendar}
        />
      )}
    </>
  );
}
