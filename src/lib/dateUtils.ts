/**
 * Utilitario para manejo de fechas
 * Proporciona funciones para formatear y manipular fechas de manera consistente
 */

// Tipo para fechas en diferentes formatos
export type DateLike = Date | string | number;

/**
 * Formatea una fecha en formato legible
 * @param date Fecha a formatear
 * @param locale Locale para el formato (default: 'es-ES')
 * @returns Fecha formateada en formato legible
 */
export function formatDate(date: DateLike, locale = 'es-ES'): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Formatea una fecha con hora en formato legible
 * @param date Fecha a formatear
 * @param locale Locale para el formato (default: 'es-ES')
 * @returns Fecha y hora formateadas en formato legible
 */
export function formatDateTime(date: DateLike, locale = 'es-ES'): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(dateObj);
}

/**
 * Formatea una fecha en formato corto (DD/MM/YYYY)
 * @param date Fecha a formatear
 * @param locale Locale para el formato (default: 'es-ES')
 * @returns Fecha formateada en formato corto
 */
export function formatShortDate(date: DateLike, locale = 'es-ES'): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Calcula la diferencia entre dos fechas en días
 * @param startDate Fecha de inicio
 * @param endDate Fecha de fin (default: fecha actual)
 * @returns Número de días entre las fechas
 */
export function daysBetween(
  startDate: DateLike,
  endDate: DateLike = new Date()
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalizar las fechas eliminando las horas, minutos y segundos
  const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  // Diferencia en milisegundos
  const diffTime = Math.abs(normalizedEnd.getTime() - normalizedStart.getTime());
  // Convertir a días
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica si una fecha está en el pasado
 * @param date Fecha a verificar
 * @returns true si la fecha está en el pasado
 */
export function isPast(date: DateLike): boolean {
  return new Date(date).getTime() < new Date().getTime();
}

/**
 * Verifica si una fecha está en el futuro
 * @param date Fecha a verificar
 * @returns true si la fecha está en el futuro
 */
export function isFuture(date: DateLike): boolean {
  return new Date(date).getTime() > new Date().getTime();
}

/**
 * Agrega días a una fecha
 * @param date Fecha base
 * @param days Número de días a agregar
 * @returns Nueva fecha con los días agregados
 */
export function addDays(date: DateLike, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Obtiene el primer día del mes para una fecha dada
 * @param date Fecha de referencia
 * @returns Primer día del mes
 */
export function getFirstDayOfMonth(date: DateLike): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Obtiene el último día del mes para una fecha dada
 * @param date Fecha de referencia
 * @returns Último día del mes
 */
export function getLastDayOfMonth(date: DateLike): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Verifica si dos fechas son el mismo día
 * @param date1 Primera fecha
 * @param date2 Segunda fecha
 * @returns true si ambas fechas representan el mismo día
 */
export function isSameDay(
  date1: DateLike,
  date2: DateLike
): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Exportar el objeto dateUtils completo para facilitar su uso
export default {
  formatDate,
  formatDateTime,
  formatShortDate,
  daysBetween,
  isPast,
  isFuture,
  addDays,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isSameDay,
};
