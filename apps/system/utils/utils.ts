import { isSameDay } from "date-fns";

import type { CalendarEvent, EventColor } from "../components/calendar";

const GRAY_FALLBACK = {
  main: "bg-gray-500 text-white",
  light: "bg-gray-50 hover:bg-gray-100 dark:bg-gray-400/25 dark:hover:bg-gray-400/20",
  border: "border-gray-300",
};


const colorMap: Record<string, { main: string; light: string; border: string }> = {
  blue: {
    main: "bg-blue-500 text-white",
    light: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-400/25 dark:hover:bg-blue-400/20",
    border: "border-blue-300",
  },
  green: {
    main: "bg-green-500 text-white",
    light: "bg-green-50 hover:bg-green-100 dark:bg-green-400/25 dark:hover:bg-green-400/20",
    border: "border-green-300",
  },
  yellow: {
    main: "bg-yellow-500 text-white",
    light: "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-400/25 dark:hover:bg-yellow-400/20",
    border: "border-yellow-300",
  },
  red: {
    main: "bg-red-500 text-white",
    light: "bg-red-50 hover:bg-red-100 dark:bg-red-400/25 dark:hover:bg-red-400/20",
    border: "border-red-300",
  },
  purple: {
    main: "bg-purple-500 text-white",
    light: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-400/25 dark:hover:bg-purple-400/20",
    border: "border-purple-300",
  },
  cyan: {
    main: "bg-cyan-500 text-white",
    light: "bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-400/25 dark:hover:bg-cyan-400/20",
    border: "border-cyan-300",
  },
  orange: {
    main: "bg-orange-500 text-white",
    light: "bg-orange-50 hover:bg-orange-100 dark:bg-orange-400/25 dark:hover:bg-orange-400/20",
    border: "border-orange-300",
  },
  pink: {
    main: "bg-pink-500 text-white",
    light: "bg-pink-50 hover:bg-pink-100 dark:bg-pink-400/25 dark:hover:bg-pink-400/20",
    border: "border-pink-300",
  },
  // --- Colores antiguos (AHORA COMPLETOS) ---
  sky: { 
    main: "bg-sky-500 text-white", 
    light: "bg-sky-200/50 hover:bg-sky-200/40 dark:bg-sky-400/25 dark:hover:bg-sky-400/20", 
    border: "border-sky-300" 
  },
  amber: { 
    main: "bg-amber-500 text-white", 
    light: "bg-amber-200/50 hover:bg-amber-200/40 dark:bg-amber-400/25 dark:hover:bg-amber-400/20", 
    border: "border-amber-300" 
  },
  violet: { 
    main: "bg-violet-500 text-white", 
    light: "bg-violet-200/50 hover:bg-violet-200/40 dark:bg-violet-400/25 dark:hover:bg-violet-400/20", 
    border: "border-violet-300" 
  },
  rose: { 
    main: "bg-rose-500 text-white", 
    light: "bg-rose-200/50 hover:bg-rose-200/40 dark:bg-rose-400/25 dark:hover:bg-rose-400/20", 
    border: "border-rose-300" 
  },
  emerald: { 
    main: "bg-emerald-500 text-white", 
    light: "bg-emerald-200/50 hover:bg-emerald-200/40 dark:bg-emerald-400/25 dark:hover:bg-emerald-400/20", 
    border: "border-emerald-300" 
  },
  // --- Color de respaldo ---
  gray: GRAY_FALLBACK,
};

export function getEventColorClasses(color?: EventColor | string): string {
  const colorName = (color as string) || "gray";
  const colors = colorMap[colorName] || colorMap.gray|| GRAY_FALLBACK;
  return colors.light; // Devuelve las clases 'light' (ej. bg-yellow-200/50)
}
export function getFullColorClasses(color?: string | null): { main: string; light: string; border: string } {
  const colorName = color || "gray";
  return colorMap[colorName] || colorMap.gray|| GRAY_FALLBACK;
}
/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(isFirstDay: boolean, isLastDay: boolean): string {
  if (isFirstDay && isLastDay) {
    return "rounded"; // Both ends rounded
  } else if (isFirstDay) {
    return "rounded-l rounded-r-none"; // Only left end rounded
  } else if (isLastDay) {
    return "rounded-r rounded-l-none"; // Only right end rounded
  } else {
    return "rounded-none"; // No rounded corners
  }
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return event.allDay || eventStart.getDate() !== eventEnd.getDate();
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) || isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * Get all events for a day (for agenda view)
 */
export function getAgendaEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}