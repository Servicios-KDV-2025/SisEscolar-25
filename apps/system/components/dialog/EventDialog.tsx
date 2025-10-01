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
import { CalendarDays, Save, X } from "@repo/ui/icons";
import { Calendar } from "@repo/ui/components/shadcn/calendar";
import { CalendarType } from "@/types/calendar";
import { cn } from "lib/utils";

type ModoEvento = "editar" | "ver" | "eliminar" | null;

interface EventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  escuelaId: Id<"school">;
  selectedDate?: Date;
  eventoEditar?: CalendarType;
  modo?: ModoEvento;
  canDeleteCalendar?: boolean;
}

export default function EventDialog({
  isOpen,
  onOpenChange,
  escuelaId,
  selectedDate,
  eventoEditar,
  modo,
  canDeleteCalendar,
}: EventModalProps) {
  const esSoloLectura = modo === "ver";
  const esEdicion = modo === "editar";
  const esEliminar = modo === "eliminar";
  const [isLoading, setIsLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const ciclosEscolares = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    escuelaId ? { escuelaID: escuelaId as Id<"school"> } : "skip"
  );
  const tiposDeEventos = useQuery(
    api.functions.eventType.getEventType,
    escuelaId ? { schoolId: escuelaId as Id<"school"> } : "skip"
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
    if (isOpen && !eventoEditar && modo === null) {
      form.reset({
        date: selectedDate || new Date(),
        eventTypeId: "",
        description: "",
        schoolCycleId: "",
        status: "active",
      });
    }
    if (eventoEditar && (esEdicion || esSoloLectura)) {
      form.reset({
        date: new Date(eventoEditar?.date),
        eventTypeId: eventoEditar?.eventTypeId,
        description: eventoEditar.description || "Sin descriipción",
        schoolCycleId: eventoEditar.schoolCycleId,
        status:
          eventoEditar.status === "active" || eventoEditar.status === "inactive"
            ? eventoEditar.status
            : "active",
      });
    }
  }, [
    eventoEditar,
    esEdicion,
    esSoloLectura,
    form,
    isOpen,
    modo,
    selectedDate,
  ]);

  useState(() => {
    if (
      Array.isArray(ciclosEscolares) &&
      ciclosEscolares.length > 0 &&
      !form.getValues("schoolCycleId")
    ) {
      const cicloActual = ciclosEscolares[ciclosEscolares.length - 1];
      if (cicloActual && cicloActual._id) {
        form.setValue("schoolCycleId", cicloActual._id);
      }
    }
  });

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

  const handleEliminar = async () => {
    if (!eventoEditar) return;
    try {
      await eliminarEvento({ schoolId: escuelaId, eventId: eventoEditar._id });
      toast.success("Evento eliminado");
      onOpenChange(false);
    } catch (error) {
      console.log("Error: ", error);
      toast.error("Error al eliminar");
    }
  };

  const onSubmit = async (data: CalendarFormValues) => {
    try {
      setIsLoading(true);
      if (eventoEditar && esEdicion) {
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
      } else if (modo === null) {
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
      toast.error("Error", {
        description:
          "Ocurrió un error al guardar el evento. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-800">
                {esEdicion
                  ? "Editar Evento"
                  : esSoloLectura
                    ? "Detalle del Evento"
                    : esEliminar
                      ? "Eliminar Evento"
                      : "Crear Nuevo Evento"}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {esEdicion
                  ? "Editar evento del calendario escolar"
                  : esSoloLectura
                    ? "Detalles del evento del calendario escolar"
                    : esEliminar
                      ? "Eliminar evento del calendario escolar"
                      : "Agrega un nuevo evento al calendario escolar"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="schoolCycleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">
                    Ciclo Escolar
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger
                        disabled={esSoloLectura || esEliminar}
                        className="bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400"
                      >
                        <SelectValue placeholder="Selecciona un ciclo escolar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ciclosEscolares?.map((ciclo) => (
                        <SelectItem key={ciclo._id} value={ciclo._id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {ciclo.name}
                            </Badge>
                          </div>
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
                  <FormLabel className="text-slate-700 font-semibold">
                    Fecha del Evento
                  </FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          disabled={esSoloLectura || esEliminar}
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-slate-50 border-slate-200 hover:bg-white hover:border-blue-400",
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
                  <FormLabel className="text-slate-700 font-semibold">
                    Tipo de Evento
                  </FormLabel>
                  <Select
                    disabled={esSoloLectura || esEliminar}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-slate-50 max-w-[90vw] sm:max-w-[400px] min-w-[200px] border-slate-200 focus:bg-white focus:border-blue-400">
                        <SelectValue placeholder="Selecciona un tipo de evento" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent className="w-auto max-w-[90vw] sm:max-w-[400px] min-w-[200px] p-2">
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
              disabled={esSoloLectura || esEliminar}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">
                    Descripción (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={esSoloLectura || esEliminar}
                      placeholder="Describe los detalles del evento..."
                      className="bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-slate-500">
                    Proporciona detalles adicionales sobre el evento (máximo 500
                    caracteres)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {eventoEditar ? (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Select
                        disabled={esSoloLectura || esEliminar}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value || "active"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
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
            ) : (
              ""
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-200 justify-between">
              {canDeleteCalendar && (
                <Button variant="destructive" onClick={handleEliminar}>
                  Eliminar
                </Button>
              )}
              <div className="flex gap-3 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cerrar
                </Button>
                {esEliminar ? (
                  <Button variant="destructive" onClick={handleEliminar}>
                    Eliminar
                  </Button>
                ) : esSoloLectura ? (
                  ""
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {esEdicion ? "Guardando..." : "Creando..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {esEdicion ? "Guardar" : "Crear Evento"}
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
