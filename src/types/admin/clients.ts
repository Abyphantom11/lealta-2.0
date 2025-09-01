// Tipos relacionados con clientes y gestión de clientes
import { Cliente } from '../admin';

export interface ClienteFormData {
  cedula: string;
  nombre: string;
  correo?: string;
  telefono?: string;
  puntos?: number;
  nivel?: 'Bronce' | 'Plata' | 'Oro' | 'Diamante' | 'Platino';
}

export interface ClienteSearchParams {
  query?: string;
  nivel?: string;
  minPuntos?: number;
  maxPuntos?: number;
  page: number;
  limit: number;
}

export interface ClienteOperationResult {
  success: boolean;
  message: string;
  cliente?: Cliente;
  error?: string;
}

export interface ClientHistoryItem {
  id: string;
  fecha: Date;
  tipo: 'compra' | 'canje' | 'ajuste' | 'promocion';
  descripcion: string;
  puntos: number;
  total?: number;
  productos?: string[];
}

// Tipos para los hooks y contextos relacionados con clientes
export interface ClientesContextType {
  clientes: Cliente[];
  selectedCliente: Cliente | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  fetchClientes: (params: ClienteSearchParams) => Promise<void>;
  getClienteById: (cedula: string) => Promise<Cliente | null>;
  getClienteHistory: (cedula: string) => Promise<ClientHistoryItem[]>;
  saveCliente: (cliente: ClienteFormData) => Promise<ClienteOperationResult>;
  updatePuntos: (cedula: string, puntos: number, motivo: string) => Promise<ClienteOperationResult>;
}
