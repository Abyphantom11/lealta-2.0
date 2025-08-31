/**
 * Utilitario para manejo de precios y números
 * Proporciona funciones para formatear y manipular precios de manera consistente
 */

/**
 * Opciones para formatear precios
 */
interface FormatPriceOptions {
  currency?: string;
  locale?: string;
  decimals?: number;
  includeSymbol?: boolean;
}

/**
 * Formatea un precio en formato legible
 * @param amount Cantidad a formatear
 * @param options Opciones de formato
 * @returns Precio formateado
 */
export function formatPrice(
  amount: number,
  options: FormatPriceOptions = {}
): string {
  const {
    currency = 'MXN',
    locale = 'es-MX',
    decimals = 2,
    includeSymbol = true,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: includeSymbol ? currency : undefined,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Calcula el precio con descuento
 * @param price Precio original
 * @param discountPercentage Porcentaje de descuento
 * @returns Precio con descuento aplicado
 */
export function calculateDiscountedPrice(
  price: number,
  discountPercentage: number
): number {
  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error('El porcentaje de descuento debe estar entre 0 y 100');
  }
  return price - (price * discountPercentage) / 100;
}

/**
 * Calcula el porcentaje de descuento entre dos precios
 * @param originalPrice Precio original
 * @param discountedPrice Precio con descuento
 * @returns Porcentaje de descuento
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  discountedPrice: number
): number {
  if (originalPrice <= 0) {
    throw new Error('El precio original debe ser mayor que cero');
  }
  if (discountedPrice > originalPrice) {
    throw new Error('El precio con descuento no puede ser mayor que el original');
  }
  return ((originalPrice - discountedPrice) / originalPrice) * 100;
}

/**
 * Formatea un número con separadores de miles
 * @param number Número a formatear
 * @param locale Locale para el formato (default: 'es-MX')
 * @returns Número formateado con separadores de miles
 */
export function formatNumber(number: number, locale = 'es-MX'): string {
  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Formatea un número como porcentaje
 * @param number Número a formatear (0.1 = 10%)
 * @param locale Locale para el formato (default: 'es-MX')
 * @param decimals Número de decimales a mostrar
 * @returns Número formateado como porcentaje
 */
export function formatPercent(
  number: number,
  locale = 'es-MX',
  decimals = 2
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

/**
 * Redondea un número a un número específico de decimales
 * @param number Número a redondear
 * @param decimals Número de decimales (default: 2)
 * @returns Número redondeado
 */
export function roundTo(number: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
}

/**
 * Suma una lista de números con precisión
 * @param numbers Lista de números a sumar
 * @returns Suma de los números
 */
export function sumWithPrecision(...numbers: number[]): number {
  // Convertir a enteros para evitar problemas de precisión con decimales
  const decimals = numbers.reduce((max, num) => {
    const decimal = (num.toString().split('.')[1] || '').length;
    return Math.max(max, decimal);
  }, 0);
  
  const factor = Math.pow(10, decimals);
  
  return numbers
    .map(num => Math.round(num * factor))
    .reduce((sum, num) => sum + num, 0) / factor;
}

/**
 * Asegura que un número esté dentro de un rango
 * @param number Número a verificar
 * @param min Valor mínimo
 * @param max Valor máximo
 * @returns Número dentro del rango
 */
export function clamp(number: number, min: number, max: number): number {
  return Math.max(min, Math.min(number, max));
}

// Exportar el objeto completo para facilitar su uso
export default {
  formatPrice,
  calculateDiscountedPrice,
  calculateDiscountPercentage,
  formatNumber,
  formatPercent,
  roundTo,
  sumWithPrecision,
  clamp,
};
