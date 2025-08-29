"use client";

import { useQuery } from "convex/react";
import { Calendar } from "@repo/ui/components/shadcn/calendar";
import { BookOpen, AlertTriangle, Bell, TrendingUp, School, CalendarDays, Calendar as CalendarIcon } from "@repo/ui/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { useState, useMemo, useCallback, useEffect } from "react";
import { GenericId } from "convex/values";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { api } from "@repo/convex/convex/_generated/api";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import { useUser } from "@clerk/nextjs";
import { colorMap, iconMap } from "lib/iconMap";
import { format } from "date-fns";
import { cn } from "lib/utils";
import { es } from "date-fns/locale";
import { CalendarType } from "@/types/calendar";
import { EventType } from "@/types/eventType";
import EventTypeDialog from "components/dialog/EventTypeDialog";
import EventDialog from "components/dialog/EventDialog";

interface TipoEventoConfig {
  id: GenericId<"eventType">
  name: string
  key: string
  icon: string
  color: string
  colorB: string
  status: string
  bgLight: string
  borderColor: string
  icono: React.ElementType
  description: string
  colorBase: string
  dotColor: string
}

export default function CalendarioEscolar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const {
    currentSchool,
    isLoading: schoolLoading,
  } = useCurrentSchool(currentUser?._id);

  const ciclosEscolares = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool ? { escuelaID: currentSchool.school._id } : "skip"
  )
  const tiposDeEventos = useQuery(
    api.functions.eventType.getEventType,
    currentSchool ? { schoolId: currentSchool.school._id } : "skip"
  )

  const getTipoEventoById = useCallback((tipoEventoId: string) => {
    return tiposDeEventos?.find(tipo => tipo._id === tipoEventoId || tipo.key === tipoEventoId);
  }, [tiposDeEventos]);

  const [filtroCicloEscolarId, setFiltroCicloEscolarId] = useState<string>("")

  const eventos = useQuery(
    api.functions.calendar.getSchoolCycleCalendar,
    currentSchool?.school._id && filtroCicloEscolarId
      ? {
        schoolId: currentSchool?.school._id as Id<"school">,
        schoolCycleId: filtroCicloEscolarId as Id<"schoolCycle">
      }
      : "skip"
  )



  // Calendarios
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eventoEditar, setEventoEditar] = useState<CalendarType | null>(null);
  type ModoEvento = "editar" | "ver" | "eliminar" | null;
  const [modoDialogo, setModoDialogo] = useState<ModoEvento>();

  // Tipos de eventos
  const [modalAbiertoT, setModalAbiertoT] = useState(false);
  const [tipoDeEventoEditar, setTipoDeEventoEditar] = useState<EventType | null>(null);
  type ModoTipoDeEvento = "editar" | "ver" | "eliminar" | null;
  const [modoDialogoT, setModoDialogoT] = useState<ModoTipoDeEvento>();

  useEffect(() => {
    if (Array.isArray(ciclosEscolares) && ciclosEscolares.length > 0 && !filtroCicloEscolarId) {
      const ultimoCiclo = ciclosEscolares[ciclosEscolares.length - 1];
      if (ultimoCiclo && ultimoCiclo._id) {
        setFiltroCicloEscolarId(ultimoCiclo._id);
      }
    }
  }, [ciclosEscolares, filtroCicloEscolarId]);

  const convertirColorAClases = useCallback((color: string | undefined) => {
    if (!color) return {
      color: "bg-gray-500 text-white",
      bgLight: "bg-gray-50",
      borderColor: "border-l-gray-300",
      dotColor: "before:bg-gray-500"
    }

    return colorMap[color] || {
      color: "bg-gray-500 text-white",
      bgLight: "bg-gray-50",
      borderColor: "border-l-gray-300",
      dotColor: "before:bg-gray-500"
    };
  }, [])

  const tipoEventoMap = useMemo(() => {
    if (!tiposDeEventos) return {};

    return tiposDeEventos.reduce((acc, tipo) => {
      const clases = convertirColorAClases(tipo.color);
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
        dotColor: clases.dotColor,
      };

      return acc;
    }, {} as Record<string, TipoEventoConfig>);
  }, [tiposDeEventos, convertirColorAClases]);


  const datosCalendario = useMemo(() => {
    if (!eventos) return {
      fechasConEventos: new Map<string, string>(),
      contadorEventos: {} as Record<string, number>,
      eventosDelDia: [],
      eventosFiltrados: []
    };

    const fechasConEventos = new Map<string, string>();
    const contadorEventos: Record<string, number> = {};
    const eventosDelDia: typeof eventos = [];


    eventos.forEach((evento) => {
      const fecha = format(new Date(evento.date), "yyyy-MM-dd");
      const tipoClave = evento.eventTypeId.toLowerCase().trim();
      const tipoEvento = getTipoEventoById(evento.eventTypeId);

      fechasConEventos.set(fecha, tipoEvento?.key || "");
      contadorEventos[tipoClave] = (contadorEventos[tipoClave] || 0) + 1;

      if (selectedDate && format(selectedDate, "yyyy-MM-dd") === fecha) {
        eventosDelDia.push(evento);
      }
    });

    return { fechasConEventos, contadorEventos, eventosDelDia, eventos };
  }, [eventos, selectedDate, getTipoEventoById]);

  const normalizarFecha = (fecha: Date | string) => {
    const f = typeof fecha === "string" ? new Date(fecha) : fecha;
    return format(f, "yyyy-MM-dd");
  };

  const getTipoEvento = useCallback((date: Date) => {
    const fechaStr = normalizarFecha(date);
    const tipo = datosCalendario.fechasConEventos.get(fechaStr);
    return tipo;
  }, [datosCalendario.fechasConEventos]);

  const generateModifiers = useCallback(() => {
    const modifiers: Record<string, (date: Date) => boolean> = {};

    for (const tipoClave in tipoEventoMap) {
      modifiers[tipoClave] = (date: Date) => {
        const tipo = getTipoEvento(date);
        return tipo === tipoClave;
      };
    }

    return modifiers;
  }, [tipoEventoMap, getTipoEvento]);

  const generateModifiersClassNames = useCallback(() => {
    const classNames: Record<string, string> = {};
    const dotColorMap: Record<string, string> = {
      blue: 'after:bg-blue-500 after:border-blue-600 hover:ring-blue-300/50',
      pink: 'after:bg-pink-500 after:border-pink-600 hover:ring-pink-300/50',
      yellow: 'after:bg-yellow-500 after:border-yellow-600 hover:ring-yellow-300/50',
      gray: 'after:bg-gray-500 after:border-gray-600 hover:ring-gray-300/50',
      green: 'after:bg-green-500 after:border-green-600 hover:ring-green-300/50',
      purple: 'after:bg-purple-500 after:border-purple-600 hover:ring-purple-300/50',
      cyan: 'after:bg-cyan-500 after:border-cyan-600 hover:ring-cyan-300/50',
      orange: 'after:bg-orange-500 after:border-orange-600 hover:ring-orange-300/50',
      red: 'after:bg-red-500 after:border-red-600 hover:ring-red-300/50',
    };

    for (const tipoClave in tipoEventoMap) {
      const config = tipoEventoMap[tipoClave];
      const color = config?.colorBase ?? "gray";
      const dotClasses = dotColorMap[color] ?? dotColorMap.gray;

      classNames[tipoClave] = cn(
        "hover:scale-110 sm:p-1",
        "after:content-[''] after:absolute after:top-1.5 after:right-1.5 after:w-1 sm:after:w-1.5 md:after:w-2.5",
        "after:h-1 sm:after:h-1.5 md:after:h-2.5 after:rounded-full after:shadow-sm",
        dotClasses
      );
    }
    return classNames;
  }, [tipoEventoMap]);

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
    <div>
      <div className="container mx-auto px-6 py-6">
        <div className="text-center space-y-4">
          <div className="flex mt-2 justify-end">
            <Select value={filtroCicloEscolarId} onValueChange={setFiltroCicloEscolarId}>
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
            <h1 className="text-4xl font-bold tracking-tight">Sistema Escolar</h1>
          </div>
          <p className="text-xl max-w-2xl mx-auto">
            Gestiona eventos, exámenes y actividades escolares de manera eficiente y organizada
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="row-span-3 xl:col-span-1">
          {selectedDate && (
            <Card className="shadow-lg bg-white/90 backdrop-blur-md mb-2">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-800">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold">
                      {format(selectedDate, "d 'de' MMMM", { locale: es })}
                    </div>
                    <div className="text-sm text-slate-600 font-normal">
                      {format(selectedDate, "yyyy")}
                    </div>
                  </div>
                  {datosCalendario.eventosDelDia.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {datosCalendario.eventosDelDia.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {datosCalendario.eventosDelDia.length > 0 ? (
                  <div className="space-y-3 max-h-84 overflow-y-auto">
                    {datosCalendario.eventosDelDia.map((evento, index) => {
                      const tipoEvento = getTipoEventoById(evento.eventTypeId);
                      const config = tipoEvento ? tipoEventoMap[tipoEvento.key] : null;
                      const IconComponent = config?.icono || CalendarIcon;
                      return (
                        <div
                          key={index}
                          className={cn(
                            "p-4 rounded-xl border-l-4 mx-2",
                            config?.bgLight || "bg-gray-50",
                            config?.borderColor || "border-l-gray-300"
                          )}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={cn(
                              "p-2 rounded-lg shadow-sm",
                              config?.color || "bg-gray-500 text-white"
                            )}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <span className="font-semibold text-slate-800 capitalize">
                                {config?.name || evento.eventTypeId}
                              </span>
                              <div className="text-xs text-slate-500">
                                {format(new Date(evento.date), "d 'de' MMMM", { locale: es })}
                              </div>
                            </div>
                          </div>
                          {evento.description && (
                            <p className="text-sm text-slate-700 ml-0 sm:ml-11 leading-relaxed break-words">
                              {
                                (() => {
                                  const maxWords = 15;
                                  const maxChars = 80;
                                  let desc = evento.description;
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
                                })()
                              }
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">
                      No hay eventos programados
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      para este día
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg bg-white/90 backdrop-blur-md mb-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-800">
                <div className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-md">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                Próximos eventos
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm mt-1 ">
                Los eventos más cercanos en el calendario escolar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {datosCalendario.eventos && datosCalendario.eventos?.length > 0 ? (
                <div className="space-y-3 max-h-84 overflow-y-auto">
                  {datosCalendario.eventos
                    ?.filter(evento => new Date(evento.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 5)
                    .map((evento, index) => {
                      const tipoEvento = getTipoEventoById(evento.eventTypeId);
                      const config = tipoEvento ? tipoEventoMap[tipoEvento.key] : null;
                      const IconComponent = config?.icono || CalendarIcon;

                      return (
                        <div
                          key={index}
                          onClick={() => {
                            setEventoEditar(evento as CalendarType)
                            setModoDialogo("editar");
                            setModalAbierto(true)
                          }}
                          className={cn(
                            "p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer",
                            "w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl", // Responsivo
                            "mx-auto", // Centra en pantallas pequeñas
                            config?.bgLight || "bg-gray-50",
                            config?.borderColor || "border-l-gray-300"
                          )}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
                            <div className={cn(
                              "p-2 rounded-lg shadow-sm",
                              config?.color || "bg-gray-500 text-white"
                            )}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <span className="font-semibold text-slate-800 capitalize">
                                {config?.name || evento.eventTypeId}
                              </span>
                              <div className="text-xs text-slate-500">
                                {format(new Date(evento.date), "d 'de' MMMM", { locale: es })}
                              </div>
                            </div>
                          </div>
                          {evento.description && (
                            <p className="text-sm text-slate-700 ml-0 sm:ml-11 leading-relaxed break-words">
                              {
                                (() => {
                                  const maxWords = 15;
                                  const maxChars = 80;
                                  let desc = evento.description;
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
                                })()
                              }
                            </p>
                          )}
                        </div>
                      );
                    })}
                  {datosCalendario.eventos?.filter(evento => new Date(evento.date) >= new Date()).length === 0 && (
                    <div className="text-center py-8">
                      <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">
                        No hay próximos eventos programados
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        Revisa el calendario para más información
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">
                    No hay próximos eventos programados
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Revisa el calendario para más información
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="row-span-2 col-span-2 ">
          <Card className="shadow-lg bg-white/90 backdrop-blur-md">
            <CardContent className="p-6">
              <CardHeader className="flex flex-col items-center text-center pb-4 justify-center">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-center">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-800">
                        Calendario Escolar
                      </CardTitle>
                      <p className="text-slate-600 text-sm pl-7">
                        Gestiona y visualiza el año académico
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <Separator className="bg-black/10" />

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                captionLayout="dropdown"
                locale={es}
                className="rounded-xl shadow-sm border bg-white mx-auto mt-5"
                classNames={{
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-slate-600 rounded-md w-14 font-semibold text-sm uppercase tracking-wider text-center py-2",
                  row: "flex w-full mt-2",
                  cell: cn(
                    "h-8 w-8 sm:h-11 sm:w-11 md:w-14 md:h-14",
                    "text-center text-sm p-0 relative",
                    "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                    "focus-within:relative focus-within:z-20"
                  ),
                  day: cn(
                    "h-8 w-8 sm:h-11 sm:w-11 md:w-14 md:h-14 text-sm relative",
                    "p-0 font-medium aria-selected:opacity-70 rounded-xl transition-all duration-100",
                    "hover:bg-slate-100 hover:scale-105 hover:shadow-md",
                    "focus:bg-blue-50 focus:text-blue-700 focus:ring-2 focus:ring-blue-300"
                  ),
                  day_button:
                    'data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-black',
                  selected: 'bg-transparent border-1 sm:border-2 p-0 border-blue-300 text-black font-semibold',
                  today: 'bg-slate-100',
                  day_selected: "ring-2 ring-slate-400 bg-slate-100 text-slate-900 font-bold",
                  day_today: "ring-2 ring-slate-400 bg-slate-100 text-slate-900 font-bold",
                  day_outside: "text-slate-300 opacity-40",
                  day_disabled: "text-slate-300 opacity-30 cursor-not-allowed",
                  day_range_middle: "aria-selected:bg-blue-50 aria-selected:text-blue-700",
                  day_hidden: "invisible",
                }}
                modifiers={generateModifiers()}
                modifiersClassNames={generateModifiersClassNames()}
              />
              <div className="flex justify-center mt-6 pl-4">
                <Button
                  onClick={() => {
                    setEventoEditar(null)
                    setModoDialogo(null);
                    setModalAbierto(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition duration-150 hover:scale-105"
                >
                  Crear nuevo evento
                </Button>
              </div>
            </CardContent>
          </Card>
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
                      Tipos de Eventos
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
                    color: config.colorB,
                    icon: config.icon,
                    status: config.status

                  }
                  return (
                    <div
                      key={tipo}
                      onClick={() => {
                        setTipoDeEventoEditar(tipoDeEvento as EventType)
                        setModoDialogoT("editar");
                        setModalAbiertoT(true)

                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md cursor-pointer",
                        config.bgLight,
                        config.borderColor.replace('border-l-', 'border-')
                      )}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "p-2 rounded-lg shadow-sm transition-all duration-200",
                          config.color,
                          "group-hover:shadow-md"
                        )}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-800">{config.name}</h3>
                        </div>
                        <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </div>
                      {config.description && (
                            <p className="text-sm text-slate-700 ml-0 sm:ml-11 leading-relaxed break-words">
                              {
                                (() => {
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
                                })()
                              }
                            </p>
                          )}
                    </div>
                  );
                })}
              </div>
              <div className="flex mt-6 pl-1">
                <Button
                  onClick={() => {
                    setTipoDeEventoEditar(null)
                    setModoDialogoT(null);
                    setModalAbiertoT(true)
                  }}
                  className="bg-amber-600 hover:bg-amber-700 shadow-lg rounded-lg px-4 py-2 flex items-center justify-center transition-transform duration-150 hover:scale-105 "
                  aria-label="Agregar tipo de evento"
                  title="Agregar tipo de evento">
                  Crear nuevo tipo de evento
                </Button>
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
        modo={modoDialogoT}
        tipoEventoEditar={tipoDeEventoEditar ?? undefined}
        escuelaId={currentSchool?.school._id as Id<"school">}
      />
      <EventDialog
        isOpen={modalAbierto}
        onOpenChange={(open) => {
          if (!open) {
            setEventoEditar(null);
          }
          setModalAbierto(open);
        }}
        modo={modoDialogo}
        escuelaId={currentSchool?.school._id as Id<"school">}
        eventoEditar={eventoEditar ?? undefined}
      />
    </div>

  );
}