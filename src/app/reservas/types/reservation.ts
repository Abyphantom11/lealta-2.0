export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  fechaNacimiento?: string; // 🆕 Nuevo campo para fecha de nacimiento
}

export interface Promotor {
  id: string;
  nombre: string;
}

export type EstadoReserva = 'En Progreso' | 'Activa' | 'Reserva Caída' | 'En Camino' | 'Cancelado';

export interface Reserva {
  id: string;
  cliente: Cliente;
  numeroPersonas: number;
  razonVisita: string;
  beneficiosReserva: string;
  promotor: Promotor;
  promotorId?: string; // ✅ NUEVO: ID del promotor en base de datos
  fecha: string;
  hora: string;
  codigoQR: string;
  asistenciaActual: number;
  estado: EstadoReserva;
  fechaCreacion: string;
  fechaModificacion?: string;
  mesa?: string;
  detalles?: string[]; // ✅ Agregar campo para detalles adicionales
  comprobanteSubido?: boolean; // ✅ Campo para indicar si se subió comprobante de pago
  comprobanteUrl?: string; // ✅ URL del comprobante de pago en Blob Storage
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
