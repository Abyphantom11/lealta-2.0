import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número para una visualización más legible
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}