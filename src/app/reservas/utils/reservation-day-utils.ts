/**
 * Utilidades para manejo del "día de reserva" con corte a las 4:00 AM
 * Específico para el módulo de reservas, NO confundir con business-day-utils
 * 
 * Para negocios nocturnos:
 * - Las reservas de 00:00 a 03:59 pertenecen al día ANTERIOR
 * - Las reservas de 04:00 a 23:59 pertenecen al día ACTUAL
 */

// Hora de corte: 4:00 AM (configurable por negocio en el futuro)
const RESERVATION_DAY_CUTOFF_HOUR = 4;

/**
 * Obtiene la fecha del "día de reserva" para una fecha/hora específica
 * 
 * @param datetime - Fecha y hora de la reserva (Date o string ISO)
 * @param cutoffHour - Hora de corte (default: 4 AM)
 * @returns Fecha del día de reserva en formato YYYY-MM-DD
 * 
 * @example
 * // Reserva a las 2:00 AM del 17 de octubre
 * getReservationDayDate(new Date('2025-10-17T02:00:00'))
 * // Retorna: "2025-10-16" (día anterior)
 * 
 * @example
 * // Reserva a las 9:00 PM del 16 de octubre
 * getReservationDayDate(new Date('2025-10-16T21:00:00'))
 * // Retorna: "2025-10-16" (mismo día)
 */
export function getReservationDayDate(
  datetime: Date | string,
  cutoffHour: number = RESERVATION_DAY_CUTOFF_HOUR
): string {
  const date = typeof datetime === 'string' ? new Date(datetime) : new Date(datetime);
  
  const hour = date.getHours();
  
  // Si la hora es antes del corte (ej: 00:00 - 03:59), es del día anterior
  let reservationDate: Date;
  if (hour < cutoffHour) {
    reservationDate = new Date(date);
    reservationDate.setDate(reservationDate.getDate() - 1);
  } else {
    reservationDate = new Date(date);
  }
  
  // Formatear como YYYY-MM-DD
  const year = reservationDate.getFullYear();
  const month = String(reservationDate.getMonth() + 1).padStart(2, '0');
  const day = String(reservationDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Verifica si dos fechas/horas pertenecen al mismo día de reserva
 * 
 * @param datetime1 - Primera fecha/hora
 * @param datetime2 - Segunda fecha/hora
 * @param cutoffHour - Hora de corte (default: 4 AM)
 * @returns true si ambas pertenecen al mismo día de reserva
 */
export function isSameReservationDay(
  datetime1: Date | string,
  datetime2: Date | string,
  cutoffHour: number = RESERVATION_DAY_CUTOFF_HOUR
): boolean {
  const day1 = getReservationDayDate(datetime1, cutoffHour);
  const day2 = getReservationDayDate(datetime2, cutoffHour);
  return day1 === day2;
}

/**
 * Filtra reservas que pertenecen a un día específico (considerando corte 4 AM)
 * 
 * @param reservas - Array de reservas
 * @param targetDate - Fecha objetivo (Date o string YYYY-MM-DD)
 * @param cutoffHour - Hora de corte (default: 4 AM)
 * @returns Reservas que pertenecen al día objetivo
 */
export function filterReservasByDay<T extends { fecha: string; hora: string }>(
  reservas: T[],
  targetDate: Date | string,
  cutoffHour: number = RESERVATION_DAY_CUTOFF_HOUR
): T[] {
  // Normalizar targetDate a YYYY-MM-DD
  const targetDateStr = typeof targetDate === 'string' 
    ? (targetDate.includes('T') ? targetDate.split('T')[0] : targetDate)
    : getReservationDayDate(targetDate, cutoffHour);
  
  return reservas.filter(reserva => {
    // Crear datetime de la reserva
    const reservaDatetime = new Date(`${reserva.fecha}T${reserva.hora}`);
    const reservaDayStr = getReservationDayDate(reservaDatetime, cutoffHour);
    
    return reservaDayStr === targetDateStr;
  });
}

/**
 * Agrupa reservas por día de reserva (considerando corte 4 AM)
 * 
 * @param reservas - Array de reservas
 * @param cutoffHour - Hora de corte (default: 4 AM)
 * @returns Map con fecha (YYYY-MM-DD) como key y array de reservas como value
 */
export function groupReservasByDay<T extends { fecha: string; hora: string }>(
  reservas: T[],
  cutoffHour: number = RESERVATION_DAY_CUTOFF_HOUR
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  for (const reserva of reservas) {
    const reservaDatetime = new Date(`${reserva.fecha}T${reserva.hora}`);
    const dayStr = getReservationDayDate(reservaDatetime, cutoffHour);
    
    if (!grouped.has(dayStr)) {
      grouped.set(dayStr, []);
    }
    grouped.get(dayStr)!.push(reserva);
  }
  
  return grouped;
}

/**
 * Obtiene el rango de fecha/hora para un día de reserva completo
 * 
 * @param date - Fecha del día (Date o string YYYY-MM-DD)
 * @param cutoffHour - Hora de corte (default: 4 AM)
 * @returns Objeto con start y end (DateTime completo)
 * 
 * @example
 * // Rango para el 16 de octubre
 * getReservationDayRange(new Date('2025-10-16'))
 * // Retorna:
 * // {
 * //   start: 2025-10-16T04:00:00,
 * //   end: 2025-10-17T03:59:59
 * // }
 */
export function getReservationDayRange(
  date: Date | string,
  cutoffHour: number = RESERVATION_DAY_CUTOFF_HOUR
): { start: Date; end: Date } {
  // Normalizar a fecha
  let baseDate: Date;
  if (typeof date === 'string') {
    const datePart = date.includes('T') ? date.split('T')[0] : date;
    const [year, month, day] = datePart.split('-').map(Number);
    baseDate = new Date(year, month - 1, day);
  } else {
    baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);
  }
  
  // Start: 4:00 AM del día
  const start = new Date(baseDate);
  start.setHours(cutoffHour, 0, 0, 0);
  
  // End: 3:59:59 del día siguiente
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1); // 03:59:59.999
  
  return { start, end };
}

/**
 * Obtiene la hora de corte actual (útil para mostrar en UI)
 */
export function getReservationDayCutoffHour(): number {
  return RESERVATION_DAY_CUTOFF_HOUR;
}

/**
 * Formatea un mensaje explicativo para mostrar al usuario
 */
export function getReservationDayExplanation(hora: string): string | null {
  const [hours] = hora.split(':').map(Number);
  
  if (hours < RESERVATION_DAY_CUTOFF_HOUR) {
    return `Esta reserva (${hora}) será parte del día anterior (horario nocturno)`;
  }
  
  return null;
}
