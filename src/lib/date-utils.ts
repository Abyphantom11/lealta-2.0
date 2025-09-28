import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha en formato corto (DD/MM/YYYY)
 */
export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return dateString;
  }
}

/**
 * Formatea una hora en formato HH:MM
 */
export function formatTime(timeString: string): string {
  try {
    // Si es solo una hora en formato HH:MM
    if (timeString.length <= 5) {
      return timeString;
    }
    
    // Si es una fecha completa
    const date = new Date(timeString);
    return format(date, 'HH:mm', { locale: es });
  } catch (error) {
    console.error('Error al formatear hora:', error);
    return timeString;
  }
}

/**
 * Formatea una fecha completa con hora (DD MMM YYYY, HH:MM)
 */
export function formatDateTime(dateTimeString: string): string {
  try {
    const date = new Date(dateTimeString);
    return format(date, 'dd MMM yyyy, HH:mm', { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha y hora:', error);
    return dateTimeString;
  }
}

/**
 * Formatea una fecha para mostrar solo el día y mes
 */
export function formatDayMonth(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'dd MMM', { locale: es });
  } catch (error) {
    console.error('Error al formatear día y mes:', error);
    return dateString;
  }
}
