// Interfaces para API Routes - Autenticación
// Interfaces para NextAuth callbacks usando tipos oficiales de next-auth

import { JWT } from 'next-auth/jwt';
import { Session, User } from 'next-auth';

export interface NextAuthJWTPayload {
  token: JWT;
  user?: User & {
    role: string;
  };
}

export interface NextAuthSessionPayload {
  session: Session & {
    user: {
      role?: string;
    } & Session['user'];
  };
  token: JWT & {
    role?: string;
  };
}

// Interfaces para SignIn endpoint
export interface UserWithBusiness {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  businessId: string;
  passwordHash: string;
  isActive: boolean;
  loginAttempts: number;
  lockedUntil?: Date | null;
  lastLogin?: Date | null;
  sessionToken?: string | null;
  sessionExpires?: Date | null;
  business: {
    id: string;
    name: string;
    subdomain: string;
    subscriptionPlan: string;
    // isActive es opcional porque en algunos queries no se incluye
    isActive?: boolean;
  };
}

export interface SessionData {
  sessionToken: string;
  sessionExpires: Date;
}

// Interfaces para Admin Estadísticas
export interface TopCliente {
  id: string;
  nombre: string;
  cedula: string;
  totalGastado: number;
  totalVisitas: number;
  ultimaVisita?: Date;
  puntos: number;
  consumos: Array<{
    id: string;
    registeredAt: Date;
  }>;
}

export interface ProductoConsumo {
  id: string;
  nombre: string;
  precio: number;
  cantidad?: number;
  categoria?: string;
}

export interface ProductosConsumo {
  items: ProductoConsumo[];
}

export interface GoalsConfig {
  id: string;
  businessId: string;
  // Metas de Ingresos
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  // Metas de Clientes  
  dailyClients: number;
  weeklyClients: number;
  monthlyClients: number;
  // Metas de Transacciones
  dailyTransactions: number;
  weeklyTransactions: number;
  monthlyTransactions: number;
  // Otras metas
  targetTicketAverage: number;
  targetRetentionRate: number;
  targetConversionRate: number;
  targetTopClient: number;
  targetActiveClients: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVentasData {
  [nombreProducto: string]: {
    id: string;
    nombre: string;
    sales: number;
    revenue: number;
  };
}

export interface EmpleadoStats {
  id: string;
  nombre: string;
  consumos: number;
  totalMonto: number;
  totalPuntos: number;
}

// Interfaces para Portal Config
export interface PortalConfig {
  banners?: Banner[];
  promotions?: Promotion[];
  promociones?: any[];
  settings?: {
    lastUpdated?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  type: string;
  code: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  maxUses: number;
  currentUses: number;
  createdAt: string;
  updatedAt: string;
}

// Interfaces para Menu Management
export interface MenuCategoryUpdateData {
  nombre?: string;
  descripcion?: string | null;
  icono?: string | null;
  orden?: number;
  activo?: boolean;
  parentId?: string | null;
}

export interface ProductUpdateData {
  nombre?: string;
  descripcion?: string | null;
  precio?: number;
  disponible?: boolean;
  orden?: number;
  imagen?: string | null;
  menuCategoryId?: string;
}

export interface ProductCreateData {
  categoryId: string;
  nombre: string;
  tipoProducto?: string;
  descripcion?: string;
  precio?: number;
  precioVaso?: number;
  precioBotella?: number;
  imagenUrl?: string;
  destacado?: boolean;
  disponible?: boolean;
  opciones?: any;
}

// Interfaces para historial de cliente
export interface ProductoHistorial {
  nombre: string;
  cantidad: number;
}

export interface EstadisticasMensual {
  consumos: number;
  total: number;
  transacciones: number;
  puntos: number;
}

// Interfaces para Admin Dashboard
export interface FavoritoDelDia {
  id?: string;
  activo: boolean;
  imagenUrl?: string;
  dia?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoria?: string;
  titulo?: string;
  linkUrl?: string;
  orden?: number;
  horaPublicacion?: string;
}

export interface PromocionAdmin {
  id?: string;
  activo: boolean;
  titulo?: string;
  descripcion?: string;
  dia?: string;
  codigo?: string;
  descuento?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface RecompensaAdmin {
  id?: string;
  activo: boolean;
  nombre?: string;
  puntosRequeridos?: number;
  descripcion?: string;
  categoria?: string;
  stock?: number;
}

export interface BrandingConfig {
  businessName: string;
  primaryColor: string;
  carouselImages: string[];
  logoUrl?: string;
  secondaryColor?: string;
  accentColor?: string;
}

// Interfaces para Navigation Items
export interface NavigationItem {
  id: 'dashboard' | 'clientes' | 'menu' | 'portal' | 'analytics' | 'configuracion';
  label: string;
  icon: any; // React component type
}

export interface TabItem {
  id: string;
  label: string;
  icon: any; // React component type
}

export interface Tarjeta {
  nivel: string;
  nombrePersonalizado: string;
  textoCalidad: string;
  colores: {
    fondo: string;
    texto: string;
    acento: string;
  };
  diseño: {
    patron: string;
    textura: string;
    bordes: string;
  };
  condiciones: {
    puntosMinimos: number;
    gastosMinimos: number;
    visitasMinimas: number;
  };
  beneficios: string;
}
