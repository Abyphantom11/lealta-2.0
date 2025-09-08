'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Edit3, Trash2, Plus, UtensilsCrossed, DollarSign, Smartphone, CheckCircle, X, AlertTriangle, Info } from 'lucide-react';
import { MenuItem, MenuCategory } from '@/types/admin';
import CategoryModal from './CategoryModal';
import ProductModal from './ProductModal';
import MenuPreview from './MenuPreview';

interface MenuContentProps {
  className?: string;
  businessId?: string;
}

interface NotificationState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  show: boolean;
}

interface ConfirmModalState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText: string;
  type: 'danger' | 'warning';
}

/**
 * Componente principal de gestión del menú
 * Incluye categorías, productos y preview
 */
const MenuContent: React.FC<MenuContentProps> = ({ 
  className = '',
  businessId = 'business_1'
}) => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<'categorias' | 'productos' | 'preview'>('preview');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para notificaciones
  const [notification, setNotification] = useState<NotificationState>({
    type: 'success',
    message: '',
    show: false,
  });

  // Estados para modales
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);

  // Estado para modal de confirmación
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    type: 'danger',
  });

  // Función para mostrar notificaciones
  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Helper para obtener estilo de notificación
  const getNotificationClass = (type: string) => {
    if (type === 'success') return 'bg-green-600';
    if (type === 'error') return 'bg-red-600';
    if (type === 'warning') return 'bg-yellow-600';
    return 'bg-blue-600';
  };

  // Cargar datos del menú
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch(
          `/api/admin/menu?businessId=${businessId}`
        );
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.menu || []);
        }

        // Fetch products
        const productsResponse = await fetch(
          `/api/admin/menu/productos?businessId=${businessId}`
        );
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.productos || []);
        }
      } catch (error) {
        console.error('Error fetching menu data:', error);
        showNotification('error', 'Error cargando datos del menú');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  // Toggle del estado de categoría
  const toggleCategoryStatus = async (categoryId: string) => {
    const category = categories.find((c: MenuCategory) => c.id === categoryId);
    if (!category) return;

    try {
      const response = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: categoryId,
          activo: !category.activo,
        }),
      });

      if (response.ok) {
        setCategories(prev =>
          prev.map((c: MenuCategory) =>
            c.id === categoryId ? { ...c, activo: !c.activo } : c
          )
        );
        showNotification('success', 'Estado de categoría actualizado');
      } else {
        showNotification('error', 'Error actualizando categoría');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      showNotification('error', 'Error de conexión');
    }
  };

  // Toggle del estado de producto
  const toggleProductStatus = async (productId: string) => {
    const product = products.find((p: MenuItem) => p.id === productId);
    if (!product) return;

    try {
      const response = await fetch('/api/admin/menu/productos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          disponible: !product.disponible,
        }),
      });

      if (response.ok) {
        setProducts(prev =>
          prev.map((p: MenuItem) =>
            p.id === productId ? { ...p, disponible: !p.disponible } : p
          )
        );
        showNotification('success', 'Estado de producto actualizado');
      } else {
        showNotification('error', 'Error actualizando producto');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showNotification('error', 'Error de conexión');
    }
  };

  // Filtrar productos después de eliminar categoría
  const filterProductsAfterCategoryDelete = (
    products: MenuItem[],
    categoryIdToDelete: string
  ) => {
    return products.filter((p: MenuItem) => {
      const category = categories.find(c => c.id === p.categoryId);
      const isFromDeletedCategory = category?.id === categoryIdToDelete;
      const isFromDeletedSubcategory = category?.parentId === categoryIdToDelete;
      return !isFromDeletedCategory && !isFromDeletedSubcategory;
    });
  };

  // Ejecutar eliminación de categoría
  const executeDeleteCategory = async (categoryId: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/admin/menu?id=${encodeURIComponent(categoryId)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        setCategories(prev =>
          prev.filter((c: MenuCategory) => c.id !== categoryId)
        );
        // También eliminar productos de esta categoría y subcategorías
        setProducts(prev =>
          filterProductsAfterCategoryDelete(prev, categoryId)
        );
        showNotification('success', 'Categoría eliminada exitosamente');
      } else {
        const errorData = await response.json();
        showNotification(
          'error',
          `Error eliminando categoría: ${errorData.error || 'Error desconocido'}`
        );
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showNotification('error', 'Error de conexión al eliminar categoría');
    } finally {
      setIsLoading(false);
      setConfirmModal(prev => ({ ...prev, show: false }));
    }
  };

  // Eliminar categoría con confirmación
  const deleteCategory = async (categoryId: string) => {
    if (!categoryId) {
      showNotification('error', 'ID de la categoría no válido');
      return;
    }

    setConfirmModal({
      show: true,
      title: 'Eliminar Categoría',
      message:
        '¿Estás seguro de que quieres eliminar esta categoría? Esta acción eliminará también todos los productos y subcategorías asociados y no se puede deshacer.',
      confirmText: 'Eliminar',
      type: 'danger',
      onConfirm: () => {
        executeDeleteCategory(categoryId);
      },
    });
  };

  // Ejecutar eliminación de producto
  const executeDeleteProduct = async (productId: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/admin/menu/productos?id=${encodeURIComponent(productId)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        setProducts(prev => prev.filter((p: MenuItem) => p.id !== productId));
        showNotification('success', 'Producto eliminado exitosamente');
      } else {
        const errorData = await response.json();
        showNotification(
          'error',
          `Error eliminando producto: ${errorData.error || 'Error desconocido'}`
        );
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('error', 'Error de conexión al eliminar producto');
    } finally {
      setIsLoading(false);
      setConfirmModal(prev => ({ ...prev, show: false }));
    }
  };

  // Eliminar producto con confirmación
  const deleteProduct = async (productId: string) => {
    if (!productId) {
      showNotification('error', 'ID del producto no válido');
      return;
    }

    setConfirmModal({
      show: true,
      title: 'Eliminar Producto',
      message:
        '¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      type: 'danger',
      onConfirm: () => {
        executeDeleteProduct(productId);
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-dark-400">Cargando información del menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Gestión de Menú</h3>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-dark-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'preview'
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-dark-300 hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Vista Previa
        </button>
        <button
          onClick={() => setActiveTab('categorias')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'categorias'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-dark-300 hover:text-white'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 inline mr-2" />
          Categorías ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('productos')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'productos'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-dark-300 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Productos ({products.length})
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categorias' && (
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white">
              Categorías del Menú
            </h4>
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-success-600 hover:bg-success-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white">Nueva Categoría</span>
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center text-dark-400 py-12">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-dark-500" />
              <p>No hay categorías creadas</p>
              <p className="text-sm">Comienza creando tu primera categoría</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Categorías principales */}
              {categories
                .filter(cat => !cat.parentId)
                .map((category: MenuCategory) => (
                  <div key={category.id}>
                    {/* Categoría principal */}
                    <div className="bg-dark-800/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="text-lg font-medium text-white">
                            {category.nombre}
                          </h5>
                          <p className="text-dark-300 text-sm mt-1">
                            {category.descripcion}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs ${
                                category.activo
                                  ? 'bg-success-500/20 text-success-400'
                                  : 'bg-dark-600 text-dark-400'
                              }`}
                            >
                              {category.activo ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className="text-xs text-dark-400">
                              Orden: {category.orden}
                            </span>
                            <span className="text-xs text-primary-400">
                              Categoría Principal
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleCategoryStatus(category.id)}
                            className={`p-2 rounded-md ${
                              category.activo
                                ? 'text-success-400 hover:text-success-300 hover:bg-success-500/10'
                                : 'text-dark-400 hover:text-dark-300 hover:bg-dark-600'
                            }`}
                          >
                            {category.activo ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setShowCategoryModal(true);
                            }}
                            className="text-primary-400 hover:text-primary-300 p-2 rounded-md hover:bg-primary-500/10"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subcategorías */}
                    {categories.filter(
                      subcat => subcat.parentId === category.id
                    ).length > 0 && (
                      <div className="ml-8 mt-2 space-y-2">
                        {categories
                          .filter(subcat => subcat.parentId === category.id)
                          .map((subcategory: MenuCategory) => (
                            <div
                              key={subcategory.id}
                              className="bg-dark-700/30 rounded-lg p-3 border-l-4 border-primary-500"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h6 className="text-md font-medium text-white">
                                    {subcategory.nombre}
                                  </h6>
                                  <p className="text-dark-300 text-sm mt-1">
                                    {subcategory.descripcion}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span
                                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                                        subcategory.activo
                                          ? 'bg-success-500/20 text-success-400'
                                          : 'bg-dark-600 text-dark-400'
                                      }`}
                                    >
                                      {subcategory.activo
                                        ? 'Activo'
                                        : 'Inactivo'}
                                    </span>
                                    <span className="text-xs text-dark-400">
                                      Orden: {subcategory.orden}
                                    </span>
                                    <span className="text-xs text-yellow-400">
                                      Subcategoría
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      toggleCategoryStatus(subcategory.id)
                                    }
                                    className={`p-2 rounded-md ${
                                      subcategory.activo
                                        ? 'text-success-400 hover:text-success-300 hover:bg-success-500/10'
                                        : 'text-dark-400 hover:text-dark-300 hover:bg-dark-600'
                                    }`}
                                  >
                                    {subcategory.activo ? (
                                      <Eye className="w-4 h-4" />
                                    ) : (
                                      <EyeOff className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCategory(subcategory);
                                      setShowCategoryModal(true);
                                    }}
                                    className="text-primary-400 hover:text-primary-300 p-2 rounded-md hover:bg-primary-500/10"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteCategory(subcategory.id)
                                    }
                                    className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'productos' && (
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">
              Productos del Menú
            </h4>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-success-600 hover:bg-success-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white">Nuevo Producto</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center text-dark-400 py-12">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-dark-500" />
              <p>No hay productos creados</p>
              <p className="text-sm">Comienza agregando productos a tu menú</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: MenuItem) => {
                const category = categories.find(
                  (c: MenuCategory) => c.id === product.categoryId
                );
                return (
                  <div
                    key={product.id}
                    className="bg-dark-800/30 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h6 className="font-medium text-white">
                          {product.nombre}
                        </h6>
                        <p className="text-dark-300 text-sm mt-1">
                          {product.descripcion}
                        </p>
                        {category && (
                          <span className="inline-block px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full mt-2">
                            {category.nombre}
                          </span>
                        )}
                      </div>
                      {product.imagen && (
                        <div className="w-12 h-12 bg-dark-700 rounded-lg flex items-center justify-center ml-3">
                          <span className="text-dark-400 text-xs">IMG</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-3">
                      {product.precioVaso && (
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-300">Vaso:</span>
                          <span className="font-medium text-primary-400">
                            ${product.precioVaso}
                          </span>
                        </div>
                      )}
                      {product.precioBotella && (
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-300">Botella:</span>
                          <span className="font-medium text-primary-400">
                            ${product.precioBotella}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          product.disponible
                            ? 'bg-success-500/20 text-success-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {product.disponible ? 'Disponible' : 'No disponible'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleProductStatus(product.id)}
                          className={`p-1 rounded ${
                            product.disponible
                              ? 'text-success-400 hover:bg-success-500/10'
                              : 'text-dark-400 hover:bg-dark-600'
                          }`}
                        >
                          {product.disponible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductModal(true);
                          }}
                          className="text-primary-400 hover:bg-primary-500/10 p-1 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-400 hover:bg-red-500/10 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Vista Previa Tab */}
      {activeTab === 'preview' && (
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white">
              Vista Previa del Menú
            </h4>
            <div className="flex items-center space-x-2 text-sm text-dark-400">
              <Smartphone className="w-4 h-4" />
              <span>Vista del Cliente</span>
            </div>
          </div>

          {/* Vista previa del menú real implementada */}
          <MenuPreview 
            categories={categories.filter(cat => cat.activo)} 
            products={products.filter(prod => prod.disponible)}
          />
        </div>
      )}

      {/* Modal para crear/editar categoría */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onSave={async (formData) => {
            try {
              const url = editingCategory ? '/api/admin/menu' : '/api/admin/menu';
              const method = editingCategory ? 'PUT' : 'POST';
              const body = editingCategory 
                ? { ...formData, id: editingCategory.id }
                : formData;

              const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });

              if (response.ok) {
                const responseData = await response.json();
                const savedCategory = responseData.categoria || responseData;
                
                if (editingCategory) {
                  // Actualizar categoría existente
                  setCategories(prev =>
                    prev.map(cat => cat.id === editingCategory.id ? savedCategory : cat)
                  );
                  showNotification('success', 'Categoría actualizada exitosamente');
                } else {
                  // Agregar nueva categoría con estructura completa
                  const newCategory = {
                    ...savedCategory,
                    activo: savedCategory.activo ?? true, // Asegurar que tenga valor por defecto
                  };
                  setCategories(prev => [...prev, newCategory]);
                  showNotification('success', 'Categoría creada exitosamente');
                }
                setShowCategoryModal(false);
                setEditingCategory(null);
              } else {
                showNotification('error', 'Error guardando categoría');
              }
            } catch (error) {
              console.error('Error saving category:', error);
              showNotification('error', 'Error de conexión');
            }
          }}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Modal para crear/editar producto */}
      {showProductModal && (
        <ProductModal
          product={editingProduct ? {
            id: editingProduct.id,
            nombre: editingProduct.nombre,
            descripcion: editingProduct.descripcion || '',
            categoryId: editingProduct.categoryId,
            precio: editingProduct.precio || editingProduct.precioVaso || 0,
            precioVaso: editingProduct.precioVaso || 0,
            precioBotella: editingProduct.precioBotella || 0,
            tipoProducto: editingProduct.tipoProducto,
            disponible: editingProduct.disponible,
            destacado: false, // Por defecto false ya que MenuItem no tiene esta propiedad
            imagenUrl: editingProduct.imagenUrl || editingProduct.imagen || '',
            categoria: categories.find(cat => cat.id === editingProduct.categoryId)?.nombre || ''
          } : null}
          categories={categories.filter(cat => cat.activo)}
          onSave={async (formData) => {
            try {
              const url = editingProduct ? '/api/admin/menu/productos' : '/api/admin/menu/productos';
              const method = editingProduct ? 'PUT' : 'POST';
              const body = editingProduct 
                ? { ...formData, id: editingProduct.id }
                : formData;

              const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });

              if (response.ok) {
                const responseData = await response.json();
                const savedProduct = responseData.producto || responseData;
                
                if (editingProduct) {
                  // Actualizar producto existente
                  setProducts(prev =>
                    prev.map(prod => prod.id === editingProduct.id ? {
                      ...savedProduct,
                      categoria: categories.find(cat => cat.id === savedProduct.categoryId)?.nombre || ''
                    } : prod)
                  );
                  showNotification('success', 'Producto actualizado exitosamente');
                } else {
                  // Agregar nuevo producto con estructura completa
                  const newProduct = {
                    ...savedProduct,
                    categoria: categories.find(cat => cat.id === savedProduct.categoryId)?.nombre || '',
                    disponible: savedProduct.disponible ?? true, // Asegurar valor por defecto
                  };
                  setProducts(prev => [...prev, newProduct]);
                  showNotification('success', 'Producto creado exitosamente');
                }
                setShowProductModal(false);
                setEditingProduct(null);
              } else {
                showNotification('error', 'Error guardando producto');
              }
            } catch (error) {
              console.error('Error saving product:', error);
              showNotification('error', 'Error de conexión');
            }
          }}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Notificación */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${getNotificationClass(notification.type)}`}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <CheckCircle className="w-5 h-5 text-white" />
              )}
              {notification.type === 'error' && (
                <X className="w-5 h-5 text-white" />
              )}
              {notification.type === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-white" />
              )}
              {notification.type === 'info' && (
                <Info className="w-5 h-5 text-white" />
              )}
            </div>
            <p className="text-white text-sm font-medium">
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmModal.type === 'danger'
                    ? 'bg-red-600/20'
                    : 'bg-yellow-600/20'
                }`}
              >
                {confirmModal.type === 'danger' ? (
                  <Trash2 className="w-5 h-5 text-red-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() =>
                  setConfirmModal(prev => ({ ...prev, show: false }))
                }
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                  confirmModal.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuContent;
