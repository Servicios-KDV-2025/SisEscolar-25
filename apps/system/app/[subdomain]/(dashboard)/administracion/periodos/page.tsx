"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { toast } from '@repo/ui/sonner'
import { UseFormReturn } from "react-hook-form";

// UI Components
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form"; // FormDescription se comenta 3Dic
import { usePermissions } from "../../../../../hooks/usePermissions";
import NotAuth from "../../../../../components/NotAuth";
import { useCrudToastMessages } from "../../../../../hooks/useCrudToastMessages";

// Icons
import {
  Search, Plus, Filter, Eye, Pencil, Trash2, Calendar,
  AlertCircle, CheckCircle, XCircle
} from "@repo/ui/icons";

// Local imports
import { termSchema, TermFormValues } from "schema/terms";
import { useTerm, Term } from "stores/termStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import { GeneralDashboardSkeleton } from "components/skeletons/GeneralDashboardSkeleton";
import CrudFields, { TypeFields } from '@repo/ui/components/dialog/crud-fields';

// Form Component
function TermForm({
  form,
  operation,
  schoolCycles
}: {
  form: UseFormReturn<Record<string, unknown>>;
  operation: "create" | "edit" | "view" | "delete";
  schoolCycles: Array<{
    _id: string;
    name: string;
  }>;
}) {
  // Preparar opciones para schoolCycleId
  const schoolCycleOptions = schoolCycles?.map(cycle => ({
    value: cycle._id,
    label: cycle.name
  })) || [];

  // Definir campos para CrudFields
  const crudFields1: TypeFields = [
    {
      name: 'name',
      label: 'Nombre del periodo',
      type: 'text',
      placeholder: 'Ej: Primer Bimestre',
      maxLength: 50,
      required: true
    },
    {
      name: 'key',
      label: 'Clave del periodo',
      type: 'text',
      placeholder: 'Ej: BIM1-2024',
      maxLength: 10,
      required: true
    },
  ];

  const crudFields2: TypeFields = [
    {
      name: 'schoolCycleId',
      label: 'Ciclo Escolar',
      type: 'select',
      options: schoolCycleOptions,
      placeholder: 'Selecciona un ciclo escolar',
      required: true
    },
  ];

  // Solo agregar status si no es creación
  if (operation !== "create") {
    crudFields2.push({
      name: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
        { value: 'closed', label: 'Cerrado' }
      ],
      placeholder: 'Selecciona un estado',
      required: true
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <CrudFields
        fields={crudFields1}
        operation={operation}
        form={form}
      />

      <FormField
        control={form.control}
        name="startDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de inicio</FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
                value={field.value as string || ""}
                disabled={operation === "view"}
              />
            </FormControl>

            {/* --- MENSAJE DE ADVERTENCIA: 3Dic se comenta para posible eliminación --- */}
            {/* {operation !== "view" && (
              <FormDescription className="flex items-center gap-1.5 text-orange-600">
                <AlertCircle className="h-3 w-3" />
                El sistema tomará un día antes de la fecha seleccionada.
              </FormDescription>
            )} */}

            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="endDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de fin</FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
                value={field.value as string || ""}
                disabled={operation === "view"}
              />
            </FormControl>

            {/* --- MENSAJE DE ADVERTENCIA: 3Dic se comenta para posible eliminación --- */}
            {/* {operation !== "view" && (
              <FormDescription className="flex items-center gap-1.5 text-orange-600">
                <AlertCircle className="h-3 w-3" />
                El sistema tomará un día antes de la fecha seleccionada.
              </FormDescription>
            )} */}

            <FormMessage />
          </FormItem>
        )}
      />

      <CrudFields
        fields={crudFields2}
        operation={operation}
        form={form}
      />
    </div>
  );
}

export default function PeriodsManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [schoolCycleFilter, setSchoolCycleFilter] = useState<string>("current");

  // User and school data
  const { user: clerkUser } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(currentUser?._id);

  // School cycles query
  const schoolCycles = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool ? { escuelaID: currentSchool.school._id } : "skip"
  );

  // Active school cycle query
  const activeSchoolCycle = useQuery(
    api.functions.schoolCycles.ObtenerCicloActivo,
    currentSchool ? { escuelaID: currentSchool.school._id } : "skip"
  );

  // Determine which school cycle ID to use for terms query
  const effectiveSchoolCycleId = schoolCycleFilter === "current"
    ? activeSchoolCycle?._id
    : schoolCycleFilter === "all"
      ? "all"
      : schoolCycleFilter;

  const {
    canCreateTerm,
    canReadTerm,
    canUpdateTerm,
    canDeleteTerm,
    isLoading: permissionsLoading,

  } = usePermissions(currentSchool?.school._id);
  // Terms data from store
  const {
    terms,
    isLoading: isTermsLoading,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
    createTerm,
    updateTerm,
    deleteTerm,
    clearErrors,
  } = useTerm(effectiveSchoolCycleId, currentSchool?.school._id as Id<"school">);

  // CRUD Dialog
  const { isOpen, operation, data, openCreate, openEdit, openView, openDelete, close } = useCrudDialog(termSchema);

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Periodo");

  // Set active cycle as initial value when component loads
  useEffect(() => {
    if (activeSchoolCycle && schoolCycleFilter === "current") {
      // The filter is already set to "current", so no need to change it
      // The effectiveSchoolCycleId will automatically use the active cycle
    }
  }, [activeSchoolCycle, schoolCycleFilter]);

  // Filter terms
  const filteredTerms = terms.filter((term: Term) => {
    const matchesSearch = term.name.toLowerCase().includes(search.toLowerCase()) ||
      term.key.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || term.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status badge helper
  const getStatusBadge = (status: Term["status"]) => {
    const config = {
      active: { label: "Activo", className: "bg-green-600 text-white" },
      inactive: { label: "Inactivo", className: "bg-red-600 text-white" },
      closed: { label: "Cerrado", className: "bg-gray-600 text-white" }
    };

    const { label, className } = config[status];
    return <Badge className={className}>{label}</Badge>;
  };

  // Handlers
  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school._id) {
      toast.error('Error', { description: 'No se pudo identificar la escuela' });
      return;
    }

    const formValues = values as TermFormValues;

    if (!formValues.startDate || !formValues.endDate) {
      toast.error('Error', { description: 'Las fechas de inicio y fin son requeridas' });
      return;
    }

    //const startDateTimestamp = new Date(formValues.startDate as string).getTime();
    //const endDateTimestamp = new Date(formValues.endDate as string).getTime();


    // 3Dic: Se cambia forzando la zona horaria de México (aqui se realizan fechas a timespamps)
    const startDateTimestamp = new Date(`${formValues.startDate}T00:00:00-06:00`).getTime();
    const endDateTimestamp = new Date(`${formValues.endDate}T00:00:00-06:00`).getTime();

    if (isNaN(startDateTimestamp) || isNaN(endDateTimestamp)) {
      toast.error('Error', { description: 'Las fechas proporcionadas no son válidas' });
      return;
    }

    if (startDateTimestamp >= endDateTimestamp) {
      toast.error('Error', { description: 'La fecha de inicio debe ser anterior a la fecha de fin' });
      return;
    }

    const isDuplicateKey = terms.some((term: Term) =>
      term.key === formValues.key && term._id !== data?._id
    );

    if (isDuplicateKey) {
      toast.error('Error', { description: 'La clave del periodo ya existe' });
      return;
    }

    if (operation === 'create') {
      await createTerm({
        name: formValues.name,
        key: formValues.key,
        startDate: startDateTimestamp,
        endDate: endDateTimestamp,
        schoolCycleId: formValues.schoolCycleId,
        schoolId: currentSchool.school._id,
      });
      //   Los toasts ahora los maneja el CrudDialog automáticamente
    } else if (operation === 'edit' && data?._id) {
      await updateTerm({
        termId: data._id,
        data: {
          name: formValues.name,
          key: formValues.key,
          startDate: startDateTimestamp,
          endDate: endDateTimestamp,
          status: formValues.status as "active" | "inactive" | "closed",
        },
      });
      //   Los toasts ahora los maneja el CrudDialog automáticamente
    }

    close();
  };

  const handleDelete = async (id: string) => {
    await deleteTerm(id);
    //   Los toasts ahora los maneja el CrudDialog automáticamente
  };

  // Get cycle name for display
  const getCycleName = (cycleId: string) => {
    return schoolCycles?.find(cycle => cycle._id === cycleId)?.name || "—";
  };

  // Check if a term belongs to the active cycle
  const isActiveCycle = (cycleId: string) => {
    return cycleId === activeSchoolCycle?._id;
  };
  const isLoading =
    userLoading ||
    schoolLoading ||
    permissionsLoading ||
    activeSchoolCycle === undefined ||
    schoolCycles === undefined ||
    filteredTerms === undefined;

  if (isLoading) {
    return <GeneralDashboardSkeleton nc={3} />;
  }
  return (
    <>
      {canReadTerm ? (<div className="space-y-8 p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">Periodos</h1>
                    <p className="text-lg text-muted-foreground">
                      Administra los periodos académicos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alerts */}
        {(createError || updateError || deleteError) && (
          <div className="space-y-4">
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  Error al crear periodo: {createError}
                </AlertDescription>
              </Alert>
            )}
            {updateError && (
              <Alert variant="destructive">
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  Error al actualizar periodo: {updateError}
                </AlertDescription>
              </Alert>
            )}
            {deleteError && (
              <Alert variant="destructive">
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  Error al eliminar periodo: {deleteError}
                </AlertDescription>
              </Alert>
            )}
            <button
              onClick={clearErrors}
              className="text-xs text-blue-500 underline mt-1"
            >
              Limpiar errores
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Periodos
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{terms?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {schoolCycleFilter === "current" && activeSchoolCycle
                  ? `Ciclo: ${activeSchoolCycle.name}`
                  : schoolCycleFilter === "all"
                    ? "Todos los ciclos"
                    : schoolCycles?.find(c => c._id === schoolCycleFilter)?.name || ""}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activos
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">
                {terms?.filter((term: Term) => term.status === "active").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cerrados
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <XCircle className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">
                {terms?.filter((term: Term) => term.status === "closed").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros y Búsqueda
                </CardTitle>
                <CardDescription>
                  Encuentra los periodos por nombre, clave o estado
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
                    placeholder="Buscar periodo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select
                  onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
                  value={statusFilter || "all"}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                    <SelectItem value="closed">Cerrados</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={setSchoolCycleFilter} value={schoolCycleFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filtrar ciclo escolar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">

                      {activeSchoolCycle && (
                        <span className="">
                          {activeSchoolCycle.name}
                        </span>
                      )}
                    </SelectItem>
                    {schoolCycles
                      ?.filter(cycle => cycle._id !== activeSchoolCycle?._id)
                      .map(cycle => (
                        <SelectItem key={cycle._id} value={cycle._id}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>
                <div className="flex flex-col gap-2">
                  <span>Lista de Periodos</span>
                  {canCreateTerm && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 w-fit">
                      {filteredTerms.length} periodos
                    </Badge>
                  )}
                </div>
              </CardTitle>
              {canCreateTerm ? (
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={openCreate}
                    disabled={isCreating}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Periodo
                  </Button>
                ) : canReadTerm ? (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 w-fit">
                    {filteredTerms.length} periodos
                  </Badge>
                ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {isTermsLoading ? (
              <GeneralDashboardSkeleton nc={3} />
            ) : filteredTerms.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No se encontraron periodos
                </h3>
                <p className="text-muted-foreground mb-4">
                  Intenta ajustar los filtros o no hay periodos registrados.
                </p>
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={openCreate}
                  disabled={isCreating}
                >
                  <Plus className="h-4 w-4" />
                  Agregar Periodo
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Clave</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ciclo Escolar</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTerms.map((term: Term) => (
                      <TableRow key={term._id}>
                        <TableCell className="font-medium">{term.name}</TableCell>
                        <TableCell className="font-mono text-sm">{term.key}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {term.startDate ? new Date(term.startDate).toLocaleDateString("es-ES") : 'Sin fecha'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {term.endDate ? new Date(term.endDate).toLocaleDateString("es-ES") : 'Sin fecha'}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(term.status)}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getCycleName(term.schoolCycleId)}
                            {isActiveCycle(term.schoolCycleId) && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                Actual
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openView(term);
                            }}
                            className="hover:scale-105 transition-transform cursor-pointer"
                            disabled={isUpdating || isDeleting}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canUpdateTerm && (<Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(term);
                            }}
                            className="hover:scale-105 transition-transform cursor-pointer"
                            disabled={isUpdating || isDeleting}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>)}
                          {canDeleteTerm && (<Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDelete(term);
                            }}
                            className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive"
                            disabled={isUpdating || isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CRUD Dialog */}
        <CrudDialog
          operation={operation}
          title={operation === 'create'
            ? 'Crear Nuevo Periodo'
            : operation === 'edit'
              ? 'Actualizar Periodo'
              : 'Detalles del Periodo'
          }
          description={operation === 'create'
            ? 'Completa los datos necesarios para registrar un nuevo periodo académico.'
            : operation === 'edit'
              ? 'Modifica la información del periodo para mantener sus datos correctos y vigentes.'
              : 'Consulta toda la información registrada sobre este periodo.'
          }
          deleteConfirmationTitle="¿Eliminar Periodo?"
          deleteConfirmationDescription="Esta acción borrará de forma definitiva el periodo del sistema. No podrá deshacerse."
          schema={termSchema}
          defaultValues={{
            name: '',
            key: '',
            startDate: '',
            endDate: '',
            status: 'active',
            schoolCycleId: schoolCycleFilter === "current"
              ? activeSchoolCycle?._id || ''
              : schoolCycleFilter !== "all"
                ? schoolCycleFilter
                : (schoolCycles?.[0]?._id || ''),
          }}
          data={data ? {
            ...data,
            startDate: (typeof data?.startDate === 'string' || typeof data?.startDate === 'number' || data?.startDate instanceof Date)
              ? new Date(data.startDate).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }) //3Dic: cambio para usar zona horaria de Mexico
              : '',
            endDate: (typeof data.endDate === 'string' || typeof data.endDate === 'number' || data.endDate instanceof Date)
              ? new Date(data.endDate).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }) //3Dic: cambio para usar zona horaria de Mexico
              : '',
          } : undefined}
          isOpen={isOpen}
          onOpenChange={close}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          toastMessages={toastMessages}
          disableDefaultToasts={false}
        >
          {(form, operation) => (
            <TermForm
              form={form}
              operation={operation}
              schoolCycles={schoolCycles || []}
            />
          )}
        </CrudDialog>
      </div>) : (<NotAuth
        pageName="Periodos"
        pageDetails="Administra los periodos académicos"
        icon={Calendar}
      />)}
    </>
  );
}