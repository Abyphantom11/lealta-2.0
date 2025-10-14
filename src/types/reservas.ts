// Tipos base para el módulo de reservas
// Alineado exactamente con el schema de Prisma

export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  correo?: string;
}

export interface Promotor {
  id: string;
  nombre: string;
}

// Enums que coinciden con Prisma
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type EstadoReserva = ReservationStatus; // Alias para compatibilidad

export interface Reserva {
  // Campos principales del schema Prisma
  id: string;
  businessId: string;
  clienteId: string | null;
  serviceId: string;
  slotId: string;
  reservationNumber: string;
  status: ReservationStatus;
  guestCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  specialRequests?: string;
  notes?: string;
  totalPrice?: number;
  paidAmount: number;
  isPaid: boolean;
  paymentReference?: string;
  
  // Fechas del schema Prisma
  reservedAt: string;
  confirmedAt?: string;
  checkedInAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  
  // Recordatorios
  reminderSent: boolean;
  reminderSentAt?: string;
  
  // Metadata
  source: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones populadas (opcionales para flexibilidad)
  cliente: Cliente;
  service?: ReservationService;
  slot?: ReservationSlot;
  qrCodes?: ReservationQRCode[];
  
  // Campos de QR Code (calculados desde qrCodes)
  qrToken?: string;
  qrData?: string;
  qrExpiresAt?: string;
  qrUsedAt?: string;
  scanCount: number;
  
  // Campos calculados para compatibilidad con el ejemplo
  numeroPersonas: number; // = guestCount
  razonVisita: string; // = specialRequests || ''
  beneficiosReserva: string; // = notes || ''
  promotor: Promotor; // = service info
  fecha: string; // calculado desde slot
  hora: string; // calculado desde slot
  codigoQR: string; // desde qrCodes[0]?.qrToken
  asistenciaActual: number; // desde qrCodes[0]?.scanCount
  estado: ReservationStatus; // = status
  fechaCreacion: string; // = reservedAt
  fechaModificacion?: string; // = updatedAt
  registroEntradas: {
    timestamp: string;
    cantidad: number;
    metodo: 'QR' | 'Manual';
    usuario?: string;
  }[];
}

export interface ReservationService {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  capacity: number;
  duration: number; // en minutos
  price?: number;
  isActive: boolean;
  metadata?: any;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  // Para compatibilidad, trataremos servicios como "promotores"
  promotor: Promotor;
}

export type SlotStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'BLOCKED';

export interface ReservationSlot {
  id: string;
  businessId: string;
  serviceId: string;
  date: string; // DateTime como string
  startTime: string; // DateTime como string
  endTime: string; // DateTime como string
  capacity: number;
  reservedCount: number;
  status: SlotStatus;
  price?: number;
  notes?: string;
  isRecurring: boolean;
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
}

export type QRCodeStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export interface ReservationQRCode {
  id: string;
  businessId: string;
  reservationId: string; // FK a Reservation
  qrToken: string;
  qrData: string;
  status: QRCodeStatus;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
  scanCount: number;
  lastScannedAt?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalReservas: number;
  totalAsistentes: number;
  promedioAsistencia: number;
  reservasHoy: number;
  reservasEnProgreso: number;
  reservasCompletadas: number;
}

export interface ReporteAsistencia {
  fecha: string;
  reservas: number;
  asistentes: number;
  porcentajeAsistencia: number;
}

// Tipos para formularios
export interface CrearReservaRequest {
  // Campos principales
  clienteId?: string; // Si existe el cliente
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  guestCount: number;
  specialRequests?: string;
  notes?: string;
  serviceId: string;
  slotId?: string; // Se puede calcular o especificar
  totalPrice?: number;
  
  // Campos de fecha/hora para el formulario
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  
  // Campos de compatibilidad con el ejemplo anterior
  numeroPersonas: number; // = guestCount
  razonVisita: string; // = specialRequests
  beneficiosReserva: string; // = notes
  
  // Campos opcionales adicionales
  source?: string;
  metadata?: any;
}

export interface EditarReservaRequest extends Partial<CrearReservaRequest> {
  id: string;
}

export interface ScanQRRequest {
  qrToken: string;
  cantidad?: number;
  metodo?: 'QR' | 'Manual';
}

export interface ScanQRResponse {
  success: boolean;
  reserva?: Reserva;
  message: string;
  nuevaAsistencia?: number;
}
