/**
 * Tipos comunes para la aplicación Lealta 2.0v
 *
 * Este archivo contiene definiciones de tipos reutilizables en toda la aplicación,
 * lo que ayuda a mantener la consistencia de tipado y reducir el uso de 'any'.
 */

// Tipos básicos para la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos para autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ClienteCredentials {
  cedula: string;
  telefono: string;
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  businessId?: string;
}

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'USER';

// Tipos para la interfaz de usuario
export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Tipos para datos de negocio
export interface Business {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  settings?: BusinessSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessSettings {
  logoUrl?: string;
  contactEmail?: string;
  primaryColor?: string;
  secondaryColor?: string;
  allowClientRegistration?: boolean;
  requireApproval?: boolean;
  pointsPerAmount?: number;
  pointsExpirationDays?: number;
}

export interface Cliente {
  id: string;
  cedula: string;
  nombre: string;
  telefono: string;
  email?: string;
  puntos: number;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Consumo {
  id: string;
  clienteId: string;
  monto: number;
  puntos: number;
  tipo: 'COMPRA' | 'CANJE' | 'AJUSTE' | 'CADUCIDAD';
  nota?: string;
  createdAt: Date;
  userId?: string;
}

// Tipos para análisis y estadísticas
export interface StatsData {
  total: number;
  change: number;
  percentage: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}
