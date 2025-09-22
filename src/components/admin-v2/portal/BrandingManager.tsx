'use client';

import React from 'react';
import { Building, Save } from 'lucide-react';
import { SharedBrandingConfig } from './shared-branding-types';

/**
 * Componente BrandingManager
 * Extraído del admin original: src/app/admin/page.tsx (líneas 3407-3700)
 * RESPONSABILIDAD: Gestión completa del branding con carrusel de imágenes
 */

interface BrandingManagerProps {
  brandingConfig: SharedBrandingConfig;
  handleBrandingChange: (field: string, value: string | string[]) => Promise<void>;
  showNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const BrandingManager: React.FC<BrandingManagerProps> = ({
  brandingConfig,
  handleBrandingChange,
  showNotification,
}) => {

  /**
   * Manejo de subida de imágenes del carrusel
   * ✅ IMPLEMENTACIÓN SIMPLIFICADA: Upload directo
   */
  const handleCarouselImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar límite de imágenes
    const currentImages = brandingConfig.carouselImages || [];
    if (currentImages.length >= 6) {
      showNotification('Máximo 6 imágenes permitidas en el carrusel', 'warning');
      event.target.value = '';
      return;
    }

    try {
      console.log('📁 Iniciando upload de imagen:', file.name);
      
      // ✅ Upload directo usando FormData
      const formData = new FormData();
      formData.append('file', file);

      showNotification('🔄 Subiendo imagen...', 'info');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      const imageUrl = result.fileUrl;

      // Agregar imagen al carrusel
      const updatedImages = [...currentImages, imageUrl];
      await handleBrandingChange('carouselImages', updatedImages);
      
      showNotification(`✅ Imagen agregada al carrusel (${updatedImages.length}/6)`, 'success');
      
    } catch (error) {
      console.error('Error en handleCarouselImageUpload:', error);
      showNotification(`❌ Error al subir imagen: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      // Limpiar input para permitir cargar la misma imagen nuevamente
      event.target.value = '';
    }
  };

  /**
   * Remover imagen del carrusel
   * Extraído de: src/app/admin/page.tsx (líneas 2800-2850)
   */
  const handleRemoveCarouselImage = async (index: number) => {
    const currentImages = brandingConfig.carouselImages || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    
    await handleBrandingChange('carouselImages', updatedImages);
    showNotification(`Imagen removida del carrusel (${updatedImages.length}/6)`, 'success');
  };

  /**
   * Función para actualizar portal y mostrar feedback
   * ✅ MEJORADA: Solo guardar datos básicos en localStorage, las imágenes se cargan desde BD
   */
  const handleUpdatePortal = () => {
    try {
      // ✅ SOLUCIÓN: Solo guardar datos básicos en localStorage (NO imágenes)
      // Las imágenes se cargan directamente desde la base de datos vía API
      const lightConfig = {
        businessName: brandingConfig.businessName,
        primaryColor: brandingConfig.primaryColor,
        // ❌ NO incluir carouselImages - evita corrupción de localStorage
        lastUpdated: new Date().toISOString(),
      };

      try {
        localStorage.setItem('portalBranding', JSON.stringify(lightConfig));
        
        // Enviar evento personalizado para notificar cambios
        window.dispatchEvent(new CustomEvent('brandingUpdated', {
          detail: {
            ...brandingConfig,
            source: 'admin-update'
          },
        }));

        // También usar storage event para otras pestañas
        localStorage.setItem('brandingTrigger', Date.now().toString());

        showNotification('✅ Portal actualizado - Los cambios se verán inmediatamente', 'success');
        
      } catch (storageError) {
        console.warn('localStorage lleno, pero la sincronización funciona vía BD:', storageError);
        
        // Aún así enviar evento porque la BD está actualizada
        window.dispatchEvent(new CustomEvent('brandingUpdated', {
          detail: {
            ...brandingConfig,
            source: 'admin-update-no-storage'
          },
        }));
        
        showNotification('✅ Portal actualizado vía base de datos', 'success');
      }
      
    } catch (error) {
      console.error('Error actualizando portal:', error);
      showNotification('❌ Error al actualizar el portal', 'error');
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="flex items-center mb-6">
        <Building className="w-6 h-6 mr-2 text-primary-500" />
        <h4 className="text-lg font-semibold text-white">
          Branding del Portal Cliente
        </h4>
      </div>

      <div className="space-y-6">
        {/* Nombre del Negocio */}
        <div>
          <label
            htmlFor="business-name"
            className="block text-sm font-medium text-white mb-2"
          >
            Nombre del Negocio
          </label>
          <input
            type="text"
            id="business-name"
            value={brandingConfig.businessName}
            onChange={e => handleBrandingChange('businessName', e.target.value)}
            className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="LEALTA"
          />
          <p className="text-dark-400 text-xs mt-1">
            Aparece en la esquina superior izquierda del portal
          </p>
        </div>

        {/* Imágenes del Carrusel */}
        <div>
          <div className="block text-sm font-medium text-white mb-2">
            Imágenes del Carrusel (máx. 6)
          </div>
          <div className="space-y-4">
            {/* Grid de imágenes actuales */}
            <div className="grid grid-cols-2 gap-3">
              {Array.isArray(brandingConfig.carouselImages) && brandingConfig.carouselImages
                .filter((imageUrl: string | number) => {
                  // ✅ PROTECCIÓN MEJORADA: Filtrar solo URLs válidas
                  if (typeof imageUrl !== 'string') return false;
                  if (imageUrl.length < 10) return false;
                  
                  // Rechazar datos base64 muy largos (probablemente corruptos)
                  if (imageUrl.startsWith('data:') && imageUrl.length > 1000) return false;
                  
                  // Aceptar URLs válidas
                  return imageUrl.startsWith('http') || imageUrl.startsWith('/uploads/') || imageUrl.startsWith('data:image');
                })
                .map((imageUrl: string, index: number) => (
                  <div
                    key={`carousel-${index}-${imageUrl.substring(0, 20)}`}
                    className="relative group"
                  >
                    <img
                      src={imageUrl}
                      alt={`Carrusel ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-dark-600"
                      onError={(e) => {
                        // ✅ PROTECCIÓN: Mostrar placeholder si la imagen falla
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEyIiB5PSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSI4Ij5FcnJvcjwvdGV4dD4KPHN2Zz4K';
                        console.warn(`❌ Error cargando imagen ${index + 1}:`, imageUrl);
                      }}
                    />
                    <button
                      onClick={() => handleRemoveCarouselImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                )
              )}

              {/* Botón para agregar nueva imagen */}
              {(!brandingConfig.carouselImages || brandingConfig.carouselImages.length < 6) && (
                <div className="relative">
                  <input
                    type="file"
                    id="carousel-upload"
                    accept="image/*"
                    onChange={handleCarouselImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-full h-24 border-2 border-dashed border-dark-600 rounded-lg flex flex-col items-center justify-center text-dark-400 hover:border-primary-500 hover:text-primary-400 transition-colors cursor-pointer">
                    <svg
                      className="w-6 h-6 mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-xs">Agregar</span>
                  </div>
                </div>
              )}
            </div>

            {/* Información y controles */}
            <div className="bg-dark-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  {brandingConfig.carouselImages?.length || 0} / 6 imágenes
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBrandingChange('carouselImages', [])}
                    className="text-red-400 hover:text-red-300 text-xs"
                    disabled={!brandingConfig.carouselImages?.length}
                  >
                    Limpiar todo
                  </button>
                </div>
              </div>
              <p className="text-dark-400 text-xs">
                Las imágenes aparecen en el carrusel del login con rotación automática cada 6 segundos
              </p>
            </div>
          </div>
        </div>

        {/* Color Primario */}
        <div>
          <label
            htmlFor="primary-color"
            className="block text-sm font-medium text-white mb-2"
          >
            Color Primario
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              id="primary-color"
              value={brandingConfig.primaryColor}
              onChange={e => handleBrandingChange('primaryColor', e.target.value)}
              className="w-12 h-10 rounded-lg border-2 border-dark-600 bg-dark-800"
            />
            <input
              type="text"
              value={brandingConfig.primaryColor}
              onChange={e => handleBrandingChange('primaryColor', e.target.value)}
              className="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="#2563EB"
            />
          </div>
          <p className="text-dark-400 text-xs mt-1">
            Color del botón "Acceder con Cédula" y otros elementos
          </p>
        </div>

        {/* Vista previa de cambios */}
        <div className="bg-dark-800 rounded-lg p-4">
          <h5 className="text-white font-medium mb-2">
            Configuración Actual:
          </h5>
          <ul className="space-y-1 text-sm text-dark-300">
            <li>
              • Nombre: {brandingConfig.businessName || 'LEALTA (predeterminado)'}
            </li>
            <li>
              • Carrusel: {brandingConfig.carouselImages?.length || 0} imágenes configuradas
            </li>
            <li>• Color: {brandingConfig.primaryColor}</li>
          </ul>
        </div>

        {/* Botones de Actualizar */}
        <div className="pt-4 border-t border-dark-700">
          <button
            onClick={handleUpdatePortal}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Actualizar Portal Cliente</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandingManager;
