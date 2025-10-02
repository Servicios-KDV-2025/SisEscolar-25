"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMutation, useQuery } from "convex/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/shadcn/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Button } from "@repo/ui/components/shadcn/button";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/shadcn/popover";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { toast } from "sonner";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { CalendarFormValues, CalendarSchema } from "schema/calendar";
import { colorMap, iconMap } from "lib/iconMap";
import { api } from "@repo/convex/convex/_generated/api";
import { CalendarDays, Save, Trash2, X } from "@repo/ui/icons";
import { Calendar } from "@repo/ui/components/shadcn/calendar";
import { CalendarType } from "@/types/calendar";
import { cn } from "lib/utils";
interface EventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  escuelaId: Id<"school">;
  selectedDate?: Date;
  eventoEditar?: CalendarType | null;
  canUpdateCalendar?: boolean;
  canDeleteCalendar?: boolean;
}

export default function EventDialog({
  isOpen,
  onOpenChange,
  escuelaId,
  selectedDate,
  eventoEditar,
  canUpdateCalendar,
  canDeleteCalendar,
}: EventModalProps) {

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const ciclosEscolares = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    escuelaId ? { escuelaID: escuelaId } : "skip"
  );
  const tiposDeEventos = useQuery(
    api.functions.eventType.getEventType,
    escuelaId ? { schoolId: escuelaId } : "skip"
  );
  const crearEvento = useMutation(api.functions.calendar.createCalendarEvent);
  const editarEvento = useMutation(api.functions.calendar.updateCalendarEvent);
  const eliminarEvento = useMutation(
    api.functions.calendar.deleteCalendarEvent
  );

  const form = useForm<CalendarFormValues>({
    resolver: zodResolver(CalendarSchema),
    defaultValues: {
      date: selectedDate || new Date(),
      eventTypeId: "",
      description: "",
      schoolCycleId: "",
      status: "active",
    },
  });

  useEffect(() => {
    setConfirmingDelete(false);

    if (eventoEditar) {
      form.reset({
        date: new Date(eventoEditar?.date),
        eventTypeId: eventoEditar?.eventTypeId,
        description: eventoEditar.description || "",
        schoolCycleId: eventoEditar.schoolCycleId,
        status:
          eventoEditar.status === "active" || eventoEditar.status === "inactive"
            ? eventoEditar.status
            : "active",
      });
    } else {
      form.reset({
        date: selectedDate || new Date(),
        eventTypeId: "",
        description: "",
        schoolCycleId: "",
        status: "active",
      });
    }
  }, [
    eventoEditar,
    canUpdateCalendar,
    form,
    isOpen,
    selectedDate,
  ]);

  const handleEliminar = async () => {
    if (!eventoEditar) return;
    setIsLoading(true);
    try {
      await eliminarEvento({ schoolId: escuelaId, eventId: eventoEditar._id });
      toast.success("Evento eliminado");
      onOpenChange(false);
    } catch (error) {
      toast.error("Error al eliminar el evento" + error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CalendarFormValues) => {
    try {
      setIsLoading(true);
      if (eventoEditar && canUpdateCalendar) {
        await editarEvento({
          schoolId: escuelaId,
          eventId: eventoEditar._id,
          date: data.date.getTime(),
          eventTypeId: data.eventTypeId as Id<"eventType">,
          description: data.description || undefined,
          schoolCycleId: data.schoolCycleId as Id<"schoolCycle">,
          status: data.status,
        });
        toast.success("¡Evento editado exitosamente!");
      } else {
        await crearEvento({
          schoolId: escuelaId,
          schoolCycleId: data.schoolCycleId as Id<"schoolCycle">,
          date: data.date.getTime(),
          eventTypeId: data.eventTypeId as Id<"eventType">,
          description: data.description || undefined,
        });
        toast.success("¡Evento creado exitosamente!");
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar evento:", error);
      toast.error("Error al guardar el evento. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const convertirColorAClases = (color: string | undefined) => {
    if (!color)
      return {
        color: "bg-gray-500 text-white",
        bgLight: "bg-gray-50",
        borderColor: "border-gray-300",
      };

    return (
      colorMap[color] || {
        color: "bg-gray-500 text-white",
        bgLight: "bg-gray-50",
        borderColor: "border-gray-300",
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {confirmingDelete
              ? "Confirmar Eliminación"
              : !canUpdateCalendar
              ? "Detalle del Evento"
              : eventoEditar
              ? "Editar Evento"
                  : "Crear Nuevo Evento"}
          </DialogTitle>
          <DialogDescription>
            {confirmingDelete
              ? `¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.`
              : canUpdateCalendar
                ? "Editar evento del calendario escolar"
                : eventoEditar
                  ? "Detalles del evento del calendario escolar"
                  : "Agrega un nuevo evento al calendario escolar"}
          </DialogDescription>
        </DialogHeader>

        {/* ✅ 3. RENDERIZADO CONDICIONAL: CONFIRMACIÓN O FORMULARIO */}
        {confirmingDelete ? (
          <div className="py-6">
            <p className="text-center text-slate-700">
              El evento será eliminado permanentemente.
            </p>
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setConfirmingDelete(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleEliminar}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Sí, eliminar
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="schoolCycleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciclo Escolar</FormLabel>
                    <Select

                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!canUpdateCalendar}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un ciclo escolar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ciclosEscolares?.map((ciclo) => (
                          <SelectItem key={ciclo._id} value={ciclo._id}>
                            <Badge variant="outline" className="text-xs">
                              {ciclo.name}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha del Evento</FormLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={!canUpdateCalendar}
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Evento</FormLabel>
                    <Select
                      disabled={!canUpdateCalendar}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo de evento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposDeEventos?.map((tipo) => {
                          const clases = convertirColorAClases(tipo.color);
                          const IconComponent =
                            iconMap[tipo.icon || "BookOpen"] || CalendarDays;
                          return (
                            <SelectItem key={tipo._id} value={tipo._id}>
                              <div className="flex max-w-full min-w-[200px] items-start gap-3">
                                <div className="flex items-center self-center">
                                  <div
                                    className={cn(
                                      "p-2 rounded-md flex-shrink-0",
                                      clases.color
                                    )}
                                  >
                                    <IconComponent className="h-4 w-4 text-white" />
                                  </div>
                                </div>

                                <div className="flex flex-col flex-grow">
                                  <p className="font-medium text-left">
                                    {tipo.name}
                                  </p>
                                  {tipo.description && (
                                    <p className="text-xs text-slate-500 text-left break-words">
                                      {tipo.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-slate-500">
                      Selecciona el tipo de evento que deseas crear
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={!canUpdateCalendar}
                        placeholder="Describe los detalles del evento..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">
                      Proporciona detalles adicionales sobre el evento (máximo
                      500 caracteres)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canUpdateCalendar && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        disabled={!canUpdateCalendar}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-3 pt-4 border-t justify-between">
                {canDeleteCalendar && eventoEditar && (
                  // ✅ 2. BOTÓN QUE ACTIVA LA CONFIRMACIÓN
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setConfirmingDelete(true)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                )}
                <div className="flex gap-3 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cerrar
                  </Button>
                  {canUpdateCalendar && (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>
                            {eventoEditar ? "Guardando..." : "Creando..."}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          <span>{eventoEditar ? "Guardar" : "Crear"}</span>
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
