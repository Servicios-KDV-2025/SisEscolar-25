"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/shadcn/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Button } from "@repo/ui/components/shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Calendar, Users, BookOpen, Trophy, Star, Heart, Save, X } from "@repo/ui/icons";
import { toast } from "sonner";
import { EventType } from "@/types/eventType";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { EventTypeFormData, EventTypeSchema } from "schema/eventType";
import { api } from "@repo/convex/convex/_generated/api";

type ModoEvento = "editar" | "ver" | "eliminar" | null;

interface TipoEventoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  escuelaId: Id<"school">;
  tipoEventoEditar?: EventType;
  modo?: ModoEvento;
}

const iconOptions = [
  { value: "calendar", label: "Calendario", icon: Calendar },
  { value: "users", label: "Usuarios", icon: Users },
  { value: "book", label: "Académico", icon: BookOpen },
  { value: "trophy", label: "Competencia", icon: Trophy },
  { value: "star", label: "Especial", icon: Star },
  { value: "heart", label: "Social", icon: Heart },
];

const colorOptions = [
  { value: "#3B82F6", label: "Azul", preview: "bg-blue-500" },
  { value: "#10B981", label: "Verde", preview: "bg-green-500" },
  { value: "#F59E0B", label: "Amarillo", preview: "bg-yellow-500" },
  { value: "#EF4444", label: "Rojo", preview: "bg-red-500" },
  { value: "#8B5CF6", label: "Púrpura", preview: "bg-purple-500" },
  { value: "#06B6D4", label: "Cian", preview: "bg-cyan-500" },
  { value: "#F97316", label: "Naranja", preview: "bg-orange-500" },
  { value: "#EC4899", label: "Rosa", preview: "bg-pink-500" },
];

export default function EventTypeDialog({
  isOpen,
  onOpenChange,
  escuelaId,
  tipoEventoEditar,
  modo
}: TipoEventoDialogProps) {
  const esSoloLectura = modo === "ver";
  const esEdicion = modo === "editar";
  const esEliminar = modo === "eliminar";
  const [isLoading, setIsLoading] = useState(false);

  const crearTipoEvento = useMutation(api.functions.eventType.createEventType);
  const editarTipoEvento = useMutation(api.functions.eventType.editEventType);
  const eliminarTipoEvento = useMutation(api.functions.eventType.deleteEventType);

  const form = useForm<EventTypeFormData>({
    resolver: zodResolver(EventTypeSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      color: "#3B82F6",
      icon: "calendar",
      status: "active"
    },
  });

  const selectedColor = form.watch("color");
  const selectedIcon = form.watch("icon");

  useEffect(() => {
    if (isOpen && !tipoEventoEditar && modo === null) {
      form.reset({
        name: "",
        key: "",
        description: "",
        color: "#3B82F6",
        icon: "calendar",
        status: "active"
      });
    }
    if (tipoEventoEditar && (esEdicion || esSoloLectura)) {
      form.reset({
        name: tipoEventoEditar.name,
        key: tipoEventoEditar.key,
        description: tipoEventoEditar.description || "",
        color: tipoEventoEditar.color || "#3B82F6",
        icon: tipoEventoEditar.icon || "calendar",
        status: (tipoEventoEditar.status === "active" || tipoEventoEditar.status === "inactive") ? tipoEventoEditar.status : "active"
      });
    }
  }, [tipoEventoEditar, esEdicion, esSoloLectura, form, isOpen, modo]);

  const handleEliminar = async () => {
    if (!tipoEventoEditar) return;
    try {
      await eliminarTipoEvento({ schoolId: escuelaId, eventTypeId: tipoEventoEditar._id });
      toast.success("Evento eliminado");
      onOpenChange(false);
    } catch (error) {
      console.log("Error: ", error)
      toast.error("Error al eliminar");
    }
  };

  const onSubmit = async (data: EventTypeFormData) => {
    try {
      setIsLoading(true);

      if (tipoEventoEditar && esEdicion) {
        await editarTipoEvento({
          schoolId: escuelaId,
          eventTypeId: tipoEventoEditar._id as Id<"eventType">,
          name: data.name,
          key: data.key,
          description: data.description,
          color: data.color,
          icon: data.icon,
          status: data.status || "active"
        })
        toast.success("¡Tipo de Evento editado exitosamente!");
      } else if (modo === null) {
        await crearTipoEvento({
          schoolId: escuelaId,
          name: data.name,
          key: data.key,
          description: data.description || undefined,
          color: data.color || undefined,
          icon: data.icon || undefined
        })
        toast.success("Tipo de evento creado exitosamente");
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al crear tipo de evento:", error);
      toast.error("Error al crear el tipo de evento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    const key = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 10);
    form.setValue("key", key);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {esEdicion
              ? "Editar Tipo de Evento"
              : esSoloLectura
                ? "Detalle del Tipo de Evento"
                : esEliminar
                  ? "Eliminar Tipo de Evento"
                  : "Crear Nuevo Tipo de Evento"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {esEdicion
              ? "Editar tipo de evento del calendario escolar"
              : esSoloLectura
                ? "Detalles del tipo de evento del calendario escolar"
                : esEliminar
                  ? "Eliminar tipo de evento del calendario escolar"
                  : "Define un nuevo tipo de evento para organizar mejor tus actividades escolares."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Nombre del Tipo de Evento
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Reunión de Padres"
                      className="h-11"
                      onChange={(e) => {
                        field.onChange(e);
                        handleNameChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Clave de Identificación
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="REUNION_PADRES"
                      className="h-11 font-mono"
                      style={{ textTransform: "uppercase" }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Solo mayúsculas, números y guiones bajos. Máximo 10 caracteres.
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
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Descripción (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descripción breve del tipo de evento..."
                      className="min-h-[80px] resize-none"
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    {field.value?.length || 0}/200 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Color
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: selectedColor }}
                            />
                            {colorOptions.find(c => c.value === selectedColor)?.label}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.value }}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Icono
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const IconComponent = iconOptions.find(i => i.value === selectedIcon)?.icon;
                              return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
                            })()}
                            {iconOptions.find(i => i.value === selectedIcon)?.label}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center gap-2">
                              <icon.icon className="w-4 h-4" />
                              {icon.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipoEventoEditar ? <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={value => field.onChange(value)}
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
            /> : ""}

            <div className="flex gap-3 pt-4 border-t border-slate-200">
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
                <Button variant="destructive" onClick={handleEliminar}>Eliminar</Button>

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
                      {esEdicion ? "Guardar Cambios" : "Crear Evento"}
                    </div>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}