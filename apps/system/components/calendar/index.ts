"use client";

// Component exports
export { AgendaView } from "./Agenda-view";
export { DayView } from "./day-view";
export { DraggableEvent } from "./draggable-event";
export { DroppableCell } from "./droppable-cell";
export { EventDialog } from "./event-dialog";
export { EventItem } from "./event-item";
export { EventsPopup } from "./event-popup";
export { EventCalendar } from "./event-calendar";
export { MonthView } from "./month-view";
export { WeekView } from "./week-view";
export { CalendarDndProvider, useCalendarDnd } from "./Calendar-dnd-context";

// Constants and utility exports
export * from "../../app/[subdomain]/(dashboard)/administracion/calendario-escolar/constants";
export * from "../../utils/utils";

// Hook exports
export * from "../../hooks/use-current-time-indicator";
export * from "../../hooks/use-event-visibility";

// Type exports
export type { CalendarEvent, CalendarView, EventColor } from "../../app/[subdomain]/(dashboard)/administracion/calendario-escolar/types";