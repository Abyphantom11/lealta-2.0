'use client';

import { motion } from '../../../components/motion';
import { Sparkles } from 'lucide-react';
import { MenuCategoriesViewProps, MenuCategory } from './types';

const MenuCategoriesView: React.FC<MenuCategoriesViewProps> = ({
  categories,
  onCategorySelect,
  isLoading,
  searchQuery
}) => {
  const skeletonIds = ['cat-1', 'cat-2', 'cat-3', 'cat-4'];

  // Renderizar estado de carga
  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'categorías'}
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
  if (categories.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'categorías'}
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            {searchQuery ? 'No se encontraron categorías' : 'No hay categorías disponibles'}
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

  // Renderizar categorías
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        {searchQuery ? `Resultados para "${searchQuery}"` : 'categorías'}
      </h2>
      <div className="space-y-3">
        {categories.map((category: MenuCategory) => (
          <motion.div
            key={category.id}
            className="bg-gray-900 rounded-lg p-3 cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => onCategorySelect(category.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                category.parentId
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">{category.nombre}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MenuCategoriesView;
