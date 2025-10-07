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
  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
}