// Hook personalizado para la gestión del menú
import { useState, useCallback, useEffect } from 'react';
import { MenuCategory, MenuItem } from '../../../types/admin';
import { 
  CategoryFormData, 
  ProductFormData,
  MenuOperationResult
} from '../../../types/admin/menu';
import logger from '../../../lib/logger';

export function useMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar las categorías y productos del menú
  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/menu?businessId=business_1');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.menu || []);
        setProducts(data.productos || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al cargar el menú');
        logger.error('Error al cargar menú:', errorData);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar el menú: ${message}`);
      logger.error('Error al cargar menú:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para guardar una categoría
  const saveCategory = useCallback(async (category: CategoryFormData): Promise<MenuOperationResult> => {
    setLoading(true);
    try {
      const method = category.id ? 'PUT' : 'POST';
      const url = category.id 
        ? `/api/admin/menu/categorias/${category.id}` 
        : '/api/admin/menu/categorias';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (response.ok) {
        const result = await response.json();
        // Actualizar las categorías en el estado
        fetchMenu();
        return {
          success: true,
          message: category.id ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente',
          data: result
        };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al guardar la categoría');
        logger.error('Error al guardar categoría:', errorData);
        return {
          success: false,
          message: 'Error al guardar la categoría',
          error: errorData.message
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al guardar la categoría: ${message}`);
      logger.error('Error al guardar categoría:', error);
      return {
        success: false,
        message: 'Error al guardar la categoría',
        error: message
      };
    } finally {
      setLoading(false);
    }
  }, [fetchMenu]);

  // Función para eliminar una categoría
  const deleteCategory = useCallback(async (id: string): Promise<MenuOperationResult> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/menu/categorias/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Actualizar las categorías en el estado
        fetchMenu();
        return {
          success: true,
          message: 'Categoría eliminada correctamente'
        };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar la categoría');
        logger.error('Error al eliminar categoría:', errorData);
        return {
          success: false,
          message: 'Error al eliminar la categoría',
          error: errorData.message
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al eliminar la categoría: ${message}`);
      logger.error('Error al eliminar categoría:', error);
      return {
        success: false,
        message: 'Error al eliminar la categoría',
        error: message
      };
    } finally {
      setLoading(false);
    }
  }, [fetchMenu]);

  // Función para guardar un producto
  const saveProduct = useCallback(async (product: ProductFormData): Promise<MenuOperationResult> => {
    setLoading(true);
    try {
      const method = product.id ? 'PUT' : 'POST';
      const url = product.id 
        ? `/api/admin/menu/productos/${product.id}` 
        : '/api/admin/menu/productos';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      if (response.ok) {
        const result = await response.json();
        // Actualizar los productos en el estado
        fetchMenu();
        return {
          success: true,
          message: product.id ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
          data: result
        };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al guardar el producto');
        logger.error('Error al guardar producto:', errorData);
        return {
          success: false,
          message: 'Error al guardar el producto',
          error: errorData.message
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al guardar el producto: ${message}`);
      logger.error('Error al guardar producto:', error);
      return {
        success: false,
        message: 'Error al guardar el producto',
        error: message
      };
    } finally {
      setLoading(false);
    }
  }, [fetchMenu]);

  // Función para eliminar un producto
  const deleteProduct = useCallback(async (id: string): Promise<MenuOperationResult> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/menu/productos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Actualizar los productos en el estado
        fetchMenu();
        return {
          success: true,
          message: 'Producto eliminado correctamente'
        };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar el producto');
        logger.error('Error al eliminar producto:', errorData);
        return {
          success: false,
          message: 'Error al eliminar el producto',
          error: errorData.message
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al eliminar el producto: ${message}`);
      logger.error('Error al eliminar producto:', error);
      return {
        success: false,
        message: 'Error al eliminar el producto',
        error: message
      };
    } finally {
      setLoading(false);
    }
  }, [fetchMenu]);

  // Función para subir la imagen de un producto
  const uploadProductImage = useCallback(async (file: File, productId: string): Promise<string> => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al subir la imagen');
        logger.error('Error al subir imagen:', errorData);
        throw new Error(errorData.message || 'Error al subir la imagen');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al subir la imagen: ${message}`);
      logger.error('Error al subir imagen:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar el menú inicialmente
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return {
    categories,
    products,
    loading,
    error,
    fetchMenu,
    saveCategory,
    deleteCategory,
    saveProduct,
    deleteProduct,
    uploadProductImage
  };
}
