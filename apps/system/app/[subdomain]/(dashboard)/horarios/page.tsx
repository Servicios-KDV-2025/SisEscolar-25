"use client";

import { useUser } from "@clerk/nextjs";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  CalendarDays,
  Clock3,
  AlertCircle,
  Filter,
} from "@repo/ui/icons";
import { useSchedule } from "stores/scheduleStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import {
  useCrudDialog,
  CrudDialog,
} from "@repo/ui/components/dialog/crud-dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { toast } from "sonner";
import { Alert, AlertDescription } from '@repo/ui/components/shadcn/alert';
import { Badge } from '@repo/ui/components/shadcn/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@repo/ui/components/shadcn/select";
import { ScheduleFormData, scheduleSchema } from "schema/scheduleSchema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { useState, useMemo } from "react";

type FilterType = "all" | "active" | "inactive";

export default function SchedulePage() {
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const { currentSchool, isLoading, error: schoolError } = useCurrentSchool(currentUser?._id)
  // Estado para el filtro
  const [filter, setFilter] = useState<FilterType>('all')
  const [dayFilter, setDayFilter] = useState<string>('all')

  const {
    schedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
    clearErrors: clearScheduleErrors,
  } = useSchedule(currentSchool?.school._id as Id<"school">);

  // Filtrar los horarios según el filtro seleccionado
  const filteredSchedules = useMemo(() => {
    return schedule.filter((s) => {
      const matchesStatus =
        filter === 'all' || s.status === filter

      const matchesDay =
        dayFilter === 'all' || s.day === dayFilter

      return matchesStatus && matchesDay
    })
  }, [schedule, filter, dayFilter])

  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
  } = useCrudDialog(scheduleSchema, {
    name: "",
    day: "",
    startTime: "",
    endTime: "",
    status: "active",
  });

  // Ejemplo: crear un horario rapido
  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school._id) {
      toast.error('Error: Escuela no seleccionada')
      return
    }

    const value = values as ScheduleFormData;

    try {
      if (operation === 'create') {
        await createSchedule({
          schoolId: currentSchool.school._id,
          name: value.name as string,
          day: value.day as "lun." | "mar." | "mié." | "jue." | "vie.",
          startTime: value.startTime as string,
          endTime: value.endTime as string,
          status: value.status as 'active' | 'inactive',
          updatedAt: Date.now()
        })
        toast.success('Horario creado exitosamente')
      } else if (operation === 'edit' && data?._id) {
        await updateSchedule({
          id: data._id,
          schoolId: currentSchool.school._id,
          name: value.name as string,
          day: value.day as "lun." | "mar." | "mié." | "jue." | "vie.",
          startTime: value.startTime as string,
          endTime: value.endTime as string,
          status: value.status as "active" | "inactive",
          updatedAt: Date.now(),
        });
        toast.success("Horario actualizado exitosamente");
      }
    } catch (error) {
      console.error("Error en operación CRUD:", error);

      close();
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentSchool?.school._id) {
      toast.error("Error: Escuela no seleccionada");
      return;
    }

    try {
      await deleteSchedule(id, currentSchool.school._id);
      toast.success("Eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar horario:", error);
      throw error;
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Cargando escuela...</div>;
  }

  if (isLoading || (currentUser && !currentSchool && !schoolError)) return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando información de los horarios...</p>
        </div>
      </div>
    </div>
  )

  if (!currentSchool) {
    return <div className="text-center">No se encontro la escuela</div>
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Clock3 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Horarios</h1>
                  <p className="text-lg text-muted-foreground">
                    Administra los horarios registrados.
                  </p>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={openCreate}
              disabled={isCreating}

            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Creando...' : 'Agregar Horario'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alerts */}
      {(createError || updateError || deleteError) && (
        <div className="space-y-4">
          {createError === "HORARIO_SUPERPUESTO" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error: El horario se solapa con otro horario existente en el mismo día
              </AlertDescription>
            </Alert>
          )}
          {updateError === "HORARIO_SUPERPUESTO" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error: El horario se solapa con otro horario existente en el mismo día
              </AlertDescription>
            </Alert>
          )}
          {createError === "HORARIO_DUPLICADO" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error: Ya existe un horario idéntico para este día
              </AlertDescription>
            </Alert>
          )}
          {createError && createError !== "HORARIO_SUPERPUESTO" && createError !== "HORARIO_DUPLICADO" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al crear horario: {createError}
              </AlertDescription>
            </Alert>
          )}
          {updateError && updateError !== "HORARIO_SUPERPUESTO" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al actualizar horario: {updateError}
              </AlertDescription>
            </Alert>
          )}
          {deleteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al eliminar horario: {deleteError}
              </AlertDescription>
            </Alert>
          )}
          <Button
            onClick={clearScheduleErrors}
            className="text-xs text-red-950 bg-red-200 mt-2 hover:bg-red-300"
          >
            Limpiar errores
          </Button>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className='h-5 w-5' />
                  Filtros y Búsqueda
                </CardTitle>
                <CardDescription>
                  Encuentra el horario por activos o inactivos
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los horarios</SelectItem>
                  <SelectItem value="active">Horarios activos</SelectItem>
                  <SelectItem value="inactive">Horarios inactivos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dayFilter} onValueChange={(value: string) => setDayFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por día" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los días</SelectItem>
                  <SelectItem value="lun.">Lunes</SelectItem>
                  <SelectItem value="mar.">Martes</SelectItem>
                  <SelectItem value="mié.">Miércoles</SelectItem>
                  <SelectItem value="jue.">Jueves</SelectItem>
                  <SelectItem value="vie.">Viernes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabla de Horarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Horarios</span>
            <Badge variant="outline">{filteredSchedules.length} horarios</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando horarios...</p>
              </div>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Clock3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No se encontraron horarios
              </h3>
              <p className="text-muted-foreground mb-4">
                Intenta ajustar los filtros o no hay horarios registrados.
              </p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-9"
            >
              {filteredSchedules.map((schedule) => (
                <Card
                  key={schedule._id}
                  className="w-full hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 break-words flex justify-between">
                      <span>{schedule.name}</span>
                      <Badge
                        variant={schedule.status === "active" ? "default" : "secondary"}
                        className={schedule.status === "active" ? "bg-green-600 text-white flex-shrink-0 ml-2" : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"}
                      >
                        {schedule.status === "active" ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    <p className="flex space-x-1">
                      <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-semibold flex">Día:</span>
                      <span>
                        {schedule.day}
                      </span>
                    </p>
                    <p className="flex space-x-1">
                      <Clock3 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-semibold flex">Inicio:</span>
                      <span>{schedule.startTime}</span>
                    </p>
                    <p className="flex space-x-1">
                      <Clock3 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-semibold flex">Fin:</span>
                      <span>{schedule.endTime}</span>
                    </p>
                  </CardContent>

                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => openView({ ...schedule, _id: schedule._id })}
                      className="hover:scale-105 transition-transform cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => openEdit({ ...schedule, _id: schedule._id })}
                      className="hover:scale-105 transition-transform cursor-pointer"
                      disabled={isUpdating}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => openDelete({ ...schedule, _id: schedule._id })}
                      disabled={isDeleting}
                      className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive bg-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CrudDialog
        operation={operation}
        title={
          operation === "create"
            ? "Crear Nuevo Horario"
            : operation === "edit"
              ? "Editar Horario"
              : "Ver Horario"
        }
        description={
          operation === "create"
            ? "Completa la información del nuevo horario"
            : operation === "edit"
              ? "Modifica la información del horario"
              : "Información del horario"
        }
        schema={scheduleSchema}
        defaultValues={{
          name: "",
          day: "",
          startTime: "07:00",
          endTime: "08:00",
          status: "active",
        }}
        data={data}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        deleteConfirmationTitle="¿Eliminar periodo?"
        deleteConfirmationDescription="Esta acción no se puede deshacer. El periodo será eliminado permanentemente."
      >
        {(form, operation) => (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del horario</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      {...field}
                      value={(() => {
                        const day = form.watch("day");
                        const startTime = form.watch("startTime");
                        const endTime = form.watch("endTime");

                        const isValidValue = (value: string) =>
                          value != null &&
                          value !== "" &&
                          value.toString().trim() !== "";
                         const dayMap : {[key: string]: string} = {
                          "lun.": "Lunes",
                          "mar.": "Martes",
                          "mié.": "Miércoles",
                          "jue.": "Jueves",
                          "vie.": "Viernes",
                         }

                        const generatedName =
                          isValidValue(day as string) &&
                          isValidValue(startTime as string) &&
                          isValidValue(endTime as string)
                            ? `${dayMap[day as keyof typeof dayMap]} ${startTime}-${endTime}`
                            : "";

                        if (generatedName !== field.value) {
                          form.setValue(field.name, generatedName);
                        }

                        return generatedName;
                      })()}
                      placeholder="Completa día, hora inicio y fin"
                      disabled={operation === "view"}
                      readOnly={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia de la semana</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={
                        field.value as "lun." | "mar." | "mié." | "jue" | "vie."
                      }
                      disabled={operation === "view"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un día" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lun.">Lunes</SelectItem>
                        <SelectItem value="mar.">Martes</SelectItem>
                        <SelectItem value="mié.">Miercoles</SelectItem>
                        <SelectItem value="jue.">Jueves</SelectItem>
                        <SelectItem value="vie.">Viernes</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora inicio</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                      value={field.value as string}
                      disabled={operation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora fin</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                      value={field.value as string}
                      disabled={operation === "view"}
                    />
                  </FormControl>
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
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value as "active" | "inactive"}
                      disabled={operation === "view"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </CrudDialog>
    </div>
  )
}
