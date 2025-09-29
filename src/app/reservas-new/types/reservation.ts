export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
}

export interface Promotor {
  id: string;
  nombre: string;
}

export type EstadoReserva = 'Activa' | 'En Progreso' | 'Reserva Caída' | 'En Camino';

export interface Reserva {
  id: string;
  cliente: Cliente;
  numeroPersonas: number;
  razonVisita: string;
  beneficiosReserva: string;
  promotor: Promotor;
  fecha: string;
  hora: string;
  codigoQR: string;
  asistenciaActual: number;
  estado: EstadoReserva;
  fechaCreacion: string;
  fechaModificacion?: string;
  mesa?: string;
  registroEntradas: {
    timestamp: string;
    cantidad: number;
    metodo: 'QR' | 'Manual';
    usuario?: string;
  }[];
}

export interface DashboardStats {
  totalReservas: number;
  totalAsistentes: number;
  promedioAsistencia: number;
  reservasHoy: number;
}

export interface ReporteAsistencia {
  fecha: string;
  reservas: number;
  asistentes: number;
  porcentajeAsistencia: number;
}
