// Tipos para el sistema de administración

export interface MenuItem {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  precioVaso?: number;
  precioBotella?: number;
  disponible: boolean;
  categoryId: string;
  tipoProducto: 'simple' | 'bebida';
  imagen?: string;
}

export interface MenuCategory {
  id: string;
  nombre: string;
  descripcion?: string;
  parentId?: string;
  businessId: string;
  orden: number;
  activo: boolean;
}

export interface Cliente {
  id: string;
  cedula: string;
  nombre: string;
  correo?: string;
  telefono?: string;
  puntos: number;
  totalGastado: number;
  totalVisitas: number;
  nivel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  registeredAt: Date;
}

export interface Consumo {
  id: string;
  clienteId: string;
  total: number;
  puntos: number;
  registeredAt: Date;
  empleado: {
    name: string;
    email?: string;
  };
  cliente: {
    nombre: string;
    cedula: string;
  };
  productos: ProductoConsumo[];
  tipo: 'MANUAL' | 'OCR';
}

export interface ProductoConsumo {
  nombre: string;
  cantidad: number;
  precio?: number;
}

export interface BrandingConfig {
  businessName: string;
  primaryColor: string;
  carouselImages: string[];
  logoUrl?: string;
  welcomeMessage?: string;
}

export interface Banner {
  id: string;
  dia: string;
  imagenUrl: string;
  horaPublicacion: string;
  activo: boolean;
}

export interface Promocion {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  activo: boolean;
}

export interface Recompensa {
  id: string;
  titulo: string;
  descripcion: string;
  puntosRequeridos: number;
  activo: boolean;
  imagenUrl?: string;
}

export interface AdminStats {
  totalClientes: number;
  totalConsumos: number;
  totalIngresos: number;
  clientesActivos: number;
}

export interface FileUploadState {
  selectedFile: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetFile: () => void;
}

export interface FavoritoDelDia {
  id: string;
  producto: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  activo: boolean;
}

export interface StatsData {
  totalClients: number;
  totalConsumos: number;
  totalRevenue: number;
  unpaidCount: number;
}
