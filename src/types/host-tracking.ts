// 🏠 Tipos para el sistema de Fidelización por Anfitrión

export interface HostTracking {
  id: string;
  businessId: string;
  reservationId: string;
  clienteId: string;
  reservationName: string;
  tableNumber: string | null;
  reservationDate: Date;
  guestCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HostTrackingWithRelations extends HostTracking {
  anfitrion: {
    id: string;
    nombre: string;
    cedula: string;
    correo: string;
    telefono: string;
  };
  reservation: {
    id: string;
    reservationNumber: string;
    status: string;
  };
  guestConsumos: GuestConsumo[];
}

export interface GuestConsumo {
  id: string;
  businessId: string;
  hostTrackingId: string;
  consumoId: string;
  guestCedula: string | null;
  guestName: string | null;
  createdAt: Date;
}

export interface GuestConsumoWithDetails extends GuestConsumo {
  consumo: {
    id: string;
    total: number;
    productos: any[];
    registeredAt: Date;
    cliente: {
      nombre: string;
      cedula: string;
    };
  };
}

// Stats del anfitrión para el portal del cliente
export interface HostStats {
  totalConsumo: number;
  totalInvitados: number;
  totalEventos: number;
  productosFavoritos: ProductoFavorito[];
  eventosRecientes: HostEvent[];
}

export interface ProductoFavorito {
  nombre: string;
  cantidad: number; // Número de veces ordenado
  totalGastado: number;
  categoria?: string;
}

export interface HostEvent {
  id: string;
  fecha: Date;
  mesa: string | null;
  invitados: number;
  totalConsumo: number;
  consumosDetalle: GuestConsumoDetail[];
}

export interface GuestConsumoDetail {
  guestName: string;
  guestCedula: string | null;
  total: number;
  productos: string[]; // Lista de nombres de productos
  registeredAt: Date;
}

// Payload para búsqueda de anfitriones
export interface HostSearchParams {
  businessId: string;
  query: string;
  searchMode: 'table' | 'name';
  date: string; // ISO date
}

export interface HostSearchResult {
  id: string;
  reservationName: string;
  tableNumber: string | null;
  guestCount: number;
  reservationDate: Date;
  anfitrionNombre: string;
  anfitrionCedula: string;
  reservationNumber: string;
  consumosVinculados?: number; // Cantidad de consumos ya vinculados
  reservationStatus?: string; // Estado de la reserva
}

// Payload para vincular consumo a anfitrión
export interface LinkGuestConsumoPayload {
  hostTrackingId: string;
  consumoId: string;
  guestCedula?: string;
  guestName?: string;
}

// Payload para activar tracking manualmente
export interface ActivateHostTrackingPayload {
  businessId: string;
  reservationId: string;
  clienteId: string;
  reservationName: string;
  tableNumber?: string;
  reservationDate: string; // ISO date
  guestCount: number;
}

// Response types
export interface HostTrackingResponse {
  success: boolean;
  data?: HostTracking;
  error?: string;
}

export interface HostSearchResponse {
  success: boolean;
  results?: HostSearchResult[];
  error?: string;
}

export interface HostStatsResponse {
  success: boolean;
  stats?: HostStats;
  error?: string;
}

export interface GuestConsumoResponse {
  success: boolean;
  data?: GuestConsumo;
  error?: string;
}
