"use client";

import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { EventCalendar, type CalendarEvent } from "components/calendar";
import {
  BookOpen,
  AlertTriangle,
  TrendingUp,
  School,
  Calendar as CalendarIcon,
} from "@repo/ui/icons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { useState, useMemo, useCallback, useEffect } from "react";
import { GenericId } from "convex/values";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { api } from "@repo/convex/convex/_generated/api";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import { useUser } from "@clerk/nextjs";
import { iconMap } from "lib/iconMap";
import { cn } from "lib/utils";
import { EventType } from "@/types/eventType";
import EventTypeDialog from "components/dialog/EventTypeDialog";
import { usePermissions } from "hooks/usePermissions";
import NotAuth from "../../../../../components/NotAuth";

interface TipoEventoConfig {
  id: GenericId<"eventType">;
  name: string;
  key: string;
  icon: string;
  color: string;
  colorB: string;
  status: string;
  bgLight: string;
  borderColor: string;
  icono: React.ElementType;
  description: string;
  colorBase: string;
 
}

export default function CalendarioEscolar() {
  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id);
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(
    currentUser?._id
  );

  const ciclosEscolares = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool ? { escuelaID: currentSchool.school._id } : "skip"
  );
  const tiposDeEventos = useQuery(
    api.functions.eventType.getEventType,
    currentSchool ? { schoolId: currentSchool.school._id } : "skip"
  );

  const crearEvento = useMutation(api.functions.calendar.createCalendarEvent);
  const editarEvento = useMutation(api.functions.calendar.updateCalendarEvent);
  const eliminarEvento = useMutation(
    api.functions.calendar.deleteCalendarEvent
  );

  const getTipoEventoById = useCallback(
    (tipoEventoId: string) => {
      return tiposDeEventos?.find(
        (tipo) => tipo._id === tipoEventoId || tipo.key === tipoEventoId
      );
    },
    [tiposDeEventos]
  );

  const [filtroCicloEscolarId, setFiltroCicloEscolarId] = useState<string>("");

  const eventos = useQuery(
    api.functions.calendar.getSchoolCycleCalendar,
    currentSchool?.school._id && filtroCicloEscolarId
      ? {
          schoolId: currentSchool?.school._id as Id<"school">,
          schoolCycleId: filtroCicloEscolarId as Id<"schoolCycle">,
        }
      : "skip"
  );

  const formattedEvents = useMemo((): CalendarEvent[] => {
    if (!eventos) {
      return []; // Devuelve vacío si no hay datos (cargando o 'skip')
    }
    return eventos.map((evento) => {
      // 1. Busca el tipo de evento correspondiente
      const tipoEvento = getTipoEventoById(evento.eventTypeId);

      // 2. Determina el color (usa el color del tipo o 'sky' por defecto)
      const eventColor = (tipoEvento?.color as CalendarEvent["color"]) || "blue";

      // 3. Mapea los campos
      return {
        id: evento._id,
        title: evento.title,
        description: evento.description,
        start: new Date(evento.startDate), // <-- Convierte timestamp a Date
        end: new Date(evento.endDate), // <-- Convierte timestamp a Date
        allDay: evento.allDay,
        location: evento.location,
        color: eventColor, // <-- ¡Usa el color del tipo de evento!
        eventTypeId: evento.eventTypeId, // <-- Pasa el ID al calendario
      };
    });
  }, [eventos, getTipoEventoById]);

  const {
    canCreateCalendar,
    canReadCalendar,
    canUpdateCalendar,
    canDeleteCalendar,
  } = usePermissions(currentSchool?.school._id);

  const handleEventAdd = async (event: CalendarEvent) => {
    // Estas IDs vienen del 'handleSave' en el modal (que arreglaremos en el Paso 3)
    const { title, description, start, end, allDay, location, eventTypeId } =
      event;
    const schoolId = currentSchool?.school._id;
    const schoolCycleId = filtroCicloEscolarId; // Tomamos el ciclo del filtro

    if (!schoolId || !schoolCycleId || !eventTypeId) {
      toast.error("Faltan datos para crear el evento (escuela, ciclo o tipo).");
      return;
    }

    try {
      await crearEvento({
        schoolId: schoolId as Id<"school">,
        schoolCycleId: schoolCycleId as Id<"schoolCycle">,
        title,
        description,
        startDate: start.getTime(),
        endDate: end.getTime(),
        allDay: allDay || false,
        location,
        eventTypeId: eventTypeId as Id<"eventType">,
      });
      toast.success(`Evento "${title}" creado`);
    } catch (error) {
      toast.error("Error al crear el evento.");
      console.error(error);
    }
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    // (Esta es la misma lógica que usamos para el Drag-n-Drop)
    const originalEvent = eventos?.find((e) => e._id === event.id);
    const schoolId = currentSchool?.school._id;

    if (!originalEvent || !schoolId) return;

    try {
      await editarEvento({
        schoolId: schoolId as Id<"school">,
        eventId: event.id as Id<"calendar">,
        startDate: event.start.getTime(),
        endDate: event.end.getTime(),
        title: event.title,
        description: event.description,
        allDay: event.allDay ?? false,
        location: event.location,
        eventTypeId: (event.eventTypeId ||
          originalEvent.eventTypeId) as Id<"eventType">,
        schoolCycleId: originalEvent.schoolCycleId,
        status: originalEvent.status,
      });
      toast.success(`Evento "${event.title}" actualizado`);
    } catch (error) {
      toast.error("Error al actualizar el evento.");
      console.error(error);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    const schoolId = currentSchool?.school._id;
    if (!schoolId) return;

    try {
      await eliminarEvento({
        schoolId: schoolId as Id<"school">,
        eventId: eventId as Id<"calendar">,
      });
      toast.success("Evento eliminado");
    } catch (error) {
      toast.error("Error al eliminar el evento.");
      console.error(error);
    }
  };
  // Tipos de eventos
  const [modalAbiertoT, setModalAbiertoT] = useState(false);
  const [tipoDeEventoEditar, setTipoDeEventoEditar] =
    useState<EventType | null>(null);

  useEffect(() => {
    if (
      Array.isArray(ciclosEscolares) &&
      ciclosEscolares.length > 0 &&
      !filtroCicloEscolarId
    ) {
      const ultimoCiclo = ciclosEscolares[ciclosEscolares.length - 1];
      if (ultimoCiclo && ultimoCiclo._id) {
        setFiltroCicloEscolarId(ultimoCiclo._id);
      }
    }
  }, [ciclosEscolares, filtroCicloEscolarId]);

  const convertirColorAClases = useCallback((color: string | undefined) => {
    // 1. Define el mapa de colores AQUÍ ADENTRO
    const localColorMap: Record<
      string,
      { color: string; bgLight: string; borderColor: string; dotColor: string }
    > = {
      blue: {
        color: "bg-blue-500 text-white",
        bgLight: "bg-blue-50",
        borderColor: "border-l-blue-300",
        dotColor: "before:bg-blue-500",
      },
      green: {
        color: "bg-green-500 text-white",
        bgLight: "bg-green-50",
        borderColor: "border-l-green-300",
        dotColor: "before:bg-green-500",
      },
      yellow: {
        color: "bg-yellow-500 text-white",
        bgLight: "bg-yellow-50",
        borderColor: "border-l-yellow-300",
        dotColor: "before:bg-yellow-500",
      },
      red: {
        color: "bg-red-500 text-white",
        bgLight: "bg-red-50",
        borderColor: "border-l-red-300",
        dotColor: "before:bg-red-500",
      },
      purple: {
        color: "bg-purple-500 text-white",
        bgLight: "bg-purple-50",
        borderColor: "border-l-purple-300",
        dotColor: "before:bg-purple-500",
      },
      cyan: {
        color: "bg-cyan-500 text-white",
        bgLight: "bg-cyan-50",
        borderColor: "border-l-cyan-300",
        dotColor: "before:bg-cyan-500",
      },
      orange: {
        color: "bg-orange-500 text-white",
        bgLight: "bg-orange-50",
        borderColor: "border-l-orange-300",
        dotColor: "before:bg-orange-500",
      },
      pink: {
        color: "bg-pink-500 text-white",
        bgLight: "bg-pink-50",
        borderColor: "border-l-pink-300",
        dotColor: "before:bg-pink-500",
      },
      // Colores de respaldo (los que tenías en types.ts)
      sky: {
        color: "bg-sky-500 text-white",
        bgLight: "bg-sky-50",
        borderColor: "border-l-sky-300",
        dotColor: "before:bg-sky-500",
      },
      amber: {
        color: "bg-amber-500 text-white",
        bgLight: "bg-amber-50",
        borderColor: "border-l-amber-300",
        dotColor: "before:bg-amber-500",
      },
      violet: {
        color: "bg-violet-500 text-white",
        bgLight: "bg-violet-50",
        borderColor: "border-l-violet-300",
        dotColor: "before:bg-violet-500",
      },
      rose: {
        color: "bg-rose-500 text-white",
        bgLight: "bg-rose-50",
        borderColor: "border-l-rose-300",
        dotColor: "before:bg-rose-500",
      },
      emerald: {
        color: "bg-emerald-500 text-white",
        bgLight: "bg-emerald-50",
        borderColor: "border-l-emerald-300",
        dotColor: "before:bg-emerald-500",
      },
      gray: {
        color: "bg-gray-500 text-white",
        bgLight: "bg-gray-50",
        borderColor: "border-l-gray-300",
        dotColor: "before:bg-gray-500",
      },
    };

    // 2. Si no hay color, devuelve el gris
    if (!color) {
      return localColorMap.gray;
    }

    // 3. Busca el color en el mapa local. Si no lo encuentra, devuelve gris.
    return localColorMap[color] || localColorMap.gray;
  }, []); // <-- El array vacío ahora es correcto, porque no depende de nada externo

  const tipoEventoMap = useMemo(() => {
    if (!tiposDeEventos) return {};

    return tiposDeEventos.reduce(
      (acc, tipo) => {
        
        const clases = convertirColorAClases(tipo.color) || {
          color: "bg-gray-500 text-white",
          bgLight: "bg-gray-50",
          borderColor: "border-l-gray-300",
        };

        const extractColorBase = (bgClass: string) => {
          const match = bgClass.match(/bg-([a-z]+)-\d+/);
          return match ? match[1] : "gray";
        };

        acc[tipo.key] = {
          id: tipo._id,
          name: tipo.name,
          key: tipo.key,
          icon: tipo.icon || "",
          status: tipo.status,
          color: clases.color,
          colorB: tipo.color || "",
          bgLight: clases.bgLight,
          borderColor: clases.borderColor,
          icono: iconMap[tipo.icon || "BookOpen"] || BookOpen,
          description: tipo.description || "Sin descripción",
          colorBase: extractColorBase(clases.color || "bg-gray-500") || "gray",
          
        };

        return acc;
      },
      {} as Record<string, TipoEventoConfig>
    );
  }, [tiposDeEventos, convertirColorAClases]);

  if (schoolLoading || (currentUser && !currentSchool)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Cargando información de la escuela...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {canReadCalendar ? (
        <div>
          <div className="container mx-auto px-6 py-6">
            <div className="text-center space-y-4">
              <div className="flex mt-2 justify-end">
                <Select
                  value={filtroCicloEscolarId}
                  onValueChange={setFiltroCicloEscolarId}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                    <School className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por ciclo escolar" />
                  </SelectTrigger>
                  <SelectContent>
                    {ciclosEscolares?.map((ciclo) => (
                      <SelectItem key={ciclo._id} value={ciclo._id}>
                        {ciclo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center items-center gap-3 mb-5">
                <div className="p-3 rounded-full backdrop-blur-sm">
                  <School className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Calendario Escolar
                </h1>
              </div>
              <p className="text-xl max-w-2xl mx-auto">
                Gestiona eventos, exámenes y actividades escolares de manera
                eficiente y organizada
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="row-span-2 col-span-3 lg:col-span-2 xl:col-span-3">
              <EventCalendar
                events={formattedEvents}
                onEventAdd={handleEventAdd}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                eventTypes={tiposDeEventos}
                onAddNewEventType={() => {
                  setModalAbiertoT(false);
                  setModalAbiertoT(true);
                }}
              />
            </div>

            <div className="col-span-2 xl:col-span-1">
              <Card className="lg:col-span-1 shadow-xl bg-white/90 backdrop-blur-md">
                <CardContent className="px-4">
                  <CardHeader className="flex flex-row justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-md">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-slate-800">
                          Eventos/Categoria
                        </CardTitle>
                        <p className="text-slate-600 text-sm">
                          Personaliza tus tipos de eventos
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator className="bg-black/10" />
                  <div className="space-y-4 pt-4">
                    {Object.entries(tipoEventoMap).map(([tipo, config]) => {
                      const IconComponent = config.icono;
                      const tipoDeEvento: EventType = {
                        _id: config.id,
                        schoolId: currentSchool?.school._id as Id<"school">,
                        name: config.name,
                        key: config.key,
                        description: config.description,
                        color: config.color,
                        icon: config.icon,
                        status: config.status,
                      };
                      return (
                        <div
                          key={tipo}
                          onClick={() => {
                            setTipoDeEventoEditar(tipoDeEvento as EventType);
                            setModalAbiertoT(true);
                          }}
                          className={cn(
                            "p-4 rounded-xl  transition-all duration-200 hover:shadow-md cursor-pointer",
                            config.bgLight,
                            config.borderColor.replace("border-l-", "border-")
                          )}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={cn(
                                "p-2 rounded-lg shadow-sm transition-all duration-200",
                                config.color,
                                "group-hover:shadow-md"
                              )}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-800">
                                {config.name}
                              </h3>
                            </div>
                            <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                          </div>
                          {config.description && (
                            <p className="text-sm text-slate-700 ml-0 sm:ml-11 leading-relaxed break-words">
                              {(() => {
                                const maxWords = 15;
                                const maxChars = 80;
                                let desc = config.description;
                                // Limita palabras
                                const words = desc.split(" ");
                                if (words.length > maxWords) {
                                  desc = words.slice(0, maxWords).join(" ");
                                }
                                // Limita caracteres
                                if (desc.length > maxChars) {
                                  desc = desc.slice(0, maxChars) + "...";
                                }
                                return desc.endsWith(".") ? desc : desc + ".";
                              })()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex mt-6 pl-1">
                    {canCreateCalendar && (
                      <Button
                        onClick={() => {
                          setTipoDeEventoEditar(null);
                          setModalAbiertoT(true);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 shadow-lg rounded-lg px-4 py-2 flex items-center justify-center transition-transform duration-150 hover:scale-105 "
                        aria-label="Agregar tipo de evento"
                        title="Agregar tipo de evento"
                      >
                        Crear nuevo tipo de evento
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <EventTypeDialog
            isOpen={modalAbiertoT}
            onOpenChange={(open) => {
              if (!open) {
                setTipoDeEventoEditar(null);
              }
              setModalAbiertoT(open);
            }}
            canUpdateCalendar={canUpdateCalendar}
            canDeleteCalendar={canDeleteCalendar}
            tipoEventoEditar={tipoDeEventoEditar}
            escuelaId={currentSchool?.school._id as Id<"school">}
          />
        </div>
      ) : (
        <NotAuth
          pageName="Calendario Escolar"
          pageDetails="Gestiona eventos, exámenes y actividades escolares de manera eficiente y organizada"
          icon={CalendarIcon}
        />
      )}
    </>
  );
}
