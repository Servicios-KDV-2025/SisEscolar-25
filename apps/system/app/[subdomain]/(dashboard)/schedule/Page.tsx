"use client";

import React from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { toast } from "sonner";
import { useUserSchoolsStore } from "stores/userSchoolsStore"; 
import { useSchdule } from "stores/schedule";
import { usePeriodo } from "@/app/store/usePeriodoStore";
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
function to24h(hora: string, ampm: string) {
  if (!/^\d{1,2}:\d{2}$/.test(hora)) {
    return hora;
  }

  const [h, m] = hora.split(":").map(Number);

  if (h < 1 || h > 12 || m < 0 || m > 59) {
    return hora;
  }

  let h24 = h;
  if (ampm === "PM" && h !== 12) h24 += 12;
  if (ampm === "AM" && h === 12) h24 = 0;
  return `${h24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Helper para convertir de 24h a 12h
function from24h(hora24: string) {
  if (!hora24) return { hora: "7:00", ampm: "AM" };
  const [h, m] = hora24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  let hora = h % 12;
  if (hora === 0) hora = 12;
  return { hora: `${hora}:${m.toString().padStart(2, "0")}`, ampm };
}

// Formato 12 horas para mostrar
function formatoHora12(hora24: string) {
  if (!hora24) return "";
  const [h, m] = hora24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hora12 = ((h + 11) % 12 + 1);
  return `${hora12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Función para validar formato de hora 12h
function validarHora12(hora: string) {
  if (!/^\d{1,2}:\d{2}$/.test(hora)) {
    return "Formato inválido. Use H:MM o HH:MM";
  }

  const [h, m] = hora.split(":").map(Number);

  if (h < 1 || h > 12) {
    return "La hora debe estar entre 1 y 12";
  }

  if (m < 0 || m > 59) {
    return "Los minutos deben estar entre 00 y 59";
  }

  return null;
}

export default function PeriodosPage() {
  const {
    userSchools, //escuela
    isLoading,
    error,
    clearError // clearErros
  } = useUserSchoolsStore();

  // Usar el store de periodos
  const {
    periodos,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
    crearPeriodo,
    actualizarPeriodo,
    eliminarPeriodo,
    clearErrors: clearStoreErrors,
  } = usePeriodo(escuela?._id);

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
  } = useCrudDialog(periodoSchema, {
    nombre: "",
    horaInicio: "07:00",
    horaFin: "08:00",
    activo: true
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!escuela?._id) {
      toast.error('Error: Escuela no seleccionada');
      return;
    }

    try {
      if (operation === 'create') {
        await crearPeriodo({
          escuelaId: escuela._id,
          nombre: values.nombre as string,
          horaInicio: values.horaInicio as string,
          horaFin: values.horaFin as string,
          activo: values.activo as boolean
        });
        toast.success('Creado correctamente')
      } else if (operation === 'edit' && data?._id) {
        await actualizarPeriodo({
          id: data._id,
          escuelaId: escuela._id,
          nombre: values.nombre as string,
          horaInicio: values.horaInicio as string,
          horaFin: values.horaFin as string,
          activo: values.activo as boolean
        });
        toast.success('Actualizado correctamente')
      }
    } catch (error) {
      console.error('Error en operación CRUD:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!escuela?._id) {
      toast.error('Error: Escuela no seleccionada');
      return;
    }

    try {
      await eliminarPeriodo(id, escuela._id);
      toast.success('Eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar periodo:', error);
      throw error;
    }
  };

  const handleRetry = () => {
    if (clearErrors) clearErrors();
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

  if (!escuela) {
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
        {periodos?.length === 0 && (
          <p className="text-muted-foreground col-span-full">No hay periodos registrados.</p>
        )}
        {periodos?.map((periodo) => (
          <div key={periodo._id} className="border rounded-lg p-6 flex flex-col justify-between shadow bg-white">
            <div>
              <div className="font-semibold text-lg">{periodo.nombre}</div>
              <div className="text-base text-muted-foreground">
                {formatoHora12(periodo.horaInicio)} - {formatoHora12(periodo.horaFin)}
              </div>
              <div className="mt-2">
                <Badge
                  variant="secondary"
                  className={
                    periodo.activo
                      ? "bg-green-800 text-white"
                      : "bg-red-500 text-white"
                  }
                >
                  {periodo.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => openView({ ...periodo, _id: periodo._id })}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit({ ...periodo, _id: periodo._id })} disabled={isUpdating}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => openDelete({ ...periodo, _id: periodo._id })} disabled={isDeleting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CrudDialog */}
      <CrudDialog
        operation={operation}
        title={operation === 'create' ? 'Crear Nuevo Periodo' :
          operation === 'edit' ? 'Editar Periodo' : 'Ver Periodo'}
        description={operation === 'create' ? 'Completa la información del nuevo periodo' :
          operation === 'edit' ? 'Modifica la información del periodo' : 'Información del periodo'}
        schema={periodoSchema}
        defaultValues={{
          nombre: "",
          horaInicio: "07:00",
          horaFin: "08:00",
          activo: true
        }}
        data={data}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        deleteConfirmationTitle="¿Eliminar periodo?"
        deleteConfirmationDescription="Esta acción no se puede deshacer. El periodo será eliminado permanentemente."
      >
        {(form, operation) => <PeriodoForm form={form} operation={operation} />}
      </CrudDialog>
    </div>
  );
}

// Componente separado para el formulario
function PeriodoForm({ form, operation }: { form: UseFormReturn<Record<string, unknown>>; operation: string }) {
  const [inicio, setInicio] = React.useState({ hora: "7:00", ampm: "AM" });
  const [fin, setFin] = React.useState({ hora: "8:00", ampm: "AM" });
  const [errorInicio, setErrorInicio] = React.useState<string | null>(null);
  const [errorFin, setErrorFin] = React.useState<string | null>(null);

  // Inicializar valores del formulario
  React.useEffect(() => {
    const horaInicio = form.watch('horaInicio') as string;
    const horaFin = form.watch('horaFin') as string;

    if (horaInicio) {
      const inicioData = from24h(horaInicio);
      setInicio(inicioData);
    }
    if (horaFin) {
      const finData = from24h(horaFin);
      setFin(finData);
    }
  }, [form]);

  // Sincronizar selectores con formulario
  React.useEffect(() => {
    const errorIni = validarHora12(inicio.hora);
    const errorFinVal = validarHora12(fin.hora);

    setErrorInicio(errorIni);
    setErrorFin(errorFinVal);

    if (!errorIni && !errorFinVal) {
      const horaInicio = to24h(inicio.hora, inicio.ampm);
      const horaFin = to24h(fin.hora, fin.ampm);
      form.setValue("horaInicio", horaInicio);
      form.setValue("horaFin", horaFin);
    }
  }, [inicio, fin, form]);

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
              value={inicio.hora}
              onChange={e => setInicio(i => ({ ...i, hora: e.target.value }))}
              className={`w-20 ${errorInicio ? 'border-red-500' : ''}`}
              disabled={operation === 'view'}
            />
            <Select
              value={inicio.ampm}
              onValueChange={ampm => setInicio(i => ({ ...i, ampm }))}
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
          {errorInicio && <p className="text-red-500 text-xs mt-1">{errorInicio}</p>}
        </div>

        <div>
          <FormLabel>Hora fin</FormLabel>
          <div className="flex gap-2 items-center mt-1">
            <Input
              type="text"
              placeholder="H:MM"
              value={fin.hora}
              onChange={e => setFin(f => ({ ...f, hora: e.target.value }))}
              className={`w-20 ${errorFin ? 'border-red-500' : ''}`}
              disabled={operation === 'view'}
            />
            <Select
              value={fin.ampm}
              onValueChange={ampm => setFin(f => ({ ...f, ampm }))}
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
          {errorFin && <p className="text-red-500 text-xs mt-1">{errorFin}</p>}
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