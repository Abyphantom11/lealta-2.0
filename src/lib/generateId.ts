import { createId } from '@paralleldrive/cuid2';

/**
 * Genera un ID único usando CUID2
 * 
 * Este helper se usa en toda la aplicación para generar IDs
 * para modelos de Prisma que no tienen @default(cuid())
 * 
 * @returns Un ID único en formato CUID2
 */
export function generateId(): string {
  return createId();
}
