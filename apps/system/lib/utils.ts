import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const rootDomain =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatFecha = (dateInput: string | number | Date): string => {
  const fecha = new Date(dateInput);
  const mes = fecha.toLocaleDateString('es-MX', { month: 'long' });
  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
  const dia = fecha.toLocaleDateString('es-MX', { day: 'numeric' });

  return `${mesCapitalizado} ${dia}`;
};

export const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const formatCurrency = (amount: number) => {
  return amount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseLocalDateString(dateString: string): number {
  if (!dateString) throw new Error("Invalid date string");

  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3) throw new Error("Invalid date format");

  const [year, month, day] = parts;

  if (
    typeof year !== "number" || isNaN(year) ||
    typeof month !== "number" || isNaN(month) ||
    typeof day !== "number" || isNaN(day)
  ) {
    throw new Error("Invalid date values");
  }
  return new Date(year, month - 1, day).getTime();
}