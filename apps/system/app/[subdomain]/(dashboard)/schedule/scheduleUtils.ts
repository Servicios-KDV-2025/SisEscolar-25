

export const hasTimeOverlap = (
  existingSchedules: Array<{startTime: string, endTime: string}>,
  newStartTime: string,
  newEndTime: string,
): boolean => {
  const newStart = convertTimeToMinutes(newStartTime);
  const newEnd = convertTimeToMinutes(newEndTime);
  
  return existingSchedules.some(schedule => {
    const existingStart = convertTimeToMinutes(schedule.startTime);
    const existingEnd = convertTimeToMinutes(schedule.endTime);
    
    // Verificar si hay solapamiento
    return (newStart >= existingStart && newStart < existingEnd) ||
           (newEnd > existingStart && newEnd <= existingEnd) ||
           (newStart <= existingStart && newEnd >= existingEnd);
  });
};

// export const convertTimeToMinutes = (timeString: string): number => {
//   const [hours, minutes] = timeString.split(':').map(Number);
//   return hours * 60 + minutes;
// }

export const convertTimeToMinutes = (timeString: string): number => {
  const parts = timeString.split(':');

  // Asegúrate de que el array tenga al menos 2 elementos
  if (parts.length < 2) {
    // Manejar el caso de un formato de tiempo incorrecto
    // Podrías lanzar un error o devolver 0, según tu lógica de negocio.
    throw new Error('Formato de tiempo inválido. Debe ser "HH:MM".');
  }

  const [hours, minutes] = parts.map(Number);

  // Validar si los valores convertidos son números válidos
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error('Formato de tiempo inválido. Las partes deben ser números.');
  }

  return hours * 60 + minutes;
};