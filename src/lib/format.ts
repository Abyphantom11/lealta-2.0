/**
 * Utilidades para formatear diferentes tipos de datos
 */

/**
 * Formatea una fecha al formato local
 * @param date - Fecha a formatear
 * @param options - Opciones de formato
 * @returns Fecha formateada
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('es-ES', options).format(dateObj);
}

/**
 * Formatea un número a formato de moneda
 * @param amount - Monto a formatear
 * @param currency - Moneda (por defecto PYG)
 * @returns Monto formateado
 */
export function formatCurrency(
  amount: number,
  currency: string = 'PYG'
): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'PYG' ? 0 : 2,
    minimumFractionDigits: currency === 'PYG' ? 0 : 2,
  }).format(amount);
}

/**
 * Formatea un número con separadores de miles
 * @param number - Número a formatear
 * @returns Número formateado
 */
export function formatNumber(number: number): string {
  return new Intl.NumberFormat('es-ES').format(number);
}

/**
 * Calcula la diferencia entre dos fechas en días
 * @param date1 - Fecha inicial
 * @param date2 - Fecha final (default: fecha actual)
 * @returns Diferencia en días
 */
export function daysBetween(
  date1: Date | string,
  date2: Date | string = new Date()
): number {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);

  // Convertir a UTC para evitar problemas con horario de verano
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
}

/**
 * Formatea un número de teléfono
 * @param phone - Número de teléfono
 * @returns Número formateado
 */
export function formatPhone(phone: string): string {
  // Eliminar caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Aplicar formato según longitud
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  }

  // Si no cumple con los formatos conocidos, devolver tal cual
  return cleaned;
}

/**
 * Formatea una cédula con separadores
 * @param cedula - Número de cédula
 * @returns Cédula formateada
 */
export function formatCedula(cedula: string): string {
  // Eliminar caracteres no numéricos
  const cleaned = cedula.replace(/\D/g, '');

  // Aplicar formato con separadores de miles
  return new Intl.NumberFormat('es-ES').format(parseInt(cleaned));
}
