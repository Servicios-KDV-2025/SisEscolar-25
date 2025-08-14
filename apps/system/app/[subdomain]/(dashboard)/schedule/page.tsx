"use client";

import React from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { toast } from "sonner";
import { useUserSchoolsStore } from "stores/userSchoolsStore"; 
import { useSchdule } from "stores/schedule";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Switch } from "@repo/ui/components/shadcn/switch";
import { Plus, Pencil, Trash2, Eye } from "@repo/ui/icons";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";

// Schema de validación para periodos
const periodoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  activo: z.boolean(),
});

// Opciones para AM/PM
const ampmOptions = ["AM", "PM"];

// Helper para convertir a 24h
function to24h(hour: string, ampm: string) {
  if (!/^\d{1,2}:\d{2}$/.test(hora)) {
    return hour;
  }

  const [h, m] = hour.split(":").map(Number);

  if (h < 1 || h > 12 || m < 0 || m > 59) {
    return hour;
  }

  let h24 = h;
  if (ampm === "PM" && h !== 12) h24 += 12;
  if (ampm === "AM" && h === 12) h24 = 0;
  return `${h24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Helper para convertir de 24h a 12h
function from24h(hour24: string) {
  if (!hour24) return { hour: "7:00", ampm: "AM" };
  const [h, m] = hour24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return { hour: `${hour}:${m.toString().padStart(2, "0")}`, ampm };
}

// Formato 12 horas para mostrar
function formatHour12(hora24: string) {
  if (!hora24) return "";
  const [h, m] = hora24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12 + 1);
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Función para validar formato de hora 12h
function validateHour12(hour: string) {
  if (!/^\d{1,2}:\d{2}$/.test(hour)) {
    return "Formato inválido. Use H:MM o HH:MM";
  }

  const [h, m] = hour.split(":").map(Number);

  if (h < 1 || h > 12) {
    return "La hora debe estar entre 1 y 12";
  }

  if (m < 0 || m > 59) {
    return "Los minutos deben estar entre 00 y 59";
  }

  return null;
}

export default function SchedulePage() {
  const {
    userSchools, //escuela
    isLoading,
    error,
    clearError // clearErros
  } = useUserSchoolsStore();

  // Usar el store de horarios
  const {
    schedule,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    clearErrors: clearStoreErrors,
  } = useSchdule(userSchools[0]?.userSchoolId);

  // Hook del CrudDialog
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
    nombre: "",
    horaInicio: "07:00",
    horaFin: "08:00",
    activo: true
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!userSchools[0]?.userSchoolId) {
      toast.error('Error: Escuela no seleccionada');
      return;
    }

    try {
      if (operation === 'create') {
        await createSchedule({
          schoolId: userSchools[0]?.userSchoolId,
          name: values.name as string,
          startTime: values.startTime as string,
          endTime: values.endTime as string,
          status: values.status as 'active' | 'inactive',
          updatedAt: Date.now()
        });
        toast.success('Creado correctamente')
      } else if (operation === 'edit' && data?._id) {
        await updateSchedule({
          id: data._id,
          schoolId: userSchools[0]?.userSchoolId,
          name: values.name as string,
          startTime: values.startTime as string,
          endTime: values.endTime as string,
          status: values.status as 'active' | 'inactive',
          updatedAt: Date.now()
        });
        toast.success('Actualizado correctamente')
      }
    } catch (error) {
      console.error('Error en operación CRUD:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!userSchools[0]?.userSchoolId) {
      toast.error('Error: Escuela no seleccionada');
      return;
    }

    try {
      await deleteSchedule(id, userSchools[0]?.userSchoolId);
      toast.success('Eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      throw error;
    }
  };

  const handleRetry = () => {
    if (clearError) clearError();
    clearStoreErrors();
  };

  // Estados de carga y error
  if (isLoading) {
    return <div className="text-center py-10">Cargando escuela...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Error: {error}
        <br />
        <button
          onClick={handleRetry}
          className="text-xs text-blue-500 underline mt-2"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!userSchools) {
    return <div className="text-center py-10">No se encontró la escuela.</div>;
  }

  return (
    <div className="w-full px-4 md:px-12 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Periodos</h1>
      </div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">
        Haz clic en los iconos de acciones en cada periodo para ver sus detalles completos, editarlo o eliminarlo. Para crear un nuevo periodo, usa el botón Nuevo Periodo.
        </p>
      </div>
      <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Lista de Periodos</h2>
        <Button size="lg" onClick={openCreate} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo periodo
        </Button>
     </div>

      {/* Mostrar errores del store */}
      {(createError || updateError || deleteError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">
            {createError && <div>Error al crear periodo: {createError}</div>}
            {updateError && <div>Error al actualizar periodo: {updateError}</div>}
            {deleteError && <div>Error al eliminar periodo: {deleteError}</div>}
            <button 
              onClick={clearStoreErrors} 
              className="text-xs text-blue-500 underline mt-2"
            >
              Limpiar errores
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl">
        {schedule?.length === 0 && (
          <p className="text-muted-foreground col-span-full">No hay horarios registrados.</p>
        )}
        {schedule?.map((schedule) => (
          <div key={schedule._id} className="border rounded-lg p-6 flex flex-col justify-between shadow bg-white">
            <div>
              <div className="font-semibold text-lg">{schedule.name}</div>
              <div className="text-base text-muted-foreground">
                {formatHour12(schedule.startTime)} - {formatHour12(schedule.endTime)}
              </div>
              <div className="mt-2">
                <Badge
                  variant="secondary"
                  className={
                    schedule.status === 'active'
                      ? "bg-green-800 text-white"
                      : "bg-red-500 text-white"
                  }
                >
                  {schedule.status === 'active' ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => openView({ ...schedule, _id: schedule._id })}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit({ ...schedule, _id: schedule._id })} disabled={isUpdating}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => openDelete({ ...schedule, _id: schedule._id })} disabled={isDeleting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CrudDialog */}
      <CrudDialog
        operation={operation}
        title={operation === 'create' ? 'Crear Nuevo Horario' :
          operation === 'edit' ? 'Editar Horario' : 'Ver Horiario'}
        description={operation === 'create' ? 'Completa la información del nuevo horario' :
          operation === 'edit' ? 'Modifica la información del horario' : 'Información del horario'}
        schema={periodoSchema}
        defaultValues={{
          name: "",
          startTime: "07:00",
          endTime: "08:00",
          status: 'active',
          updatedAt: Date.now(),
        }}
        data={data}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        deleteConfirmationTitle="¿Eliminar horario?"
        deleteConfirmationDescription="Esta acción no se puede deshacer. El horario será eliminado permanentemente."
      >
        {(form, operation) => <ScheduleForm form={form} operation={operation} />}
      </CrudDialog>
    </div>
  );
}

// Componente separado para el formulario
function ScheduleForm({ form, operation }: { form: UseFormReturn<Record<string, unknown>>; operation: string }) {
  const [start, setStart] = React.useState({ hour: "7:00", ampm: "AM" });
  const [end, setEnd] = React.useState({ hour: "8:00", ampm: "AM" });
  const [errorStart, setErrorStart] = React.useState<string | null>(null);
  const [errorEnd, setErrorEnd] = React.useState<string | null>(null);

  // Inicializar valores del formulario
  React.useEffect(() => {
    const startTime = form.watch('startTime') as string;
    const endTime = form.watch('endTime') as string;

    if (startTime) {
      const startData = from24h(startTime);
      setStart(startData);
    }
    if (endTime) {
      const endData = from24h(endTime);
      setEnd(endData);
    }
  }, [form]);

  // Sincronizar selectores con formulario
  React.useEffect(() => {
    const errorstart = validateHour12(start.hour);
    const errorendVal = validateHour12(end.hour);

    setErrorStart(errorstart);
    setErrorEnd(errorendVal);

    if (!errorstart && !errorendVal) {
      const startTime = to24h(start.hour, start.ampm);
      const endTime = to24h(end.hour, end.ampm);
      form.setValue("startTime", startTime);
      form.setValue("endTime", endTime);
    }
  }, [start, end, form]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <FormField
        control={form.control}
        name="nombre"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value as string}
                placeholder="Nombre del periodo"
                disabled={operation === 'view'}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FormLabel>Hora inicio</FormLabel>
          <div className="flex gap-2 items-center mt-1">
            <Input
              type="text"
              placeholder="H:MM"
              value={start.hour}
              onChange={e => setStart(i => ({ ...i, hora: e.target.value }))}
              className={`w-20 ${errorStart ? 'border-red-500' : ''}`}
              disabled={operation === 'view'}
            />
            <Select
              value={start.ampm}
              onValueChange={ampm => setStart(i => ({ ...i, ampm }))}
              disabled={operation === 'view'}
            >
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ampmOptions.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errorStart && <p className="text-red-500 text-xs mt-1">{errorStart}</p>}
        </div>

        <div>
          <FormLabel>Hora fin</FormLabel>
          <div className="flex gap-2 items-center mt-1">
            <Input
              type="text"
              placeholder="H:MM"
              value={end.hour}
              onChange={e => setEnd(f => ({ ...f, hour: e.target.value }))}
              className={`w-20 ${errorEnd ? 'border-red-500' : ''}`}
              disabled={operation === 'view'}
            />
            <Select
              value={end.ampm}
              onValueChange={ampm => setEnd(f => ({ ...f, ampm }))}
              disabled={operation === 'view'}
            >
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ampmOptions.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errorEnd && <p className="text-red-500 text-xs mt-1">{errorEnd}</p>}
        </div>
      </div>

      <FormField
        control={form.control}
        name="activo"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>Estado</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                  disabled={operation === 'view'}
                />
                <span className="text-sm">
                  {field.value ? "Activo" : "Inactivo"}
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}