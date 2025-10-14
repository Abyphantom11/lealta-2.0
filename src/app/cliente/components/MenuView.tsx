'use client';

import { useCallback, useEffect } from 'react';
import MenuCategoriesView from './MenuCategoriesView';
import MenuProductsView from './MenuProductsView';
import { MenuViewProps } from './types';

const MenuView: React.FC<MenuViewProps> = ({
  searchQuery,
  activeMenuSection,
  // setActiveMenuSection, // No se usa en este componente
  filteredProducts,
  menuCategories,
  menuProducts,
  allCategories,
  isLoadingMenu,
  setFilteredProducts,
  loadCategoryProducts,
  // setSelectedCategory, // No se usa en este componente
  // selectedCategory, // No se usa en este componente
}) => {
  // Función de búsqueda global - busca en todos los productos independientemente de la vista
  const handleSearch = useCallback((query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      // Si no hay búsqueda o es muy corta, limpiar filtros
      setFilteredProducts(Array.isArray(menuProducts) ? menuProducts : []);
      return;
    }
    const searchLower = query.toLowerCase().trim();
    
    // Búsqueda global en TODOS los productos, no solo los de la categoría actual
    // Obtener todos los productos de todas las categorías
    const allProducts: any[] = [];
    
    // Recopilar productos de todas las categorías
    if (Array.isArray(allCategories)) {
      allCategories.forEach((category: any) => {
        if (category.productos && Array.isArray(category.productos)) {
          allProducts.push(...category.productos);
        }
      });
    }
    
    // Búsqueda mejorada en todos los productos
    const filtered = allProducts.filter((product: any) => {
      const nombre = product.nombre?.toLowerCase() || '';
      const descripcion = product.descripcion?.toLowerCase() || '';
      
      // Buscar palabras completas o al inicio de palabras
      const words = searchLower.split(' ').filter(word => word.length > 1);
      
      return words.some(word => 
        nombre.includes(word) || 
        descripcion.includes(word) ||
        nombre.startsWith(word) ||
        descripcion.startsWith(word)
      );
    });
    
    setFilteredProducts(filtered);
  }, [menuProducts, allCategories, setFilteredProducts]);

  // Effect para actualizar filtros cuando cambian los datos
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      handleSearch(searchQuery);
    } else {
      // Asegurar que menuProducts sea un array antes de pasarlo
      setFilteredProducts(Array.isArray(menuProducts) ? menuProducts : []);
    }
  }, [menuCategories, menuProducts, allCategories, handleSearch, searchQuery, setFilteredProducts]);

  if (searchQuery && searchQuery.length >= 2) {
    return (
      <MenuProductsView 
        products={Array.isArray(filteredProducts) ? filteredProducts : []}
        isLoading={isLoadingMenu}
        searchQuery={searchQuery}
      />
    );
  }
  
  if (activeMenuSection === 'categories') {
    return (
      <MenuCategoriesView 
        categories={menuCategories}
        onCategorySelect={loadCategoryProducts}
        isLoading={isLoadingMenu}
        searchQuery=""
      />
    );
  }

  return (
    <MenuProductsView 
      products={Array.isArray(menuProducts) ? menuProducts : []}
      isLoading={isLoadingMenu}
      searchQuery=""
    />
  );
};

export default MenuView;
