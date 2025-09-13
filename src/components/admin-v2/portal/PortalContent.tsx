'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Smartphone, Gift, TrendingUp } from 'lucide-react';
import PortalContentManager from './PortalContentManager';
import { GeneralConfig } from './types';
import {
  SharedBrandingConfig,
  DEFAULT_BRANDING_CONFIG,
} from './shared-branding-types';

/**
 * Componente PortalContent extraído del admin page original
 * Extraído de: src/app/admin/page.tsx (líneas 2550-2900)
 * RESPONSABILIDAD: Gestión completa del portal del cliente con vista previa
 */

interface PortalContentProps {
  showNotification: (message: string, type: NivelTarjeta) => void;
}

// Usar los tipos compartidos para evitar conflictos
type BrandingConfig = SharedBrandingConfig;

type ModoVistaPrevia = 'portal' | 'login' | 'tarjetas' | 'portal-refresh';
type NivelTarjeta = 'success' | 'error' | 'warning' | 'info';

// Portal Content Component - Gestión completa del portal del cliente
const PortalContent: React.FC<PortalContentProps> = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState<
    'preview' | 'banners' | 'promociones' | 'recompensas' | 'favorito'
  >('preview');
  const [previewMode, setPreviewMode] = useState<ModoVistaPrevia>('portal'); // Estado para cambiar entre Portal, Login y Tarjetas
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(
    DEFAULT_BRANDING_CONFIG
  );
  const [config, setConfig] = useState<GeneralConfig>({
    banners: [],
    promociones: [],
    eventos: [],
    recompensas: [],
    tarjetas: [],
    favoritoDelDia: [],
    nombreEmpresa: 'Rosita',
    nivelesConfig: {
      Bronce: {
        colores: { gradiente: ['#CD7F32', '#8B4513'] },
        textoDefault: 'Cliente Inicial',
        condiciones: { puntosMinimos: 0, gastosMinimos: 0, visitasMinimas: 0 },
      },
      Plata: {
        colores: { gradiente: ['#C0C0C0', '#808080'] },
        textoDefault: 'Cliente Frecuente',
        condiciones: {
          puntosMinimos: 100,
          gastosMinimos: 500,
          visitasMinimas: 5,
        },
      },
      Oro: {
        colores: { gradiente: ['#FFD700', '#FFA500'] },
        textoDefault: 'Cliente VIP',
        condiciones: {
          puntosMinimos: 500,
          gastosMinimos: 1500,
          visitasMinimas: 10,
        },
      },
      Diamante: {
        colores: { gradiente: ['#B9F2FF', '#00CED1'] },
        textoDefault: 'Cliente Elite',
        condiciones: {
          puntosMinimos: 1500,
          gastosMinimos: 3000,
          visitasMinimas: 20,
        },
      },
      Platino: {
        colores: { gradiente: ['#E5E4E2', '#C0C0C0'] },
        textoDefault: 'Cliente Exclusivo',
        condiciones: {
          puntosMinimos: 3000,
          gastosMinimos: 5000,
          visitasMinimas: 30,
        },
      },
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const response = await fetch(
        '/api/admin/portal-config?businessId=default'
      );
      if (response.ok) {
        const data = await response.json();
        const loadedConfig = data.config || data;

        // Asegurar que siempre tenemos nivelesConfig y nombreEmpresa
        setConfig({
          ...loadedConfig,
          nombreEmpresa: loadedConfig.nombreEmpresa || 'Rosita',
          nivelesConfig: loadedConfig.nivelesConfig || {
            Bronce: {
              colores: { gradiente: ['#CD7F32', '#8B4513'] },
              textoDefault: 'Cliente Inicial',
              condiciones: {
                puntosMinimos: 0,
                gastosMinimos: 0,
                visitasMinimas: 0,
              },
            },
            Plata: {
              colores: { gradiente: ['#C0C0C0', '#808080'] },
              textoDefault: 'Cliente Frecuente',
              condiciones: {
                puntosMinimos: 100,
                gastosMinimos: 500,
                visitasMinimas: 5,
              },
            },
            Oro: {
              colores: { gradiente: ['#FFD700', '#FFA500'] },
              textoDefault: 'Cliente VIP',
              condiciones: {
                puntosMinimos: 500,
                gastosMinimos: 1500,
                visitasMinimas: 10,
              },
            },
            Diamante: {
              colores: { gradiente: ['#B9F2FF', '#00CED1'] },
              textoDefault: 'Cliente Elite',
              condiciones: {
                puntosMinimos: 1500,
                gastosMinimos: 3000,
                visitasMinimas: 20,
              },
            },
            Platino: {
              colores: { gradiente: ['#E5E4E2', '#C0C0C0'] },
              textoDefault: 'Cliente Exclusivo',
              condiciones: {
                puntosMinimos: 3000,
                gastosMinimos: 5000,
                visitasMinimas: 30,
              },
            },
          },
        });
      } else {
        setConfig({
          banners: [
            {
              id: '1',
              titulo: 'Bienvenido a nuestro restaurante',
              descripcion: 'Disfruta de la mejor experiencia gastronómica',
              activo: true,
            },
          ],
          promociones: [
            {
              id: '1',
              titulo: '2x1 en Cócteles',
              descripcion: 'Válido hasta el domingo',
              descuento: 50,
              activo: true,
            },
          ],
          recompensas: [
            {
              id: '1',
              nombre: 'Postre gratis',
              descripcion: 'Elige cualquier postre de nuestra carta',
              puntosRequeridos: 150,
              activo: true,
              stock: 50,
            },
          ],
          favoritoDelDia: [],
        });
      }
    } catch (error) {
      console.error('Error loading portal config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    try {
      console.log('💾 Admin - Guardando config:', config);
      const response = await fetch('/api/admin/portal-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          businessId: 'default',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }

      const result = await response.json();
      console.log('✅ Admin - Config guardada exitosamente:', result);
    } catch (error) {
      console.error('❌ Admin - Error saving portal config:', error);
    }
  }, [config]);

  useEffect(() => {
    fetchConfig();
  }, []);

  // Auto-save when config changes
  useEffect(() => {
    if (config && Object.keys(config).length > 0) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 1000); // Auto-save después de 1 segundo de inactividad

      return () => clearTimeout(timeoutId);
    }
  }, [config, handleSave]);

  const handleBrandingChange = async (
    field: string,
    value: string | string[]
  ) => {
    const newConfig = {
      ...brandingConfig,
      [field]: value,
    };

    setBrandingConfig(newConfig);

    try {
      // Guardar en la API (funcionará entre diferentes dominios/puertos)
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      if (response.ok) {
        // Crear una versión reducida para localStorage (sin imágenes base64)
        const lightConfig = {
          ...newConfig,
          carouselImages: newConfig.carouselImages?.length || 0, // Solo guardar la cantidad
        };

        try {
          localStorage.setItem('portalBranding', JSON.stringify(lightConfig));
        } catch (storageError) {
          console.warn(
            'localStorage lleno, limpiando datos antiguos:',
            storageError
          );
          // Limpiar localStorage y guardar solo lo esencial
          localStorage.removeItem('portalBranding');
          localStorage.setItem(
            'portalBranding',
            JSON.stringify({
              businessName: newConfig.businessName,
              primaryColor: newConfig.primaryColor,
              carouselImages: [], // No guardar imágenes en localStorage
            })
          );
        }
      } else {
        console.error('Admin: Error guardando branding en API');
      }
    } catch (error) {
      console.error('Admin: Error conectando con API:', error);
      // En caso de error de API, guardar solo datos básicos en localStorage
      try {
        const basicConfig = {
          businessName: newConfig.businessName,
          primaryColor: newConfig.primaryColor,
          carouselImages: [], // No guardar imágenes pesadas en localStorage
        };
        localStorage.setItem('portalBranding', JSON.stringify(basicConfig));
      } catch (storageError) {
        console.warn(
          'No se pudo guardar en localStorage, espacio insuficiente:',
          storageError
        );
      }
    }
  };

  /**
   * Manejo de subida de imágenes del carrusel
   * Extraído de: src/app/admin/page.tsx (líneas 2750-2800)
   */

  // Cargar branding desde la API al montar el componente
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await fetch('/api/branding');
        if (response.ok) {
          const branding = await response.json();
          setBrandingConfig(branding);
          // Guardar versión ligera en localStorage
          try {
            const lightConfig = {
              ...branding,
              carouselImages: branding.carouselImages?.length || 0, // Solo guardar la cantidad
            };
            localStorage.setItem('portalBranding', JSON.stringify(lightConfig));
          } catch (storageError) {
            console.warn('No se pudo guardar en localStorage:', storageError);
          }
        } else {
          console.error('Admin: Error cargando branding desde API');
          // Fallback a localStorage (datos básicos solamente)
          const savedBranding = localStorage.getItem('portalBranding');
          if (savedBranding) {
            const parsed = JSON.parse(savedBranding);
            // Si localStorage solo tiene datos básicos, usar valores por defecto para imágenes
            setBrandingConfig({
              ...parsed,
              carouselImages:
                parsed.carouselImages || DEFAULT_BRANDING_CONFIG.carouselImages,
            });
          }
        }
      } catch (error) {
        console.error('Admin: Error conectando con API:', error);
        // Fallback a localStorage
        const savedBranding = localStorage.getItem('portalBranding');
        if (savedBranding) {
          try {
            const parsed = JSON.parse(savedBranding);
            setBrandingConfig({
              ...parsed,
              carouselImages:
                parsed.carouselImages || DEFAULT_BRANDING_CONFIG.carouselImages,
            });
          } catch (parseError) {
            console.error('Admin: Error parsing localStorage:', parseError);
          }
        }
      }
    };

    loadBranding();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-dark-400">Cargando configuración del portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Portal del Cliente</h3>
        <div className="flex items-center">
          <button
            onClick={() =>
              window.open('http://localhost:3001/cliente', '_blank')
            }
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4 text-white" />
            <span className="text-white">Ver Portal</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-dark-800 rounded-lg p-1">
        {[
          { id: 'preview', label: 'Vista Previa', icon: Eye },
          { id: 'banners', label: 'Banner Diario', icon: Smartphone },
          { id: 'promociones', label: 'Promociones', icon: Gift },
          { id: 'favorito', label: 'Favorito del Día', icon: TrendingUp },
          { id: 'recompensas', label: 'Recompensas', icon: Gift },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors text-sm ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <PortalContentManager
        activeTab={activeTab}
        config={config}
        setConfig={setConfig as any}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        brandingConfig={brandingConfig}
        handleBrandingChange={handleBrandingChange}
        showNotification={showNotification}
      />
    </div>
  );
};

export default PortalContent;
