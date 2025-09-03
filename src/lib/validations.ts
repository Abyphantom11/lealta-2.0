import { z } from 'zod';

// Esquemas de validación para entidades principales
export const BusinessSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  slug: z.string().min(1, 'Slug requerido').max(50),
  subdomain: z.string().min(1, 'Subdominio requerido').max(50),
  customDomain: z.string().regex(/^https?:\/\/.+/, 'URL inválida').optional(),
  subscriptionPlan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
  isActive: z.boolean().default(true),
});

export const UserSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'),
  name: z.string().min(1, 'Nombre requerido').max(100),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'STAFF']),
  isActive: z.boolean().default(true),
});

export const ClienteSchema = z.object({
  cedula: z.string().min(6, 'Cédula debe tener al menos 6 caracteres').max(20),
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  correo: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'),
  telefono: z.string().min(8, 'Teléfono inválido').max(20),
});

export const ConsumoSchema = z.object({
  clienteId: z.string().min(1, 'ID de cliente requerido'),
  monto: z.number().min(0, 'Monto debe ser positivo'),
  descripcion: z.string().optional(),
});

export const MenuCategorySchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  descripcion: z.string().optional(),
  activo: z.boolean().default(true),
  orden: z.number().int().min(0),
  parentId: z.string().min(1).optional(),
});

export const MenuItemSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  descripcion: z.string().optional(),
  precio: z.number().min(0).optional(),
  precioVaso: z.number().min(0).optional(),
  precioBotella: z.number().min(0).optional(),
  tipoProducto: z.enum(['simple', 'bebida', 'botella']).default('simple'),
  disponible: z.boolean().default(true),
  destacado: z.boolean().default(false),
  orden: z.number().int().min(0).default(0),
});

export type BusinessInput = z.infer<typeof BusinessSchema>;
export type UserInput = z.infer<typeof UserSchema>;
export type ClienteInput = z.infer<typeof ClienteSchema>;
export type ConsumoInput = z.infer<typeof ConsumoSchema>;
export type MenuCategoryInput = z.infer<typeof MenuCategorySchema>;
export type MenuItemInput = z.infer<typeof MenuItemSchema>;
