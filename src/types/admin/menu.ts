// Tipos relacionados con el menú y categorías
import { MenuCategory, MenuItem } from '../admin';

export interface CategoryFormData {
  id?: string;
  nombre: string;
  orden: number;
  activo: boolean;
  parentId: string | null;
  businessId: string;
}

export interface ProductFormData {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioVaso?: number;
  precioBotella?: number;
  disponible: boolean;
  categoryId: string;
  tipoProducto: 'simple' | 'bebida';
  imagen?: string;
  imagenUrl?: string;
  businessId: string;
}

// Tipos para las operaciones del menú
export interface MenuOperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Tipos para los hooks y contextos relacionados con el menú
export interface MenuContextType {
  categories: MenuCategory[];
  products: MenuItem[];
  loading: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
  saveCategory: (category: CategoryFormData) => Promise<MenuOperationResult>;
  deleteCategory: (id: string) => Promise<MenuOperationResult>;
  saveProduct: (product: ProductFormData) => Promise<MenuOperationResult>;
  deleteProduct: (id: string) => Promise<MenuOperationResult>;
  uploadProductImage: (file: File, productId: string) => Promise<string>;
}
