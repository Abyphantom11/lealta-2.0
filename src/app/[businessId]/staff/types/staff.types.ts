// Types for staff dashboard and general functionality

export type NotificationType = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

export interface RecentTicket {
  id: string;
  cliente: string;
  cedula: string;
  productos: string[];
  total: number;
  puntos: number;
  fecha: string;
  monto: number;
  items: string[];
  hora: string;
  tipo?: string;
}

export interface TodayStats {
  ticketsProcessed: number;
  totalPoints: number;
  totalAmount: number;
}

export interface StaffPageContentProps {
  readonly businessId: string;
}
