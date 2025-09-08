'use client';

import React from 'react';
import { Building, Save, Eye } from 'lucide-react';
import { SharedBrandingConfig, isValidImageFile, convertToBase64 } from './shared-branding-types';

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
   * Extraído de: src/app/admin/page.tsx (líneas 2750-2800)
   */
  const handleCarouselImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar archivo
    if (!isValidImageFile(file)) {
      showNotification('Por favor selecciona una imagen válida (JPG, PNG, WebP, máx. 5MB)', 'error');
      return;
    }

    // Validar límite de imágenes
    const currentImages = brandingConfig.carouselImages || [];
    if (currentImages.length >= 6) {
      showNotification('Máximo 6 imágenes permitidas en el carrusel', 'warning');
      return;
    }

    try {
      // Convertir a base64
      const base64 = await convertToBase64(file);
      const updatedImages = [...currentImages, base64];
      
      // Actualizar estado
      await handleBrandingChange('carouselImages', updatedImages);
      showNotification(`Imagen agregada al carrusel (${updatedImages.length}/6)`, 'success');
      
      // Limpiar input para permitir cargar la misma imagen nuevamente
      event.target.value = '';
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      showNotification('Error al procesar la imagen', 'error');
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
   * Extraído de: src/app/admin/page.tsx (líneas 3630-3680)
   */
  const handleUpdatePortal = () => {
    try {
      // Crear versión ligera para localStorage (sin imágenes base64)
      const lightConfig = {
        ...brandingConfig,
        carouselImages: brandingConfig.carouselImages?.length || 0, // Solo guardar la cantidad
      };

      try {
        localStorage.setItem('portalBranding', JSON.stringify(lightConfig));
      } catch (storageError) {
        console.warn('localStorage lleno, usando solo datos básicos:', storageError);
        // Guardar solo datos esenciales
        const basicConfig = {
          businessName: brandingConfig.businessName,
          primaryColor: brandingConfig.primaryColor,
          carouselImages: [],
        };
        try {
          localStorage.removeItem('portalBranding');
          localStorage.setItem('portalBranding', JSON.stringify(basicConfig));
        } catch (finalError) {
          console.error('No se pudo actualizar localStorage:', finalError);
        }
      }

      // Enviar evento personalizado para notificar a otras pestañas
      window.dispatchEvent(new CustomEvent('brandingUpdated', {
        detail: brandingConfig,
      }));

      console.log('Evento brandingUpdated disparado con carrusel:', brandingConfig.carouselImages?.length || 0, 'imágenes');

      // También usar storage event para otras pestañas
      localStorage.setItem('brandingTrigger', Date.now().toString());

      // Mostrar feedback visual
      showNotification('✅ Portal actualizado - Recarga el portal cliente', 'success');
      
    } catch (error) {
      console.error('Error actualizando portal:', error);
      showNotification('❌ Error al actualizar el portal', 'error');
    }
  };

  /**
   * Función para abrir portal con configuración guardada
   * Extraído de: src/app/admin/page.tsx (líneas 3680-3700)
   */
  const handleOpenPortal = () => {
    try {
      // Guardar versión ligera antes de abrir
      const lightConfig = {
        ...brandingConfig,
        carouselImages: brandingConfig.carouselImages?.length || 0,
      };

      try {
        localStorage.setItem('portalBranding', JSON.stringify(lightConfig));
      } catch (storageError) {
        console.warn('localStorage lleno, usando datos básicos para portal:', storageError);
        const basicConfig = {
          businessName: brandingConfig.businessName,
          primaryColor: brandingConfig.primaryColor,
          carouselImages: [],
        };
        try {
          localStorage.removeItem('portalBranding');
          localStorage.setItem('portalBranding', JSON.stringify(basicConfig));
        } catch (finalError) {
          console.error('No se pudo preparar datos para el portal:', finalError);
        }
      }

      // Abrir portal del cliente en nueva pestaña
      window.open('/cliente', '_blank');
    } catch (error) {
      console.error('Error abriendo portal:', error);
      showNotification('Error al abrir el portal', 'error');
    }
  };

  return (
    <div>
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
              {brandingConfig.carouselImages?.map(
                (imageUrl: string, index: number) => (
                  <div
                    key={`carousel-${index}-${imageUrl.substring(0, 20)}`}
                    className="relative group"
                  >
                    <img
                      src={imageUrl}
                      alt={`Carrusel ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-dark-600"
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
                <button
                  onClick={() => handleBrandingChange('carouselImages', [])}
                  className="text-red-400 hover:text-red-300 text-xs"
                  disabled={!brandingConfig.carouselImages?.length}
                >
                  Limpiar todo
                </button>
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
        <div className="pt-4 border-t border-dark-700 space-y-3">
          <button
            onClick={handleUpdatePortal}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Actualizar Portal Cliente</span>
          </button>

          <button
            onClick={handleOpenPortal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Portal Cliente Real</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandingManager;
