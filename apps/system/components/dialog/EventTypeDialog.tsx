"use client";

import { useEffect, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
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
import { Input } from "@repo/ui/components/shadcn/input";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Calendar,
  Users,
  BookOpen,
  Trophy,
  Star,
  Heart,
  Save,
  X,
  Trash2,
} from "@repo/ui/icons";
import { toast } from "@repo/ui/sonner";
import { EventType } from "@/types/eventType";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { EventTypeFormData, EventTypeSchema } from "schema/eventType";
import { api } from "@repo/convex/convex/_generated/api";
import { useCrudToastMessages } from "../../hooks/useCrudToastMessages";
import CrudFields from '@repo/ui/components/dialog/crud-fields';

interface TipoEventoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  escuelaId: Id<"school">;
  tipoEventoEditar?: EventType | null;
  canUpdateCalendar?: boolean;
  canDeleteCalendar?: boolean;
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
  { value: "blue", label: "Azul", preview: "bg-blue-500", name: "blue" },
  { value: "green", label: "Verde", preview: "bg-green-500", name: "green" },
  {
    value: "yellow",
    label: "Amarillo",
    preview: "bg-yellow-500",
    name: "yellow",
  },
  { value: "red", label: "Rojo", preview: "bg-red-500", name: "red" },
  {
    value: "purple",
    label: "Púrpura",
    preview: "bg-purple-500",
    name: "purple",
  },
  { value: "cyan", label: "Cian", preview: "bg-cyan-500", name: "cyan" },
  {
    value: "orange",
    label: "Naranja",
    preview: "bg-orange-500",
    name: "orange",
  },
  { value: "pink", label: "Rosa", preview: "bg-pink-500", name: "pink" },
];

export default function EventTypeDialog({
  isOpen,
  onOpenChange,
  escuelaId,
  tipoEventoEditar,
  canUpdateCalendar,
  canDeleteCalendar,
}: TipoEventoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const crearTipoEvento = useMutation(api.functions.eventType.createEventType);
  const editarTipoEvento = useMutation(api.functions.eventType.editEventType);
  const eliminarTipoEvento = useMutation(
    api.functions.eventType.deleteEventType
  );

  const toastMessages = useCrudToastMessages("Tipo de Evento");

  const form = useForm<EventTypeFormData>({
    resolver: zodResolver(EventTypeSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      color: "blue",
      icon: "calendar",
      status: "active",
    },
  });

  const selectedColor = form.watch("color");
  const selectedIcon = form.watch("icon");

  useEffect(() => {
    setConfirmingDelete(false);
    if (tipoEventoEditar) {
      form.reset({
        name: tipoEventoEditar.name,
        key: tipoEventoEditar.key,
        description: tipoEventoEditar.description || "",
        color: (tipoEventoEditar.color || "blue") as EventTypeFormData['color'],
        icon: tipoEventoEditar.icon || "calendar",
        status:
          tipoEventoEditar.status === "active" ||
            tipoEventoEditar.status === "inactive"
            ? tipoEventoEditar.status
            : "active",
      });
    } else {
      form.reset({
        name: "",
        key: "",
        description: "",
        color: "blue",
        icon: "calendar",
        status: "active",
      });
    }
  }, [tipoEventoEditar, form, isOpen]);

  const handleEliminar = async () => {
    if (!tipoEventoEditar) return;
    try {
      setIsLoading(true);
      await eliminarTipoEvento({
        schoolId: escuelaId,
        eventTypeId: tipoEventoEditar._id,
      });
      // Toast de eliminación personalizado con icono de bote de basura
      toast(
        <span style={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 className="h-4 w-4" style={{ color: '#dc2626' }} />
          {toastMessages.deleteSuccess}
        </span>,
        {
          className: 'bg-white border border-red-200 toast-red-text',
          duration: 3000,
        }
      );
      onOpenChange(false);
    } catch (error) {
      // Toast de error personalizado
      toast.error(
        <span style={{ color: '#dc2626' }}>
          {toastMessages.deleteError}
        </span>,
        {
          className: 'bg-white border border-red-200',
          unstyled: false,
          description: error instanceof Error ? error.message : undefined
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EventTypeFormData) => {
    try {
      setIsLoading(true);

      if (tipoEventoEditar && canUpdateCalendar) {
        await editarTipoEvento({
          schoolId: escuelaId,
          eventTypeId: tipoEventoEditar._id as Id<"eventType">,
          name: data.name,
          key: data.key,
          description: data.description,
          color: data.color,
          icon: data.icon,
          status: data.status || "active",
        });
        // Toast personalizado con fondo blanco y texto verde
        toast.success(
          <span style={{ color: '#16a34a', fontWeight: 600 }}>
            {toastMessages.editSuccess}
          </span>,
          {
            className: 'bg-white border border-green-200',
            unstyled: false,
          }
        );
      } else {
        await crearTipoEvento({
          schoolId: escuelaId,
          name: data.name,
          key: data.key,
          description: data.description || undefined,
          color: data.color || undefined,
          icon: data.icon || undefined,
        });
        // Toast personalizado con fondo blanco y texto verde
        toast.success(
          <span style={{ color: '#16a34a', fontWeight: 600 }}>
            {toastMessages.createSuccess}
          </span>,
          {
            className: 'bg-white border border-green-200',
            unstyled: false,
          }
        );
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Toast de error personalizado - distingue entre crear y editar
      const errorMessage = tipoEventoEditar 
        ? toastMessages.editError 
        : toastMessages.createError;
      
      toast.error(
        <span style={{ color: '#dc2626' }}>
          {errorMessage}
        </span>,
        {
          className: 'bg-white border border-red-200',
          unstyled: false,
          description: error instanceof Error ? error.message : undefined
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const operation = !canUpdateCalendar ? 'view' : tipoEventoEditar ? 'edit' : 'create';

  useEffect(() => {
    const nameValue = form.getValues('name');
    if (nameValue && operation === 'create') {
      const key = nameValue
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 10);
      form.setValue("key", key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('name'), operation]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {confirmingDelete
              ? "¿Eliminar tipo de evento?"
              : !canUpdateCalendar
                ? "Ver Tipo de Evento"
                : tipoEventoEditar
                  ? "Actualizar Tipo de Evento"
                  : "Crear Nuevo Tipo de Evento"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {confirmingDelete
              ? "Esta acción no se puede deshacer. El tipo de evento será eliminado permanentemente."
              : tipoEventoEditar
                ? "Modifica los datos del tipo de evento."
                : !canUpdateCalendar
                  ? "Información detallada del tipo de evento."
                  : "Define la información del nuevo tipo de evento para usarlo en tus actividades."}
          </DialogDescription>
        </DialogHeader>

        {confirmingDelete ? (
          <div>
            <div className="flex justify-end gap-3 pt-6 border-t">
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
                  <div className="animate-spin w-4 h-4 border-2 rounded-full border-white border-t-transparent" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Sí, eliminar
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <CrudFields
                fields={[{
                  name: 'name',
                  label: 'Nombre del Tipo de Evento',
                  type: 'text',
                  required: true,
                  placeholder: 'Ej: Reunión de Padres',
                }]}
                operation={operation}
                form={form as unknown as UseFormReturn<Record<string, unknown>>}
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
                        disabled={!canUpdateCalendar}
                        {...field}
                        placeholder="REUNION_PADRES"
                        className="h-11 font-mono"
                        style={{ textTransform: "uppercase" }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Solo mayúsculas, números y guiones bajos. Máximo 10
                      caracteres.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CrudFields
                fields={[{
                  name: 'description',
                  label: 'Descripción (Opcional)',
                  type: 'textarea',
                  placeholder: 'Descripción breve del tipo de evento...',
                  maxLength: 200,
                }]}
                operation={operation}
                form={form as unknown as UseFormReturn<Record<string, unknown>>}
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
                      <Select
                        disabled={!canUpdateCalendar}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border border-gray-300 ${colorOptions.find(c => c.value === field.value)?.preview || 'bg-gray-500'
                                  }`}
                                style={{ backgroundColor: selectedColor }}
                              />
                              {colorOptions.find((c) => c.value === selectedColor)?.label}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded-full border border-gray-300 ${color.preview}`}
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
                      <Select
                        disabled={!canUpdateCalendar}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const IconComponent = iconOptions.find(
                                  (i) => i.value === selectedIcon
                                )?.icon;
                                return IconComponent ? (
                                  <IconComponent className="w-4 h-4" />
                                ) : null;
                              })()}
                              {
                                iconOptions.find(
                                  (i) => i.value === selectedIcon
                                )?.label
                              }
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

              {tipoEventoEditar ? (
                <>
                  <CrudFields
                    fields={[{
                      name: 'status',
                      label: 'Estado',
                      type: 'select',
                      required: true,
                      options: [
                        { value: 'active', label: 'Activo' },
                        { value: 'inactive', label: 'Inactivo' },
                      ],
                    }]}
                    operation={operation}
                    form={form as unknown as UseFormReturn<Record<string, unknown>>}
                  />
                </>
              ) : (
                ""
              )}

              <div className="flex gap-3 pt-4 border-t justify-between">
                {canDeleteCalendar && !!tipoEventoEditar && (
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
                        "Guardando..."
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          <span>{tipoEventoEditar ? "Guardar" : "Crear"}</span>
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
