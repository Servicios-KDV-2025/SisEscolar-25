"use client";

import { useState } from "react";
import { addDays, setHours, setMinutes, subDays } from "date-fns";
import React from "react";
import { EventCalendar, type CalendarEvent } from "components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import {
  AlertTriangle,
  School,
} from "@repo/ui/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import { Separator } from "@repo/ui/components/shadcn/separator";

// Sample events data with hardcoded times
const sampleEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Annual Planning",
    description: "Strategic planning for next year",
    start: subDays(new Date(), 24),
    end: subDays(new Date(), 23),
    allDay: true,
    color: "sky",
    location: "Main Conference Hall",
  },
  {
    id: "2",
    title: "Project Deadline",
    description: "Submit final deliverables",
    start: setMinutes(setHours(subDays(new Date(), 9), 13), 0), // 1:00 PM, 9 days before
    end: setMinutes(setHours(subDays(new Date(), 9), 15), 30), // 3:30 PM, 9 days before
    color: "amber",
    location: "Office",
  },
  {
    id: "3",
    title: "Quarterly Budget Review",
    description: "Strategic planning for next year",
    start: subDays(new Date(), 13), // 13 days before today
    end: subDays(new Date(), 13), // 13 days before today
    allDay: true,
    color: "orange",
    location: "Main Conference Hall",
  },
  {
    id: "4",
    title: "Team Meeting",
    description: "Weekly team sync",
    start: setMinutes(setHours(new Date(), 10), 0), // 10:00 AM today
    end: setMinutes(setHours(new Date(), 11), 0), // 11:00 AM today
    color: "sky",
    location: "Conference Room A",
  },
  {
    id: "5",
    title: "Lunch with Client",
    description: "Discuss new project requirements",
    start: setMinutes(setHours(addDays(new Date(), 1), 12), 0), // 12:00 PM, 1 day from now
    end: setMinutes(setHours(addDays(new Date(), 1), 13), 15), // 1:15 PM, 1 day from now
    color: "emerald",
    location: "Downtown Cafe",
  },
  {
    id: "6",
    title: "Product Launch",
    description: "New product release",
    start: addDays(new Date(), 3), // 3 days from now
    end: addDays(new Date(), 6), // 6 days from now
    allDay: true,
    color: "violet",
  },
  {
    id: "7",
    title: "Sales Conference",
    description: "Discuss about new clients",
    start: setMinutes(setHours(addDays(new Date(), 4), 14), 30), // 2:30 PM, 4 days from now
    end: setMinutes(setHours(addDays(new Date(), 5), 14), 45), // 2:45 PM, 5 days from now
    color: "rose",
    location: "Downtown Cafe",
  },
  {
    id: "8",
    title: "Team Meeting",
    description: "Weekly team sync",
    start: setMinutes(setHours(addDays(new Date(), 5), 9), 0), // 9:00 AM, 5 days from now
    end: setMinutes(setHours(addDays(new Date(), 5), 10), 30), // 10:30 AM, 5 days from now
    color: "orange",
    location: "Conference Room A",
  },
  {
    id: "9",
    title: "Review contracts",
    description: "Weekly team sync",
    start: setMinutes(setHours(addDays(new Date(), 5), 14), 0), // 2:00 PM, 5 days from now
    end: setMinutes(setHours(addDays(new Date(), 5), 15), 30), // 3:30 PM, 5 days from now
    color: "sky",
    location: "Conference Room A",
  },
  {
    id: "10",
    title: "Team Meeting",
    description: "Weekly team sync",
    start: setMinutes(setHours(addDays(new Date(), 5), 9), 45), // 9:45 AM, 5 days from now
    end: setMinutes(setHours(addDays(new Date(), 5), 11), 0), // 11:00 AM, 5 days from now
    color: "amber",
    location: "Conference Room A",
  },
  {
    id: "11",
    title: "Marketing Strategy Session",
    description: "Quarterly marketing planning",
    start: setMinutes(setHours(addDays(new Date(), 9), 10), 0), // 10:00 AM, 9 days from now
    end: setMinutes(setHours(addDays(new Date(), 9), 15), 30), // 3:30 PM, 9 days from now
    color: "emerald",
    location: "Marketing Department",
  },
  {
    id: "12",
    title: "Annual Shareholders Meeting",
    description: "Presentation of yearly results",
    start: addDays(new Date(), 17), // 17 days from now
    end: addDays(new Date(), 17), // 17 days from now
    allDay: true,
    color: "sky",
    location: "Grand Conference Center",
  },
  {
    id: "13",
    title: "Product Development Workshop",
    description: "Brainstorming for new features",
    start: setMinutes(setHours(addDays(new Date(), 26), 9), 0), // 9:00 AM, 26 days from now
    end: setMinutes(setHours(addDays(new Date(), 27), 17), 0), // 5:00 PM, 27 days from now
    color: "rose",
    location: "Innovation Lab",
  },
];

export default function Page() {
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents([...events, event]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(
      events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  return (
    <div className="p-6">
      <div className="text-center  mb-8">
        <div className="flex justify-center items-center gap-3 mb-5">
          <div className="p-3 rounded-full backdrop-blur-sm">
            <School className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Calendario Escolar
          </h1>
        </div>
        <p className="text-xl max-w-2xl mx-auto">
          Gestiona eventos, exámenes y actividades escolares de manera eficiente
          y organizada
        </p>
      </div>
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendario  */}
         <div className="lg:col-span-3 rounded-lg ">
          <EventCalendar
            events={events}
            onEventAdd={handleEventAdd}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
          />
        </div>
        

        <div className="col-span-1 flex flex-col gap-6 ">
          {/* --- Caja inferior de la sidebar --- */}
          
            <div className="col-span-2 xl:col-span-1">
              <Card className="lg:col-span-1 shadow-xl bg-white/90 backdrop-blur-md">
                <CardContent className="">
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
                    {/* {Object.entries(tipoEventoMap).map(([tipo, config]) => {
                      const IconComponent = config.icono;
                      const tipoDeEvento: EventType = {
                        _id: config.id,
                        schoolId: currentSchool?.school._id as Id<"school">,
                        name: config.name,
                        key: config.key,
                        description: config.description,
                        color: config.colorB,
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
                    })} */}
                  </div>
                  <div className="flex mt-6 pl-1">
                    {true && (
                      <Button
                        onClick={() => {
                          // setTipoDeEventoEditar(null);
                          // setModalAbiertoT(true);
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
         
      </main>
    </div>
  );
}
