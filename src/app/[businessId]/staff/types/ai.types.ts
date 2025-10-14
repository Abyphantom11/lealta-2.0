// Types for AI analysis and processing

import { AnalysisProduct } from './product.types';

// Re-export product types for convenience
export type { AnalysisProduct, EditableProduct } from './product.types';

export interface AIAnalysis {
  empleadoDetectado: string;
  productos: AnalysisProduct[];
  total: number;
  confianza: number;
}

export interface AIResult {
  cliente: {
    id: string;
    nombre: string;
    cedula: string;
    puntos: number;
  };
  analisis: AIAnalysis;
  metadata: {
    businessId: string;
    empleadoId: string;
    imagenUrl: string;
    isBatchProcess?: boolean;
    totalImages?: number;
    successfulImages?: number;
  };
}
