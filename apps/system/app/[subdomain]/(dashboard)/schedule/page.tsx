"use client";

import { useUser } from "@clerk/nextjs";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import { Eye, Pencil, Plus, Trash2, CalendarDays, Clock3, CalendarMinus2 } from "@repo/ui/icons";
import { useSchedule } from "stores/scheduleStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import { useCrudDialog, CrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@repo/ui/components/shadcn/select";
import { ScheduleFormData, scheduleSchema } from "schema/scheduleSchema"; 
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { useState, useMemo } from "react"

type FilterType = 'all' | 'active' | 'inactive'

export default function SchedulePage() {
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const {currentSchool, isLoading} = useCurrentSchool(currentUser?._id)
  // Estado para el filtro
  const [filter, setFilter] = useState<FilterType>('all')

  // const formatDate = (timestamp: number) => {
  //       return new Date(timestamp).toLocaleDateString("es-ES", {
  //           year: "numeric",
  //           month: "short",
  //           day: "numeric",
  //       });
  //   }

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
    clearErrors: clearScheduleErrors
  } = useSchedule(currentSchool?.school._id as Id<'school'>)

  // Filtrar los horarios según el filtro seleccionado
  const filteredSchedules = useMemo(() => {
    switch (filter) {
      case 'active':
        return schedule.filter(s => s.status === 'active');
      case 'inactive':
        return schedule.filter(s => s.status === 'inactive');
      case 'all':
      default:
        return schedule;
    }
  }, [schedule, filter])

  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close
  } = useCrudDialog(scheduleSchema, {
    name: '',
    day: '',
    startTime: '',
    endTime: '',
    status: 'active'
  })

  // Ejemplo: crear un horario rapido
  const handleSubmit = async (values: Record<string, unknown>) => {
    if(!currentSchool?.school._id){
      toast.error('Error: Escuela no seleccionada')
      return 
    } 

    const value = values as ScheduleFormData;

    try {
      if(operation === 'create') {
        await createSchedule({
          schoolId: currentSchool.school._id,
          name: value.name as Id<'classCatalog'>,
          day: value.day as 'MON' | 'TUE' | 'WEN' | 'THU' | 'FRI',
          // scheduleDate: new Date(value.scheduleDate).getTime().toString(),
          startTime: value.startTime as string,
          endTime: value.endTime as string,
          status: value.status as 'active' | 'inactive',
          updatedAt: Date.now()
        })
        toast.success('Horario creado exitosamente')
      } else if(operation === 'edit' && data?._id) {
        await updateSchedule({
          id: data._id,
          schoolId: currentSchool.school._id,
          name: value.name as Id<'classCatalog'>,
          day: value.day as 'MON' | 'TUE' | 'WEN' | 'THU' | 'FRI',
          // scheduleDate: new Date(value.scheduleDate).getTime().toString(),
          startTime: value.startTime as string,
          endTime: value.endTime as string,
          status: value.status as 'active' | 'inactive',
          updatedAt: Date.now()
        })
        toast.success('Horario actualizado exitosamente')
      }
    } catch (error) {
      console.error('Error en operación CRUD:', error);
      close()
      throw error;
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentSchool?.school._id) {
      toast.error('Error: Escuela no seleccionada');
      return
    }

    try {
      await deleteSchedule(id, currentSchool.school._id);
      toast.success('Eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      throw error;
    }
  }

  if(isLoading) {
    return <div className="text-center py-10">Cargando escuela...</div>
  }

  if(!currentSchool) {
    return <div className="text-center">No se encontro la escuela</div>
  }

  return (
    <main className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Horario</h1>
      <p className="text-muted-foreground mb-6">
        Aquí puedes ver y gestionar todos los horarios disponibles en la escuela.
        Haz clic en los botones para ver información más precisa, editar o eliminarlo.
        Para crear un nuevo Horario, usa el botón Nuevo Horario.
      </p>

      <div className="flex flex-row items-center justify-between mt-6 mb-2">
        <h2 className="text-xl font-semibold">Gestión del Horario</h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Selector de filtro */}
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

          <Button onClick={openCreate} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'Creando...' : 'Nuevo Horario'}
          </Button>
        </div>
      </div>

      {/* Mostrar contador de resultados */}
      <div className="mb-4 text-sm text-muted-foreground">
        Mostrando {filteredSchedules.length} de {schedule.length} horarios
        {filter !== 'all' && ` (filtrado por: ${filter === 'active' ? 'activos' : 'inactivos'})`}
      </div>

      {(createError || updateError || deleteError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">
            {createError && <div>Error al crear horario: {createError}</div>}
            {updateError && <div>Error al actualizar horario: {updateError}</div>}
            {deleteError && <div>Error al eliminar horario: {deleteError}</div>}
            <button 
              onClick={clearScheduleErrors} 
              className="text-xs text-blue-500 underline mt-2"
            >
              Limpiar errores
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schedule.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center text-muted-foreground">
              {schedule.length === 0 
                ? 'No hay horarios registrados para esta escuela.'
                : `No hay horarios ${filter === 'active' ? 'activos' : 'inactivos'} para mostrar.`
              }
            </CardContent>
          </Card>
        ) : (
          filteredSchedules.map(schedule => (
            <Card key={schedule._id} className="shadow-sm rounded-2xl">
              <CardHeader className="">
                <CardTitle className="flex items-center justify-between">
                  <span className="font-medium">{schedule.name}</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full 
                      ${schedule.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {schedule.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex space-x-2">
                  <CalendarDays /><span className="font-semibold flex">Día:</span>
                  {/* {formatDate(+schedule.scheduleDate)} */}
                  {schedule.day}
                </p>
                <p className="flex space-x-2">
                  <Clock3 /><span className="font-semibold flex">Inicio:</span>{schedule.startTime}
                </p>
                <p className="flex space-x-2">
                  <Clock3 /><span className="font-semibold flex">Fin:</span>{schedule.endTime}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => openView({...schedule, _id: schedule._id})}
                >
                  <Eye className="h-4 w-4"/>
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => openEdit({...schedule, _id: schedule._id})}
                  disabled={isUpdating}
                >
                  <Pencil className="h-4 w-4"/>
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => openDelete({...schedule, _id: schedule._id})}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4"/>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <CrudDialog
        operation={operation}
        title={operation === 'create' ? 'Crear Nuevo Horario' :
          operation === 'edit' ? 'Editar Horario' : 'Ver Horario'}
        description={operation === 'create' ? 'Completa la información del nuevo horario' :
          operation === 'edit' ? 'Modifica la información del horario' : 'Información del horario'}
        schema={scheduleSchema}
        defaultValues={{
          name: "",
          day: '',
          week: '',
          // scheduleDate: new Date().toISOString().split('T')[0],
          startTime: "07:00",
          endTime: "08:00",
          status: 'active'
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
              render={({field}) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={30}
                      {...field}
                      value={field.value as string}
                      placeholder='Nombre del horario'
                      disabled={operation === 'view'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-green-300 text-center text-[14px] font-medium">El día y la semana no pueden coincidir con un registro previo</p>
            <FormField
              control={form.control}
              name="day"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Dia de la semana</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value as 'MON' | 'TUE' | 'WEN' | 'THU' | 'FRI'}
                      disabled={operation === 'view'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un día" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MON">Lunes</SelectItem>
                        <SelectItem value="TUE">Martes</SelectItem>
                        <SelectItem value="WEN">Miercoles</SelectItem>
                        <SelectItem value="THU">Jueves</SelectItem>
                        <SelectItem value="FRI">Viernes</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="week"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Semana del año</FormLabel>
                  <FormControl>
                    <Input
                      type='text'
                      maxLength={2}
                      {...field}
                      value={field.value as string}
                      placeholder='Semanas en el año (1 - 52)'
                      disabled={operation === 'view'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Hora inicio</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                      value={field.value as string}
                      disabled={operation === 'view'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Hora fin</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                      value={field.value as string}
                      disabled={operation === 'view'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value as 'active' | 'inactive'}
                      disabled={operation === 'view'}
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
    </main>
  )
}