export type CalendarView = "mes" | "semana" | "dia" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  location?: string;
  eventTypeId?: string;
}

export type EventColor =
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "purple"
  | "cyan"
  | "orange"
  | "pink"
  | "gray";
