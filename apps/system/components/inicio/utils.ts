/**
 * Convierte hora de formato 24h a 12h con AM/PM
 * @param time24 - Hora en formato 24h (ej: "14:30")
 * @returns Hora en formato 12h (ej: "2:30 PM")
 */
export const convertTo12HourFormat = (time24: string): string => {
  const parts = time24.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

/**
 * Formatea tiempo relativo desde un timestamp
 * @param timestamp - Timestamp en milisegundos
 * @returns Texto relativo (ej: "Hace 2 horas")
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffInMs = now - timestamp;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Justo ahora";
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""}`;
  if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`;
  
  const weeks = Math.floor(diffInDays / 7);
  return `Hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
};

