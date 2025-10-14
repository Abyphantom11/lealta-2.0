// Types for product related data

export interface Product {
  id?: string;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria?: string;
  name?: string; // Para compatibilidad con diferentes formatos
  price?: number; // Para compatibilidad con diferentes formatos
}

export interface EditableProduct {
  name: string;
  price: number;
  line: string;
}

export interface AnalysisProduct {
  nombre: string;
  precio: number;
  cantidad: number;
  categoria?: string;
}
