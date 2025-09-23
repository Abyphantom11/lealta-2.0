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
  
  // ✅ OPTIMIZACIÓN: Memoizar la lista de productos para evitar re-renders innecesarios
  const productItems = useMemo(() => {
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
  if (products.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'Productos'}
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
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
            <motion.div
              className="fixed inset-0 bg-black/70 z-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
            />
            <motion.div
              className="fixed top-4 left-4 right-4 bottom-4 md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-gray-900 rounded-xl p-6 z-70 max-w-lg md:w-auto overflow-y-auto flex flex-col border border-gray-700"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-white font-semibold text-lg">{selectedProduct.nombre}</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 text-gray-400 rotate-45" />
                </button>
              </div>
              
              {selectedProduct.imagenUrl && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={selectedProduct.imagenUrl}
                    alt={selectedProduct.nombre}
                    className="max-w-full max-h-64 object-contain bg-gray-800 rounded-lg"
                  />
                </div>
              )}
              
              {!selectedProduct.imagenUrl && selectedProduct.descripcion && (
                <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                  <p className="text-gray-300 text-sm leading-relaxed text-center">
                    {selectedProduct.descripcion}
                  </p>
                </div>
              )}
              
              {selectedProduct.imagenUrl && selectedProduct.descripcion && (
                <div className="text-center">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedProduct.descripcion}
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuProductsView;
