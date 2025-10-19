/**
 * 🎯 Tipos TypeScript para Sistema de Tiempo Real
 * 
 * @description Definiciones de tipos para eventos SSE y sincronización en tiempo real
 * @author GitHub Copilot
 * @date 2025-10-19
 */

import { Reserva } from './reservation';

// 📡 Base SSE Event
export interface SSEEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

// 🎫 QR Scanned Event
export interface QRScannedEvent {
  reservaId: string;
  asistenciaActual: number;
  clienteNombre: string;
  businessId: string;
}

// 📝 Reservation Events
export interface ReservationCreatedEvent {
  reservaId: string;
  reserva: Reserva;
  businessId: string;
}

export interface ReservationUpdatedEvent {
  reservaId: string;
  updates: Partial<Reserva>;
  businessId: string;
}

export interface ReservationDeletedEvent {
  reservaId: string;
  businessId: string;
}

export interface StatusChangedEvent {
  reservaId: string;
  oldStatus: Reserva['estado'];
  newStatus: Reserva['estado'];
  businessId: string;
}

// 🔌 Connection Events
export interface ConnectedEvent {
  connectionId: string;
  timestamp: string;
}

export interface HeartbeatEvent {
  time: number;
}

export interface ErrorEvent {
  error: string;
  code?: string;
  timestamp: string;
}

// 🎭 Union type para todos los eventos
export type RealtimeEvent =
  | SSEEvent<QRScannedEvent>
  | SSEEvent<ReservationCreatedEvent>
  | SSEEvent<ReservationUpdatedEvent>
  | SSEEvent<ReservationDeletedEvent>
  | SSEEvent<StatusChangedEvent>
  | SSEEvent<ConnectedEvent>
  | SSEEvent<HeartbeatEvent>
  | SSEEvent<ErrorEvent>;

// 🔧 Event Handler Types
export type RealtimeEventHandler<T = any> = (event: SSEEvent<T>) => void;

export interface RealtimeEventHandlers {
  onQRScanned?: RealtimeEventHandler<QRScannedEvent>;
  onReservationCreated?: RealtimeEventHandler<ReservationCreatedEvent>;
  onReservationUpdated?: RealtimeEventHandler<ReservationUpdatedEvent>;
  onReservationDeleted?: RealtimeEventHandler<ReservationDeletedEvent>;
  onStatusChanged?: RealtimeEventHandler<StatusChangedEvent>;
  onConnected?: RealtimeEventHandler<ConnectedEvent>;
  onHeartbeat?: RealtimeEventHandler<HeartbeatEvent>;
  onError?: RealtimeEventHandler<ErrorEvent>;
}

// 📊 Connection Status
export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

export interface ConnectionState {
  status: ConnectionStatus;
  attempts: number;
  lastConnected?: Date;
  lastError?: Error;
}

// ⚙️ Options para hooks
export interface UseServerSentEventsOptions {
  businessId?: string;
  enabled?: boolean;
  onEvent?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
}

export interface UseRealtimeSyncOptions {
  businessId?: string;
  enabled?: boolean;
  handlers?: RealtimeEventHandlers;
}
