"use client";

import { useUser } from "@clerk/nextjs";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { Eye, Pencil, Plus, Trash2 } from "@repo/ui/icons";
import { useSchedule } from "stores/schedule";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import { z } from '@repo/zod-config/index'
import { useCrudDialog, CrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { FormControl, FormField, FormItem, FormLabel } from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { toast } from "sonner";

export default function SchedulePage() {
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const {currentSchool, isLoading, error} = useCurrentSchool(currentUser?._id)

  const scheduleSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    startTime: z.string().min(1, 'La hora de inicio es obligatoria'),
    endTime: z.string().min(1, 'La hora de fin es obligatoria'),
    status: z.enum(['active', 'inactive'], 'El estado es obligatorio')
  })

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

    try {
      if(operation === 'create') {
        await createSchedule({
          schoolId: currentSchool.school._id,
          name: values.name as string,
          startTime: values.startTime as string,
          endTime: values.endTime as string,
          status: values.status as 'active' | 'inactive',
          updatedAt: Date.now()
        })
        toast.success('Horario creado exitosamente')
      } else if(operation === 'edit' && data?._id) {
        await updateSchedule({
          id: data._id,
          schoolId: currentSchool.school._id,
          name: values.name as string,
          startTime: values.startTime as string,
          endTime: values.endTime as string,
          status: values.status as 'active' | 'inactive',
          updatedAt: Date.now()
        })
        toast.success('Horario actualizado exitosamente')
      }
    } catch (error) {
      console.error('Error en operación CRUD:', error);
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

  // const handleRetry = () => {
  //   if (clearErrors) clearErrors();
  //   clearScheduleErrors();
  // }

  if(isLoading) {
    return <div className="text-center py-10">Cargando escuela...</div>
  }

  // if(error) {
  //   return (
  //     <div className="text-center py-10 text-red-600">
  //       Error: {error}
  //       <br/>
  //       <Button
  //         onClick={}
  //       >
  //         Reintentar
  //       </Button>
  //     </div>
  //   )
  // }

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
        <Button onClick={openCreate} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? 'Creando...' : 'Nuevo Horario'}
        </Button>
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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Nombre</TableHead>
              <TableHead>Hora de inico</TableHead>
              <TableHead>Hora de fin</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule?.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No hay horarios registrados para esta escuela.
                  </TableCell>
                </TableRow>
              )
              : (
                schedule?.map(schedule => (
                  <TableRow key={schedule._id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell>{schedule.startTime}</TableCell>
                    <TableCell>{schedule.endTime}</TableCell>
                    <TableCell>
                      <span className={`${schedule.status === 'active' ? 'bg-green-600' : 'bg-red-600'} text-white rounded-2xl p-2`}>
                        {schedule.status === 'active' ? 'Activa' : 'Inactiva'}
                      </span>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant='outline' size='sm' onClick={() => openView({...schedule, _id: schedule._id})}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant='outline' 
                        size='sm' 
                        onClick={() => openEdit({...schedule,_id: schedule._id})} 
                        disabled={isUpdating}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant='destructive' 
                        size='sm' 
                        onClick={() => openDelete({...schedule, _id: schedule._id})} 
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )
            }
          </TableBody>
        </Table>
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
                      {...field}
                      value={field.value as string}
                      placeholder='Nombre del horario'
                      disabled={operation === 'view'}
                    />
                  </FormControl>
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
                      placeholder='Nombre del horario'
                      disabled={operation === 'view'}
                    />
                  </FormControl>
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
                      placeholder='Nombre del horario'
                      disabled={operation === 'view'}
                    />
                  </FormControl>
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
                    <Input
                      {...field}
                      value={field.value as string}
                      placeholder='Nombre del horario'
                      disabled={operation === 'view'}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
      </CrudDialog>
    </main>
  )
}