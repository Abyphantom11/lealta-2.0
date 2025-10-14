'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '../../../components/motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { MenuProductsViewProps, MenuItem } from './types';

// ✅ OPTIMIZACIÓN: Componente memoizado para cada producto
interface ProductItemProps {
  product: MenuItem;
  onSelect: (product: MenuItem) => void;
}

const ProductItem = React.memo<ProductItemProps>(({ product, onSelect }) => {
  return (
    <motion.div
      key={product.id}
      className="bg-gray-900 rounded-lg p-3 cursor-pointer hover:bg-gray-800 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={() => onSelect(product)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium text-sm">{product.nombre}</div>
          </div>
        </div>
        <div className="flex items-center">
          {(product.tipoProducto === 'bebida' || product.tipoProducto === 'botella') && product.precioVaso && product.precioBotella ? (
            <div className="text-right">
              <div className="text-white font-bold text-xs">
                Vaso: {product.precioVaso.toFixed(2)}
              </div>
              <div className="text-white font-bold text-xs">
                Bot: {product.precioBotella.toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="text-white font-bold text-sm">
              {(() => {
                if (product.precio) return product.precio.toFixed(2);
                if (product.precioVaso) return product.precioVaso.toFixed(2);
                return '0.00';
              })()} USD
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ProductItem.displayName = 'ProductItem';

const MenuProductsView: React.FC<MenuProductsViewProps> = ({
  products,
  isLoading,
  searchQuery
}) => {
  const skeletonIds = ['prod-1', 'prod-2', 'prod-3', 'prod-4'];
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  
  // ✅ OPTIMIZACIÓN: Memoizar la lista de productos para evitar re-renders innecesarios
  const productItems = useMemo(() => {
    // Validar que products sea un array antes de usar map
    if (!Array.isArray(products)) {
      console.warn('MenuProductsView: products is not an array:', products);
      return [];
    }
    
    return products.map((product: MenuItem) => (
      <ProductItem
        key={product.id}
        product={product}
        onSelect={setSelectedProduct}
      />
    ));
  }, [products]);
  
  // Renderizar estado de carga
  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'Productos'}
        </h2>
        <div className="animate-pulse space-y-4">
          {skeletonIds.map((id) => (
            <div key={id} className="h-16 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // Renderizar estado vacío
  if (!Array.isArray(products) || products.length === 0) {
    const getErrorMessage = () => {
      if (!Array.isArray(products)) return 'Error: Datos de productos inválidos';
      if (searchQuery) return 'No se encontraron productos que coincidan con tu búsqueda';
      return 'No hay productos disponibles en esta categoría';
    };
        
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'Productos'}
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">{getErrorMessage()}
            {searchQuery ? 'No se encontraron productos' : 'No hay productos disponibles'}
          </div>
          {searchQuery && (
            <div className="text-gray-500 text-sm">
              Intenta con otro término de búsqueda
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Renderizar productos
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        {searchQuery ? `Resultados para "${searchQuery}"` : 'Productos'}
      </h2>
      <div className="space-y-3">
        {/* ✅ OPTIMIZACIÓN: Usar productos memoizados */}
        {productItems}
      </div>
      
      {/* Modal para mostrar imagen y descripción del producto */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            {/* Overlay con blur */}
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
            />
            
            {/* Modal del producto */}
            <motion.div
              className="fixed inset-x-4 top-[10%] bottom-[10%] md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-gradient-to-b from-gray-900 to-black rounded-2xl z-[70] max-w-lg md:w-auto overflow-hidden flex flex-col shadow-2xl border border-gray-700/50"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsDraggingModal(true)}
              onDragEnd={(_, info) => {
                setIsDraggingModal(false);
                // Cerrar si se arrastra hacia arriba más de 100px o con velocidad suficiente
                if (info.offset.y < -100 || info.velocity.y < -500) {
                  setSelectedProduct(null);
                }
              }}
            >
              {/* Header con título y botón de cierre */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800/50 bg-gradient-to-r from-purple-900/20 to-emerald-900/20">
                <h3 className="text-white font-bold text-lg pr-2 flex-1">{selectedProduct.nombre}</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-all hover:scale-110 flex-shrink-0"
                  aria-label="Cerrar"
                >
                  <ArrowRight className="w-5 h-5 text-gray-300 rotate-45" />
                </button>
              </div>
              
              {/* Contenido scrolleable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Imagen del producto */}
                {selectedProduct.imagenUrl && (
                  <div className="flex justify-center bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                    <img
                      src={selectedProduct.imagenUrl}
                      alt={selectedProduct.nombre}
                      className="max-w-full max-h-72 object-contain rounded-lg"
                    />
                  </div>
                )}
                
                {/* Descripción del producto */}
                {selectedProduct.descripcion && (
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                    <h4 className="text-emerald-400 font-semibold text-sm mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Descripción
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {selectedProduct.descripcion}
                    </p>
                  </div>
                )}
                
                {/* Información de precio */}
                <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 rounded-xl p-4 border border-emerald-700/30">
                  <h4 className="text-emerald-400 font-semibold text-sm mb-2">Precio</h4>
                  <div className="space-y-1">
                    {(selectedProduct.tipoProducto === 'bebida' || selectedProduct.tipoProducto === 'botella') && selectedProduct.precioVaso && selectedProduct.precioBotella ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Vaso:</span>
                          <span className="text-white font-bold text-lg">${selectedProduct.precioVaso.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Botella:</span>
                          <span className="text-white font-bold text-lg">${selectedProduct.precioBotella.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Precio:</span>
                        <span className="text-white font-bold text-2xl">
                          ${(() => {
                            if (selectedProduct.precio) return selectedProduct.precio.toFixed(2);
                            if (selectedProduct.precioVaso) return selectedProduct.precioVaso.toFixed(2);
                            return '0.00';
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer con indicador de deslizar */}
              <div className="flex flex-col items-center py-3 px-5 border-t border-gray-800/50 bg-gray-900/50">
                <motion.div 
                  className="w-12 h-1 rounded-full mb-1"
                  animate={{ 
                    opacity: isDraggingModal ? 1 : [0.5, 1, 0.5],
                    scaleX: isDraggingModal ? 1.3 : [1, 1.2, 1],
                    backgroundColor: isDraggingModal ? '#10b981' : '#6b7280'
                  }}
                  transition={{ 
                    duration: isDraggingModal ? 0.2 : 2,
                    repeat: isDraggingModal ? 0 : Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.p 
                  className="text-xs"
                  animate={{ 
                    color: isDraggingModal ? '#10b981' : '#6b7280',
                    scale: isDraggingModal ? 1.05 : 1
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {isDraggingModal ? 'Suelta para cerrar' : 'Desliza hacia arriba para cerrar'}
                </motion.p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuProductsView;
