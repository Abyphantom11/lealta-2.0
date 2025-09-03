// Tipos para la configuración del portal y branding
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
  };
  banners: BannerConfig[];
  promociones: PromocionConfig[];
  eventos: EventoConfig[];
  recompensas: RecompensaConfig[];
  tarjetas: TarjetaConfig[];
  favoritoDelDia: FavoritoDelDiaConfig[];
  [key: string]: any; // Para propiedades adicionales
}

export interface BannerConfig {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  activo: boolean;
  url?: string;
  orden?: number;
}

export interface PromocionConfig {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  fechaInicio: Date;
  fechaFin: Date;
  codigoPromo?: string;
  activo: boolean;
  puntos?: number;
  descuento?: number;
}

export interface EventoConfig {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  fecha: Date;
  hora: string;
  lugar: string;
  activo: boolean;
}

export interface RecompensaConfig {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  puntosNecesarios: number;
  stock: number;
  activo: boolean;
}

export interface TarjetaConfig {
  id: string;
  nivel: 'Bronce' | 'Plata' | 'Oro' | 'Diamante' | 'Platino';
  nombrePersonalizado: string;
  textoCalidad: string;
  condiciones: {
    puntosMinimos: number;
    gastosMinimos: number;
    visitasMinimas: number;
  };
  beneficios: string[];
  colores: {
    fondo: string;
    texto: string;
    acento: string;
  };
  imagenUrl?: string;
}

export interface FavoritoDelDiaConfig {
  id: string;
  dia: string; // Día de la semana (lunes, martes, etc.)
  productoId?: string;
  nombreProducto?: string;
  descripcion?: string;
  imagenUrl?: string;
  puntosExtra?: number;
  horaPublicacion: string; // Hora específica de publicación
  activo: boolean; // Estado activo/inactivo
  fecha?: Date;
}

export interface ConfigSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

// Tipos para operaciones de configuración
export interface ConfigOperationResult {
  success: boolean;
  message: string;
  config?: PortalConfig;
  error?: string;
}

// Tipos para los hooks y contextos relacionados con configuración
export interface ConfigContextType {
  config: PortalConfig | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  saveConfig: (config: PortalConfig) => Promise<ConfigOperationResult>;
  updateBanner: (banner: BannerConfig) => Promise<ConfigOperationResult>;
  updatePromocion: (
    promocion: PromocionConfig
  ) => Promise<ConfigOperationResult>;
  updateEvento: (evento: EventoConfig) => Promise<ConfigOperationResult>;
  updateRecompensa: (
    recompensa: RecompensaConfig
  ) => Promise<ConfigOperationResult>;
  updateTarjeta: (tarjeta: TarjetaConfig) => Promise<ConfigOperationResult>;
  updateFavoritoDia: (
    favorito: FavoritoDelDiaConfig
  ) => Promise<ConfigOperationResult>;
  uploadImage: (file: File, type: string, id?: string) => Promise<string>;
}
