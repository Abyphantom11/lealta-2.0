// Tipos para el sistema de analytics
export interface ProductoVenta {
  nombre: string;
  cantidad: number;
  precio: number;
  categoria?: string;
}

export interface TransaccionAnalizada {
  id: string;
  fechaTransaccion: Date;
  productos: ProductoVenta[];
  totalPesos: number;
  puntosGenerados: number;
  clienteId?: string;
  estadoAnalisis: 'pendiente' | 'procesado' | 'error';
  imagenOriginal?: string;
  confianza: number; // 0-1, qué tan segura está la IA
}

export interface AnalyticsData {
  transaccionesHoy: number;
  transaccionesAyer: number;
  puntosGenerados: number;
  ingresosTotales: number;
  productosTop: Array<{
    nombre: string;
    ventas: number;
    ingresos: number;
  }>;
  clientesTop: Array<{
    id: string;
    nombre: string;
    puntos: number;
    gastosTotal: number;
  }>;
  ventasPorHora: Array<{
    hora: number;
    ventas: number;
    ingresos: number;
  }>;
}

export interface GeminiAnalysisResult {
  productos: ProductoVenta[];
  total: number;
  fecha: string | null;
  empleado?: string | null;
  puntosGenerados: number;
  confianza: number;
  errores?: string[];
  metadata?: {
    tipoDocumento?: string;
    negocio?: string | null;
    metodoPago?: string | null;
  };
}
