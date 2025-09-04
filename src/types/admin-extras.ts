// Definición de tipos adicionales para la aplicación administrativa

export interface CategoryFormData {
  nombre: string;
  orden: number;
  activo: boolean;
  parentId: string | null;
  businessId: string;
}

export interface ProductFormData {
  nombre: string;
  descripcion: string;
  precio: number;
  precioVaso?: number;
  precioBotella?: number;
  disponible: boolean;
  categoryId: string;
  tipoProducto: 'simple' | 'bebida' | 'botella';
  imagen?: string;
  imagenUrl?: string;
  businessId: string;
}

export interface PortalConfig {
  id: string;
  logoUrl?: string;
  colorPrimario: string;
  colorSecundario: string;
  colorAcento: string;
  colorFondo: string;
  colorTexto: string;
  nombreNegocio: string;
  descripcionNegocio?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  horario?: string;
  redesSociales?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    [platform: string]: string | undefined; // Para otras redes sociales
  };
  // Propiedades adicionales específicas del portal
  [key: string]: string | number | boolean | object | null | undefined;
}

export interface ConfigSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

export interface StatsData {
  totalClientes: number;
  clientesNuevos: number;
  puntosEmitidos: number;
  puntosCanjeados: number;
  ingresosMensuales: number;
  productosMasVendidos: {
    nombre: string;
    cantidad: number;
  }[];
  visitasPorDia: {
    dia: string;
    cantidad: number;
  }[];
  // Propiedades adicionales de estadísticas
  [key: string]: number | string | Array<{ nombre: string; cantidad: number }> | Array<{ dia: string; cantidad: number }> | undefined;
}
