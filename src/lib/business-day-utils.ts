/**
 * Utilidades para manejo de día comercial con hora de reseteo configurable
 * Centraliza la lógica para que todos los componentes usen la misma definición de "día"
 */

// Hora de reseteo por defecto (4 AM estándar para bares/restaurantes)
const DEFAULT_RESET_HOUR = 4;

// Mapeo de días de la semana
const DAYS_OF_WEEK = [
  'domingo', 'lunes', 'martes', 'miercoles', 
  'jueves', 'viernes', 'sabado'
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

/**
 * Configuración de día comercial por negocio
 */
interface BusinessDayConfig {
  businessId: string;
  resetHour: number; // Hora de reseteo (0-23)
  resetMinute?: number; // Minutos de reseteo (opcional, default: 0)
  timezone?: string; // Timezone (opcional, default: local)
}

// Cache de configuraciones para mejorar performance
const configCache = new Map<string, BusinessDayConfig>();

/**
 * Obtiene la configuración de día comercial para un negocio
 * @param businessId ID del negocio
 * @returns Configuración de día comercial
 */
export async function getBusinessDayConfig(businessId?: string): Promise<BusinessDayConfig> {
  if (!businessId) {
    return {
      businessId: 'default',
      resetHour: DEFAULT_RESET_HOUR,
      resetMinute: 0
    };
  }

  // ✅ Verificar si estamos en el navegador
  if (typeof window === 'undefined') {
    // En servidor, retornar configuración por defecto
    return {
      businessId,
      resetHour: DEFAULT_RESET_HOUR,
      resetMinute: 0
    };
  }

  // Verificar cache primero
  if (configCache.has(businessId)) {
    return configCache.get(businessId)!;
  }

  try {
    // ✅ USAR API en lugar de Prisma directamente
    const response = await fetch(`/api/business-day/config?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const config = await response.json();
      configCache.set(businessId, config);
      return config;
    } else {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`⚠️ Error obteniendo configuración de día para ${businessId}, usando default:`, error);
    
    const fallbackConfig: BusinessDayConfig = {
      businessId,
      resetHour: DEFAULT_RESET_HOUR,
      resetMinute: 0
    };
    
    configCache.set(businessId, fallbackConfig);
    return fallbackConfig;
  }
}

/**
 * Calcula el día comercial actual basado en la hora de reseteo
 * ✅ ARREGLADO: Usa timezone del negocio en lugar de UTC
 * @param businessId ID del negocio (opcional)
 * @param customDate Fecha personalizada para testing (opcional)
 * @returns Día comercial actual
 */
export async function getCurrentBusinessDay(
  businessId?: string, 
  customDate?: Date
): Promise<DayOfWeek> {
  try {
    const config = await getBusinessDayConfig(businessId);
    
    // ✅ CORRECCIÓN CRÍTICA: Usar timezone de Ecuador
    // Por defecto usar America/Guayaquil (UTC-5) para negocios en Ecuador
    const timezone = config.timezone || 'America/Guayaquil';
    
    // Obtener fecha/hora actual en el timezone del negocio
    const now = customDate || new Date();
    
    // Convertir a hora local del negocio usando toLocaleString
    const localTimeString = now.toLocaleString('en-US', { 
      timeZone: timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Parsear el string para obtener hora y minuto local
    // Formato: "MM/DD/YYYY, HH:MM:SS"
    const [datePart, timePart] = localTimeString.split(', ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Crear fecha en el timezone local del negocio
    const localDate = new Date(year, month - 1, day, hour, minute);
    
    const currentHour = hour;
    const currentMinute = minute;
    const resetHour = config.resetHour;
    const resetMinute = config.resetMinute || 0;
    
    // Calcular si estamos antes o después de la hora de reseteo
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const resetTimeInMinutes = resetHour * 60 + resetMinute;
    
    let businessDay: Date;
    
    if (currentTimeInMinutes < resetTimeInMinutes) {
      // Antes de la hora de reseteo = día anterior
      businessDay = new Date(localDate);
      businessDay.setDate(businessDay.getDate() - 1);
    } else {
      // Después de la hora de reseteo = día actual
      businessDay = new Date(localDate);
    }
  
    const dayIndex = businessDay.getDay();
    const businessDayName = DAYS_OF_WEEK[dayIndex];
    
    // Debug logging SIEMPRE para diagnosticar timezone
    console.log(`🗓️ [getCurrentBusinessDay] Calculation:`, {
      businessId: businessId || 'default',
      timezone,
      serverTime: now.toISOString(),
      localTime: localTimeString,
      localHour: currentHour,
      localMinute: currentMinute,
      resetHour: `${resetHour}:${resetMinute.toString().padStart(2, '0')}`,
      currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
      isAfterReset: currentTimeInMinutes >= resetTimeInMinutes,
      naturalDay: DAYS_OF_WEEK[localDate.getDay()],
      businessDay: businessDayName,
      date: businessDay.toDateString()
    });
    
    return businessDayName;
  } catch (error) {
    console.error('❌ Error obteniendo día comercial:', error);
    // Fallback a día natural
    const now = customDate || new Date();
    return DAYS_OF_WEEK[now.getDay()];
  }
}

/**
 * Versión síncrona que usa configuración cacheada o default
 * Útil para componentes que necesitan el día inmediatamente
 * @param businessId ID del negocio
 * @param customDate Fecha personalizada para testing
 * @returns Día comercial actual
 */
export function getCurrentBusinessDaySync(
  businessId?: string, 
  customDate?: Date
): DayOfWeek {
  const now = customDate || new Date();
  
  // Usar configuración cacheada o default
  const config = configCache.get(businessId || 'default') || {
    businessId: businessId || 'default',
    resetHour: DEFAULT_RESET_HOUR,
    resetMinute: 0
  };
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const resetHour = config.resetHour;
  const resetMinute = config.resetMinute || 0;
  
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const resetTimeInMinutes = resetHour * 60 + resetMinute;
  
  let businessDay: Date;
  
  if (currentTimeInMinutes < resetTimeInMinutes) {
    businessDay = new Date(now);
    businessDay.setDate(businessDay.getDate() - 1);
  } else {
    businessDay = new Date(now);
  }
  
  return DAYS_OF_WEEK[businessDay.getDay()];
}

/**
 * Interface para elementos que tienen configuración diaria
 */
export interface DailyScheduledItem {
  dia: DayOfWeek;
  horaInicio?: string; // Formato "HH:MM"
  horaTermino?: string; // Formato "HH:MM"
  horaPublicacion?: string; // Para compatibilidad con banners/favoritos
  activo?: boolean;
}

/**
 * Convierte hora en formato "HH:MM" a minutos desde medianoche
 * @param timeString Hora en formato "HH:MM"
 * @returns Minutos desde medianoche
 */
function timeStringToMinutes(timeString: string): number {
  const [horas, minutos] = timeString.split(':').map(Number);
  return horas * 60 + minutos;
}

/**
 * Obtiene la hora de inicio efectiva para un elemento
 */
async function getEffectiveStartTime(
  item: DailyScheduledItem,
  businessId?: string
): Promise<string> {
  if (item.horaInicio) return item.horaInicio;
  if (item.horaPublicacion) return item.horaPublicacion;
  
  const config = await getBusinessDayConfig(businessId);
  return `${config.resetHour.toString().padStart(2, '0')}:${(config.resetMinute || 0).toString().padStart(2, '0')}`;
}

/**
 * Verifica si el elemento ha pasado su hora de término
 */
async function isAfterEndTime(
  item: DailyScheduledItem,
  currentTimeInMinutes: number,
  businessId?: string
): Promise<boolean> {
  if (!item.horaTermino) return false;
  
  const horaTerminoMinutos = timeStringToMinutes(item.horaTermino);
  
  // LÓGICA CORREGIDA: Si horaTermino es temprano (como 02:00), es del día siguiente
  if (horaTerminoMinutos < 6 * 60) {
    // Solo termina si ya pasamos a un nuevo día comercial
    // Es decir, si la hora actual es >= 4:00 AM del día siguiente
    
    // Si estamos antes de las 6 AM (temprano), verificar si ya pasó la hora de término
    if (currentTimeInMinutes < 6 * 60) {
      return currentTimeInMinutes >= horaTerminoMinutos;
    }
    
    // Si estamos después de las 6 AM, significa que aún no llegamos al término (que es temprano mañana)
    return false;
  }
  
  // Para horas de término normales del mismo día
  return currentTimeInMinutes >= horaTerminoMinutos;
}

/**
 * Determina si un elemento programado debe ser visible en el momento actual
 * Centraliza la lógica de visibilidad para banners, promociones y favoritos
 * @param item Elemento con configuración diaria
 * @param businessId ID del negocio
 * @param customDate Fecha personalizada para testing
 * @returns true si el elemento debe ser visible
 */
export async function isItemVisibleInBusinessDay(
  item: DailyScheduledItem,
  businessId?: string,
  customDate?: Date
): Promise<boolean> {
  const currentBusinessDay = await getCurrentBusinessDay(businessId, customDate);
  
  // Verificaciones básicas
  if (item.dia !== currentBusinessDay || item.activo === false) {
    return false;
  }

  const now = customDate || new Date();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Verificar hora de inicio
  const horaInicio = await getEffectiveStartTime(item, businessId);
  const horaInicioMinutos = timeStringToMinutes(horaInicio);
  
  // CASO ESPECIAL: Si estamos en horario temprano (0:00 - 4:00) y el día comercial coincide
  // significa que el elemento debería estar visible desde el día anterior
  if (currentTimeInMinutes < 4 * 60 && item.dia === currentBusinessDay) {
    // No verificar hora de inicio en este caso, solo hora de término
    return !(await isAfterEndTime(item, currentTimeInMinutes, businessId));
  }
  
  if (currentTimeInMinutes < horaInicioMinutos) {
    return false;
  }

  // Verificar hora de término
  return !(await isAfterEndTime(item, currentTimeInMinutes, businessId));
}

/**
 * Obtiene la hora de inicio efectiva para un elemento (versión síncrona)
 */
function getEffectiveStartTimeSync(
  item: DailyScheduledItem,
  businessId?: string
): string {
  if (item.horaInicio) return item.horaInicio;
  if (item.horaPublicacion) return item.horaPublicacion;
  
  const config = configCache.get(businessId || 'default') || {
    businessId: businessId || 'default',
    resetHour: DEFAULT_RESET_HOUR,
    resetMinute: 0
  };
  
  return `${config.resetHour.toString().padStart(2, '0')}:${(config.resetMinute || 0).toString().padStart(2, '0')}`;
}

/**
 * Verifica si el elemento ha pasado su hora de término (versión síncrona)
 */
function isAfterEndTimeSync(
  item: DailyScheduledItem,
  currentTimeInMinutes: number,
  businessId?: string
): boolean {
  if (!item.horaTermino) return false;
  
  const horaTerminoMinutos = timeStringToMinutes(item.horaTermino);
  
  // ✅ LÓGICA CORREGIDA: Si horaTermino es temprano (como 02:00), es del día siguiente
  if (horaTerminoMinutos < 6 * 60) {
    // Si estamos antes de las 6 AM (temprano), verificar si ya pasó la hora de término
    if (currentTimeInMinutes < 6 * 60) {
      return currentTimeInMinutes >= horaTerminoMinutos;
    }
    
    // Si estamos después de las 6 AM, significa que aún no llegamos al término (que es temprano mañana)
    return false;
  }
  
  // Para horas de término normales del mismo día
  return currentTimeInMinutes >= horaTerminoMinutos;
}

/**
 * Versión síncrona de isItemVisibleInBusinessDay usando configuración cacheada
 * @param item Elemento con configuración diaria
 * @param businessId ID del negocio
 * @param customDate Fecha personalizada para testing
 * @returns true si el elemento debe ser visible
 */
export function isItemVisibleInBusinessDaySync(
  item: DailyScheduledItem,
  businessId?: string,
  customDate?: Date
): boolean {
  const currentBusinessDay = getCurrentBusinessDaySync(businessId, customDate);
  
  // Verificaciones básicas
  if (item.dia !== currentBusinessDay || item.activo === false) {
    return false;
  }

  const now = customDate || new Date();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Verificar hora de inicio
  const horaInicio = getEffectiveStartTimeSync(item, businessId);
  const horaInicioMinutos = timeStringToMinutes(horaInicio);
  
  // CASO ESPECIAL: Si estamos en horario temprano (0:00 - 4:00) y el día comercial coincide
  // significa que el elemento debería estar visible desde el día anterior
  if (currentTimeInMinutes < 4 * 60 && item.dia === currentBusinessDay) {
    // No verificar hora de inicio en este caso, solo hora de término
    return !isAfterEndTimeSync(item, currentTimeInMinutes, businessId);
  }
  
  if (currentTimeInMinutes < horaInicioMinutos) {
    return false;
  }

  // Verificar hora de término
  return !isAfterEndTimeSync(item, currentTimeInMinutes, businessId);
}

/**
 * Obtiene el rango de fechas para el día comercial actual
 * @param businessId ID del negocio
 * @param customDate Fecha de referencia
 * @returns Rango de fechas del día comercial
 */
export async function getBusinessDayRange(
  businessId?: string,
  customDate?: Date
): Promise<{ start: Date; end: Date }> {
  const config = await getBusinessDayConfig(businessId);
  const now = customDate || new Date();
  
  const resetHour = config.resetHour;
  const resetMinute = config.resetMinute || 0;
  
  // Calcular inicio del día comercial
  const start = new Date(now);
  start.setHours(resetHour, resetMinute, 0, 0);
  
  // Si estamos antes de la hora de reseteo, el día comercial empezó ayer
  if (now.getHours() < resetHour || 
      (now.getHours() === resetHour && now.getMinutes() < resetMinute)) {
    start.setDate(start.getDate() - 1);
  }
  
  // Calcular fin del día comercial (inicio del siguiente día comercial)
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1); // 23:59:59.999 del día comercial
  
  return { start, end };
}

/**
 * Valida si una fecha está dentro del día comercial actual
 * @param date Fecha a validar
 * @param businessId ID del negocio
 * @returns True si está dentro del día comercial actual
 */
export async function isWithinCurrentBusinessDay(
  date: Date,
  businessId?: string
): Promise<boolean> {
  const { start, end } = await getBusinessDayRange(businessId);
  return date >= start && date <= end;
}

/**
 * Obtiene información de debug del día comercial
 * @param businessId ID del negocio
 * @returns Información detallada para debugging
 */
export async function getBusinessDayDebugInfo(businessId?: string) {
  const config = await getBusinessDayConfig(businessId);
  const now = new Date();
  const businessDay = await getCurrentBusinessDay(businessId);
  const { start, end } = await getBusinessDayRange(businessId);
  
  return {
    config,
    currentTime: now.toISOString(),
    naturalDay: DAYS_OF_WEEK[now.getDay()],
    businessDay,
    businessDayRange: {
      start: start.toISOString(),
      end: end.toISOString()
    },
    isAfterReset: now >= start && now <= end
  };
}

// Exportar constantes útiles
export { DAYS_OF_WEEK, DEFAULT_RESET_HOUR };
export type { BusinessDayConfig };
