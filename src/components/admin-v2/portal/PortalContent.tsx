'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Smartphone, Gift, TrendingUp, Building, CreditCard } from 'lucide-react';
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
    'preview' | 'branding' | 'banners' | 'promociones' | 'recompensas' | 'favorito' | 'tarjetas'
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
    nombreEmpresa: 'Mi Negocio',
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
          visitasMinimas: 15,
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
  const [currentBusinessSlug, setCurrentBusinessSlug] = useState<string | null>(null);

  // 🔧 Funciones auxiliares reutilizables
  const getCurrentBusinessFromUrl = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (pathSegments.length >= 2 && pathSegments[1] === 'admin') {
      return pathSegments[0];
    }
    return null;
  }, []);

  const resolveBusinessId = useCallback(async (identifier: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/businesses/${identifier}/validate`);
      if (response.ok) {
        const business = await response.json();
        return business.id || null;
      }
    } catch (error) {
      console.error('Error resolving business ID:', error);
    }
    return null;
  }, []);

  // Función para construir la URL dinámica del portal cliente
  const getPortalUrl = (): string => {
    const businessSlug = currentBusinessSlug || getCurrentBusinessFromUrl();
    if (businessSlug) {
      // Construir URL con el dominio actual y el slug
      const currentOrigin = window.location.origin;
      return `${currentOrigin}/${businessSlug}/cliente`;
    }
    // Fallback si no se puede determinar el slug
    return `${window.location.origin}/cliente`;
  };

  const fetchConfig = useCallback(async () => {
    try {
      // 🔥 CRÍTICO: Resolver el businessId real desde el slug/subdomain
      const urlBusinessIdentifier = getCurrentBusinessFromUrl();
      const storedBusinessId = localStorage.getItem('currentBusinessId');
      
      // Actualizar el slug del business actual
      if (urlBusinessIdentifier) {
        setCurrentBusinessSlug(urlBusinessIdentifier);
      }
      
      // Resolver el ID real del business
      let finalBusinessId: string;
      if (urlBusinessIdentifier) {
        const resolvedId = await resolveBusinessId(urlBusinessIdentifier);
        finalBusinessId = resolvedId || storedBusinessId || 'cmfr2y0ia0000eyvw7ef3k20u';
      } else {
        finalBusinessId = storedBusinessId || 'cmfr2y0ia0000eyvw7ef3k20u';
      }
      
      console.log('🔍 Portal fetchConfig - BusinessId resolution:', {
        urlBusinessIdentifier,
        storedBusinessId,
        finalBusinessId,
        currentUrl: window.location.pathname
      });
      
      const response = await fetch(
        `/api/admin/portal-config?businessId=${finalBusinessId}`
      );
      if (response.ok) {
        const data = await response.json();
        const loadedConfig = data.config || data;

        // Asegurar que siempre tenemos nivelesConfig y nombreEmpresa
        const defaultNivelesConfig = {
          Bronce: {
            colores: { gradiente: ['#CD7F32', '#8B4513'] },
            textoDefault: 'Cliente Inicial',
            condiciones: { puntosMinimos: 0, gastosMinimos: 0, visitasMinimas: 0 },
          },
          Plata: {
            colores: { gradiente: ['#C0C0C0', '#808080'] },
            textoDefault: 'Cliente Frecuente',
            condiciones: { puntosMinimos: 100, gastosMinimos: 500, visitasMinimas: 5 },
          },
          Oro: {
            colores: { gradiente: ['#FFD700', '#FFA500'] },
            textoDefault: 'Cliente VIP',
            condiciones: { puntosMinimos: 500, gastosMinimos: 1500, visitasMinimas: 10 },
          },
          Diamante: {
            colores: { gradiente: ['#B9F2FF', '#00CED1'] },
            textoDefault: 'Cliente Elite',
            condiciones: { puntosMinimos: 1500, gastosMinimos: 3000, visitasMinimas: 15 },
          },
          Platino: {
            colores: { gradiente: ['#E5E4E2', '#C0C0C0'] },
            textoDefault: 'Cliente Exclusivo',
            condiciones: { puntosMinimos: 3000, gastosMinimos: 5000, visitasMinimas: 30 },
          },
        };

        // 🎯 GENERAR TARJETAS SI NO EXISTEN DESDE NIVELESCONFIG
        let finalTarjetas = loadedConfig.tarjetas || [];
        if (!finalTarjetas || finalTarjetas.length === 0) {
          finalTarjetas = Object.entries(defaultNivelesConfig).map(([nivel, config]) => ({
            id: `tarjeta-${nivel.toLowerCase()}`,
            nivel: nivel,
            nombrePersonalizado: `Tarjeta ${nivel}`,
            textoCalidad: config.textoDefault,
            colores: {
              gradiente: config.colores.gradiente,
              texto: '#FFFFFF',
              nivel: config.colores.gradiente[0]
            },
            condiciones: config.condiciones,
            beneficio: `Acceso a beneficios ${nivel}`,
            activo: true
          }));
          
          console.log('🎯 Generated tarjetas from loaded config:', {
            count: finalTarjetas.length,
            niveles: finalTarjetas.map((t: any) => `${t.nivel}:${t.condiciones.puntosMinimos}`)
          });
        }

        setConfig({
          ...loadedConfig,
          nombreEmpresa: loadedConfig.nombreEmpresa || 'Mi Negocio',
          tarjetas: finalTarjetas,
          nivelesConfig: loadedConfig.nivelesConfig || defaultNivelesConfig,
        });
      } else {
        // 🎯 GENERAR CONFIGURACIÓN POR DEFECTO CON TARJETAS DESDE NIVELESCONFIG
        const defaultNivelesConfig = {
          Bronce: {
            colores: { gradiente: ['#CD7F32', '#8B4513'] },
            textoDefault: 'Cliente Inicial',
            condiciones: { puntosMinimos: 0, gastosMinimos: 0, visitasMinimas: 0 },
          },
          Plata: {
            colores: { gradiente: ['#C0C0C0', '#808080'] },
            textoDefault: 'Cliente Frecuente',
            condiciones: { puntosMinimos: 100, gastosMinimos: 500, visitasMinimas: 5 },
          },
          Oro: {
            colores: { gradiente: ['#FFD700', '#FFA500'] },
            textoDefault: 'Cliente VIP',
            condiciones: { puntosMinimos: 500, gastosMinimos: 1500, visitasMinimas: 10 },
          },
          Diamante: {
            colores: { gradiente: ['#B9F2FF', '#00CED1'] },
            textoDefault: 'Cliente Elite',
            condiciones: { puntosMinimos: 1500, gastosMinimos: 3000, visitasMinimas: 15 },
          },
          Platino: {
            colores: { gradiente: ['#E5E4E2', '#C0C0C0'] },
            textoDefault: 'Cliente Exclusivo',
            condiciones: { puntosMinimos: 3000, gastosMinimos: 5000, visitasMinimas: 30 },
          },
        };

        // 🎯 GENERAR TARJETAS DESDE NIVELESCONFIG
        const generatedTarjetas = Object.entries(defaultNivelesConfig).map(([nivel, config]) => ({
          id: `tarjeta-${nivel.toLowerCase()}`,
          nivel: nivel,
          nombrePersonalizado: `Tarjeta ${nivel}`,
          textoCalidad: config.textoDefault,
          colores: {
            gradiente: [config.colores.gradiente[0], config.colores.gradiente[1]] as [string, string],
            texto: '#FFFFFF',
            nivel: config.colores.gradiente[0]
          },
          condiciones: config.condiciones,
          beneficio: `Acceso a beneficios ${nivel}`,
          activo: true
        }));

        console.log('🎯 Generated default tarjetas:', {
          count: generatedTarjetas.length,
          niveles: generatedTarjetas.map(t => `${t.nivel}:${t.condiciones.puntosMinimos}`)
        });

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
          // 🎯 INCLUIR TARJETAS GENERADAS DESDE NIVELESCONFIG
          tarjetas: generatedTarjetas,
          nombreEmpresa: 'Mi Negocio',
          nivelesConfig: defaultNivelesConfig
        });
      }
    } catch (error) {
      console.error('Error loading portal config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentBusinessFromUrl, resolveBusinessId]);

  const handleSave = useCallback(async () => {
    try {
      // 🔥 CRÍTICO: Resolver el businessId real desde el slug/subdomain
      const urlBusinessIdentifier = getCurrentBusinessFromUrl();
      const storedBusinessId = localStorage.getItem('currentBusinessId');
      
      // Resolver el ID real del business
      let finalBusinessId: string;
      if (urlBusinessIdentifier) {
        const resolvedId = await resolveBusinessId(urlBusinessIdentifier);
        finalBusinessId = resolvedId || storedBusinessId || 'cmfr2y0ia0000eyvw7ef3k20u';
      } else {
        finalBusinessId = storedBusinessId || 'cmfr2y0ia0000eyvw7ef3k20u';
      }
      
      console.log('💾 Portal handleSave - BusinessId resolved:', finalBusinessId);
      
      const response = await fetch('/api/admin/portal-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          businessId: finalBusinessId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }

    } catch (error) {
      console.error('❌ Admin - Error saving portal config:', error);
    }
  }, [config, getCurrentBusinessFromUrl, resolveBusinessId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

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
      // 🔥 CRÍTICO: Resolver el businessId real desde el slug/subdomain
      const urlBusinessIdentifier = getCurrentBusinessFromUrl();
      const storedBusinessId = localStorage.getItem('currentBusinessId');
      
      // Resolver el ID real del business
      let finalBusinessId: string;
      if (urlBusinessIdentifier) {
        const resolvedId = await resolveBusinessId(urlBusinessIdentifier);
        finalBusinessId = resolvedId || storedBusinessId || 'cmfr2y0ia0000eyvw7ef3k20u';
      } else {
        finalBusinessId = storedBusinessId || 'cmfr2y0ia0000eyvw7ef3k20u';
      }
      
      console.log('🎨 Branding change - BusinessId resolved:', finalBusinessId);
      
      // Agregar businessId a la configuración que enviamos
      const configWithBusinessId = {
        ...newConfig,
        businessId: finalBusinessId
      };

      // console.log('🔄 Admin: Enviando branding a API:', {
      //   field,
      //   value,
      //   businessId: finalBusinessId,
      
      // Guardar en la API (funcionará entre diferentes dominios/puertos)
      const requestBody = JSON.stringify(configWithBusinessId);
      
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': finalBusinessId
        },
        body: requestBody,
      });

      if (response.ok) {
        // ✅ SOLUCIÓN: NO guardar imágenes en localStorage (son muy pesadas)
        // Solo guardar datos básicos para mejorar rendimiento
        const lightConfig = {
          businessName: newConfig.businessName,
          primaryColor: newConfig.primaryColor,
          // ❌ NO guardar carouselImages en localStorage para evitar corrupción
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
              // ❌ NO guardar carouselImages para evitar corrupción
            })
          );
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Admin: Error guardando branding en API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      }
    } catch (error) {
      console.error('❌ Admin: Error conectando con API:', error);
      // En caso de error de API, guardar solo datos básicos en localStorage
      try {
        const basicConfig = {
          businessName: newConfig.businessName,
          primaryColor: newConfig.primaryColor,
          // ❌ NO guardar carouselImages para evitar datos corruptos
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
        // 🔥 CRÍTICO: Usar el mismo sistema de resolución de businessId
        const urlBusinessIdentifier = getCurrentBusinessFromUrl();
        const storedBusinessId = localStorage.getItem('currentBusinessId');
        
        // Resolver el ID real del business
        let finalBusinessId: string;
        if (urlBusinessIdentifier) {
          const resolvedId = await resolveBusinessId(urlBusinessIdentifier);
          finalBusinessId = resolvedId || storedBusinessId || 'cmfr2y0ia0000eyvw7ef3k20u';
        } else {
          finalBusinessId = storedBusinessId || 'cmfr2y0ia0000eyvw7ef3k20u';
        }
        
        console.log('🎨 Loading branding for business:', finalBusinessId);
        
        const response = await fetch(`/api/branding?businessId=${finalBusinessId}`);
        if (response.ok) {
          const branding = await response.json();
          setBrandingConfig(branding);
          // ✅ Guardar solo datos básicos en localStorage (NO imágenes)
          try {
            const lightConfig = {
              businessName: branding.businessName,
              primaryColor: branding.primaryColor,
              // ❌ NO guardar carouselImages para evitar corrupción
            };
            localStorage.setItem('portalBranding', JSON.stringify(lightConfig));
          } catch (storageError) {
            console.warn('No se pudo guardar en localStorage:', storageError);
          }
        } else {
          console.error('Admin: Error cargando branding desde API');
          // ✅ SOLUCIÓN: Si falla API, usar configuración por defecto limpia
          setBrandingConfig({
            businessName: 'Mi Negocio',
            primaryColor: '#3B82F6',
            carouselImages: DEFAULT_BRANDING_CONFIG.carouselImages, // Array vacío
          });
        }
      } catch (error) {
        console.error('Admin: Error conectando con API:', error);
        // ✅ SOLUCIÓN: Si falla conexión, usar configuración por defecto limpia
        setBrandingConfig({
          businessName: 'Mi Negocio',
          primaryColor: '#3B82F6',
          carouselImages: DEFAULT_BRANDING_CONFIG.carouselImages, // Array vacío
        });
      }
    };

    loadBranding();
  }, [getCurrentBusinessFromUrl, resolveBusinessId]);

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
            onClick={() => window.open(getPortalUrl(), '_blank')}
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
          { id: 'branding', label: 'Branding', icon: Building },
          { id: 'banners', label: 'Banner Diario', icon: Smartphone },
          { id: 'promociones', label: 'Promociones', icon: Gift },
          { id: 'favorito', label: 'Favorito del Día', icon: TrendingUp },
          { id: 'recompensas', label: 'Recompensas', icon: Gift },
          { id: 'tarjetas', label: 'Tarjetas', icon: CreditCard },
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
