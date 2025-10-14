// Types for customer related data

export interface CustomerInfo {
  id: string;
  nombre: string;
  cedula: string;
  puntos: number;
  email?: string;
  telefono?: string;
  nivel?: string;
  totalGastado?: number;
  frecuencia?: string;
  ultimaVisita?: string | null;
}

export interface ConsumoData {
  id?: string;
  cliente:
    | string
    | {
        cedula: string;
        nombre: string;
      };
  cedula: string;
  productos: Product[];
  total: number;
  puntos: number;
  fecha: string;
  tipo?: string;
}

// Import Product type
import { Product } from './product.types';
