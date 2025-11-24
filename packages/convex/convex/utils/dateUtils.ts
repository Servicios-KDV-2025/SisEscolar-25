"use node";

import { format, toZonedTime } from 'date-fns-tz';

export const MEXICO_TIMEZONE = 'America/Mexico_City';

/**
 * Obtiene la fecha actual en zona horaria de México
 */
export const getCurrentDateMexico = (): Date => {
  const now = new Date();
  return toZonedTime(now, MEXICO_TIMEZONE);
};

/**
 * Obtiene el timestamp actual en zona horaria de México
 */
export const getCurrentTimestampMexico = (): number => {
  return getCurrentDateMexico().getTime();
};

/**
 * Formatea la fecha actual en zona horaria de México
 */
export const getFormattedDateMexico = (formatString: string = 'dd/MM/yyyy HH:mm:ss'): string => {
  const mexicoDate = getCurrentDateMexico();
  return format(mexicoDate, formatString, { timeZone: MEXICO_TIMEZONE });
};

