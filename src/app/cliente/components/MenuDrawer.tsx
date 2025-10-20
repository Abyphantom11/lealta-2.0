'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '../../../components/motion';
import { ArrowRight, Search } from 'lucide-react';
import MenuView from './MenuView';
import { MenuDrawerProps } from './types';

const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isMenuDrawerOpen,
  setIsMenuDrawerOpen,
  searchQuery,
  setSearchQuery,
  activeMenuSection,
  setActiveMenuSection,
  selectedCategory,
  setSelectedCategory,
  filteredProducts,
  setFilteredProducts,
  menuCategories,
  setMenuCategories,
  menuProducts,
  allCategories,
  isLoadingMenu,
  loadCategoryProducts,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startTime, setStartTime] = useState(0);

  // Función para manejar navegación hacia atrás
  const handleBackNavigation = useCallback(async () => {
    // Limpiar búsqueda primero si está activa
    if (searchQuery) {
      setSearchQuery('');
      setFilteredProducts(menuProducts);
      return;
    }
    
    if (activeMenuSection === 'products') {
      // Si estamos en productos, volver a categorías (subcategorías o principales)
      setActiveMenuSection('categories');
      setSelectedCategory(null);
      
      // Recargar categorías principales
      const mainCategories = allCategories.filter((cat: any) => !cat.parentId);
      setMenuCategories(mainCategories);
    } else if (selectedCategory) {
      // Si estamos en subcategorías, volver a categorías principales
      const mainCategories = allCategories.filter((cat: any) => !cat.parentId);
      setMenuCategories(mainCategories);
      setSelectedCategory(null);
    } else {
      // Cerrar el drawer
      setIsMenuDrawerOpen(false);
    }
  }, [searchQuery, setSearchQuery, setFilteredProducts, menuProducts, activeMenuSection, 
      setActiveMenuSection, setSelectedCategory, allCategories, setMenuCategories, 
      selectedCategory, setIsMenuDrawerOpen]);

  // useEffect para manejar el gesto de atrás del dispositivo
  useEffect(() => {
    if (!isMenuDrawerOpen) return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      handleBackNavigation();
      // Agregar nueva entrada al historial para seguir interceptando
      window.history.pushState(null, '', window.location.href);
    };

    // Agregar entrada al historial para interceptar el back
    window.history.pushState(null, '', window.location.href);
    
    // Escuchar el evento popstate
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isMenuDrawerOpen, handleBackNavigation]);

  // Función de búsqueda
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!query.trim() || query.trim().length < 2) {
      // Si no hay búsqueda o es muy corta, limpiar filtros
      setFilteredProducts(menuProducts);
      return;
    }
    const searchLower = query.toLowerCase().trim();
    
    // Búsqueda global en TODOS los productos, no solo los de la categoría actual
    // Obtener todos los productos de todas las categorías
    const allProducts: any[] = [];
    
    // Recopilar productos de todas las categorías
    allCategories.forEach((category: any) => {
      if (category.productos && Array.isArray(category.productos)) {
        allProducts.push(...category.productos);
      }
    });
    
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
  }, [menuProducts, allCategories, setSearchQuery, setFilteredProducts]);

  return (
    <AnimatePresence>
      {isMenuDrawerOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <motion.div
            className="fixed top-0 left-0 right-0 bg-black text-white z-50 rounded-b-3xl flex flex-col"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ height: '85vh' }}
          >
            {/* Header del Drawer */}
            <div className="p-3 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleBackNavigation}
                    className="p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 text-gray-300 rotate-180" />
                  </button>
                  <h1 className="text-lg font-bold">
                    {(() => {
                      if (activeMenuSection === 'products') return 'Productos';
                      if (selectedCategory) return 'categorías';
                      return 'Nuestro Menú';
                    })()}
                  </h1>
                </div>
                <button 
                  onClick={() => setIsMenuDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 text-gray-300 rotate-45" />
                </button>
              </div>
              
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-400 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <ArrowRight className="w-3 h-3 rotate-45" />
                  </button>
                )}
              </div>


            </div>
            {/* Contenido del Menú */}
            <div className="flex-1 overflow-y-auto p-3">
              <MenuView
                searchQuery={searchQuery}
                activeMenuSection={activeMenuSection}
                setActiveMenuSection={setActiveMenuSection}
                filteredProducts={filteredProducts}
                menuCategories={menuCategories}
                menuProducts={menuProducts}
                allCategories={allCategories}
                isLoadingMenu={isLoadingMenu}
                setFilteredProducts={setFilteredProducts}
                loadCategoryProducts={loadCategoryProducts}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </div>
            
            {/* Indicador visual para gestos - Zona de Handle para cerrar */}
            <motion.div 
              className="flex flex-col items-center py-3 pt-2 cursor-pointer flex-shrink-0 border-t border-gray-700/50"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(_, info) => {
                setIsDragging(false);
                // Cerrar si se arrastra hacia arriba más de 80px o con velocidad suficiente
                if (info.offset.y < -80 || info.velocity.y < -500) {
                  setIsMenuDrawerOpen(false);
                }
              }}
              onTouchStart={(e) => {
                // Guardar la posición inicial del toque
                const touch = e.touches[0];
                setStartY(touch.clientY);
                setStartTime(Date.now());
              }}
              onTouchMove={(e) => {
                // Prevenir scroll del body mientras se arrastra
                if (isDragging) {
                  e.preventDefault();
                }
              }}
              onTouchEnd={(e) => {
                // Calcular la distancia y velocidad del deslizamiento
                const endY = e.changedTouches[0].clientY;
                const endTime = Date.now();
                
                const deltaY = startY - endY;
                const deltaTime = endTime - startTime;
                const velocity = deltaY / deltaTime; // px/ms
                
                // Si se deslizó hacia arriba más de 100px o con velocidad rápida, cerrar el menú
                if (deltaY > 100 || velocity > 0.5) {
                  setIsMenuDrawerOpen(false);
                }
              }}
            >
              <motion.div 
                className="w-12 h-1.5 bg-gray-500 rounded-full"
                initial={{ opacity: 0.6 }}
                animate={{ 
                  opacity: isDragging ? 1 : [0.6, 1, 0.6],
                  scaleX: isDragging ? 1.2 : [1, 1.1, 1],
                  backgroundColor: isDragging ? '#10b981' : '#6b7280'
                }}
                transition={{ 
                  duration: isDragging ? 0.2 : 2,
                  repeat: isDragging ? 0 : Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.p 
                className="text-xs mt-1"
                animate={{ 
                  color: isDragging ? '#10b981' : '#6b7280',
                  scale: isDragging ? 1.05 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                {isDragging ? 'Suelta para cerrar' : 'Desliza hacia arriba para cerrar'}
              </motion.p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MenuDrawer;
