import { Dispatch, SetStateAction } from 'react';

// Tipos base
export interface Banner {
  id: string;
  titulo: string;
  descripcion?: string;
  imagen: string;
  imagenUrl?: string;
  activo: boolean;
  dia?: string;
  horaPublicacion?: string;
}

export interface Promocion {
  id: string;
  titulo: string;
  descripcion?: string;
  imagen?: string;
  imagenUrl?: string;
  descuento: number;
  activo: boolean;
  dia?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  horaTermino?: string;
}

export interface Recompensa {
  id: string;
  titulo: string;
  nombre: string;
  descripcion?: string;
  puntosRequeridos: number;
  imagen?: string;
  imagenUrl?: string;
  activo: boolean;
  stock?: number;
}

export interface FavoritoDelDia {
  id: string;
  nombre?: string;
  imagenUrl: string;
  activo: boolean;
  dia?: string;
}

export interface MenuCategory {
  id: string;
  nombre: string;
  parentId?: string;
  productos?: MenuItem[];
}

export interface MenuItem {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  precioVaso?: number;
  precioBotella?: number;
  tipoProducto: string;
  imagenUrl?: string;
}

export interface ClienteData {
  id: string;
  cedula: string;
  nombre?: string;
  telefono?: string;
  email?: string;
  tarjetaLealtad?: {
    nivel: string;
    puntos: number; // Puntos canjeables del cliente
    puntosProgreso: number; // ✅ NUEVO: Puntos específicos para progreso de tarjeta
    asignacionManual?: boolean; // ✅ AGREGAR CAMPO PARA DETECTAR ASIGNACIONES MANUALES
  };
}

export interface BrandingConfig {
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  carouselImages?: string[];
}

// Props para MenuView
export interface MenuViewProps {
  searchQuery: string;
  activeMenuSection: 'categories' | 'products';
  setActiveMenuSection?: Dispatch<SetStateAction<'categories' | 'products'>>;
  filteredProducts: MenuItem[];
  menuCategories: MenuCategory[];
  menuProducts: MenuItem[];
  allCategories: MenuCategory[];
  isLoadingMenu: boolean;
  setFilteredProducts: Dispatch<SetStateAction<MenuItem[]>>;
  loadCategoryProducts: (categoryId: string) => void;
  selectedCategory?: MenuCategory | null;
  setSelectedCategory?: Dispatch<SetStateAction<MenuCategory | null>>;
}

// Props para MenuDrawer
export interface MenuDrawerProps {
  isMenuDrawerOpen: boolean;
  setIsMenuDrawerOpen: Dispatch<SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  activeMenuSection: 'categories' | 'products';
  setActiveMenuSection: Dispatch<SetStateAction<'categories' | 'products'>>;
  selectedCategory: MenuCategory | null;
  setSelectedCategory: Dispatch<SetStateAction<MenuCategory | null>>;
  filteredProducts: MenuItem[];
  setFilteredProducts: Dispatch<SetStateAction<MenuItem[]>>;
  menuCategories: MenuCategory[];
  setMenuCategories: Dispatch<SetStateAction<MenuCategory[]>>;
  menuProducts: MenuItem[];
  allCategories: MenuCategory[];
  isLoadingMenu: boolean;
  loadCategoryProducts: (categoryId: string) => void;
}

// Props para MenuCategoriesView
export interface MenuCategoriesViewProps {
  readonly categories: readonly MenuCategory[];
  readonly onCategorySelect: (categoryId: string) => void;
  readonly isLoading: boolean;
  readonly searchQuery: string;
}

// Props para MenuProductsView
export interface MenuProductsViewProps {
  readonly products: readonly MenuItem[];
  readonly isLoading: boolean;
  readonly searchQuery: string;
}

// Props para AuthHandler
export interface AuthHandlerProps {
  brandingConfig: BrandingConfig;
}

// Props para Dashboard
export interface DashboardProps {
  clienteData: ClienteData | null;
  cedula: string;
  brandingConfig: BrandingConfig;
  onMenuOpen: () => void;
  handleLogout: () => void;
  showLevelUpAnimation: boolean;
  setShowLevelUpAnimation: Dispatch<SetStateAction<boolean>>;
  oldLevel: string;
  newLevel: string;
  showTarjeta: boolean;
  setShowTarjeta: Dispatch<SetStateAction<boolean>>;
  portalConfig: any;
}

// Estado de pasos de autenticación
export type AuthStep = 'presentation' | 'cedula' | 'register' | 'dashboard';

// Estados de formulario
export interface FormData {
  cedula: string;
  nombre: string;
  telefono: string;
  email: string;
}

export interface FormErrors {
  cedula?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
}
