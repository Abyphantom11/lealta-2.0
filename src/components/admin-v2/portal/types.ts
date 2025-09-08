// Tipos compartidos para el módulo de tarjetas

export interface Tarjeta {
  id?: string;
  nivel: string;
  nombrePersonalizado: string;
  textoCalidad: string;
  colores: {
    gradiente: [string, string];
    texto: string;
    nivel: string;
  };
  condiciones: {
    puntosMinimos: number;
    gastosMinimos: number;
    visitasMinimas: number;
  };
  beneficio: string;
  activo: boolean;
}

export interface GeneralConfig {
  banners?: any[];
  promociones?: any[];
  eventos?: any[];
  favoritoDelDia?: any[];
  recompensas?: any[];
  tarjetas?: Tarjeta[];
  nombreEmpresa?: string;
  empresa?: { nombre: string };
  nivelesConfig?: Record<string, any>;
}

export interface Cliente {
  id: string;
  nombre: string;
  cedula: string;
  correo: string;
  puntos?: number;
  totalGastado?: number;
  totalVisitas?: number;
  tarjetaLealtad?: {
    nivel: string;
    activa: boolean;
    asignacionManual?: boolean;
  } | null;
}

export type NivelTarjeta = 'info' | 'success' | 'error' | 'warning';
