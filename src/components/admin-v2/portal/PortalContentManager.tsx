'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, Eye, Gift } from 'lucide-react';

// Importar componentes ya creados
import BannersManager from './BannersManager';
import FavoritoDelDiaManager from './FavoritoDelDiaManager';
import PromocionesManager from './PromocionesManager';
import RecompensasManager from './RecompensasManager';
import TarjetaCompacta from './TarjetaCompacta';
import AsignacionTarjetas from './AsignacionTarjetas';
import TarjetaEditor from './TarjetaEditor';
import BrandingManager from './BrandingManager';
import { SharedBrandingConfig } from './shared-branding-types';
import { Tarjeta } from './types';

// Configuración temporal para evitar conflictos de tipos

interface PortalContentManagerProps {
  activeTab: string;
  config: GeneralConfig;
  setConfig: React.Dispatch<React.SetStateAction<GeneralConfig>>;
  previewMode: ModoVistaPrevia;
  setPreviewMode: React.Dispatch<React.SetStateAction<ModoVistaPrevia>>;
  brandingConfig: BrandingConfig;
  handleBrandingChange: (
    field: string,
    value: string | string[]
  ) => Promise<void>;
  showNotification: (message: string, type: NivelTarjeta) => void;
}

interface GeneralConfig {
  banners?: Banner[];
  promociones?: Promocion[];
  eventos?: Evento[];
  favoritoDelDia?: FavoritoDelDia[];
  recompensas?: Recompensa[];
  tarjetas?: Tarjeta[];
  nombreEmpresa?: string;
  nivelesConfig?: Record<
    string,
    {
      nombrePersonalizado: string;
      textoCalidad: string;
      colores: { gradiente: string[] };
      condiciones: {
        puntosMinimos: number;
        gastosMinimos: number;
        visitasMinimas: number;
      };
      beneficio: string;
      empresa: {
        nombre: string;
      };
    }
  >;
  empresa?: {
    nombre: string;
  };
}

// Usar tipos compartidos
type BrandingConfig = SharedBrandingConfig;

interface Banner {
  id?: string;
  dia?: string;
  titulo?: string;
  descripcion?: string;
  imagenUrl?: string;
  activo?: boolean;
}

interface Promocion {
  id?: string;
  dia?: string;
  titulo?: string;
  descripcion?: string;
  descuento?: number;
  horaTermino?: string;
  activo?: boolean;
}

interface FavoritoDelDia {
  id?: string;
  dia?: string;
  imagenUrl?: string;
  horaPublicacion?: string;
  activo?: boolean;
}

interface Recompensa {
  id?: string;
  nombre?: string;
  descripcion?: string;
  puntosRequeridos?: number;
  stock?: number;
  activo?: boolean;
}

interface Evento {
  id?: string;
  titulo?: string;
  descripcion?: string;
  fecha?: string;
  hora?: string;
  activo?: boolean;
}

type ModoVistaPrevia = 'portal' | 'login' | 'tarjetas' | 'portal-refresh';
type NivelTarjeta = 'success' | 'error' | 'info' | 'warning';

// Ampliar el objeto Window para incluir portalPreviewDay
declare global {
  interface Window {
    portalPreviewDay?: string;
  }
}

// Tipos para items de configuración
type ConfigurableItem = Banner | Promocion | Recompensa | FavoritoDelDia;
type ConfigurableItemType =
  | 'banners'
  | 'promociones'
  | 'recompensas'
  | 'favoritoDelDia'
  | 'eventos'
  | 'tarjetas'
  | 'nombreEmpresa';

// Funciones helper para manejar tipos de datos
const getPromocionesList = (promociones: any): Promocion[] => {
  if (Array.isArray(promociones)) return promociones;
  return [];
};

const getRecompensasList = (recompensas: any): Recompensa[] => {
  if (Array.isArray(recompensas)) return recompensas;
  return [];
};

const getFavoritosList = (favoritos: any): FavoritoDelDia[] => {
  if (Array.isArray(favoritos)) return favoritos;
  return [];
};

const isFavoritoActivo = (favoritos: any): boolean => {
  if (!Array.isArray(favoritos)) return false;
  return favoritos.some((f: FavoritoDelDia) => f.activo && f.imagenUrl);
};

const getFavoritoProperty = (favorito: any, property: string): any => {
  return favorito?.[property];
};

const isFavoritoWithId = (item: any): item is { id: string } => {
  return item && typeof item.id === 'string';
};

const isFavoritoWithDia = (item: any): item is { dia: string } => {
  return item && typeof item.dia === 'string';
};

/**
 * Componente principal que maneja el contenido del portal según la pestaña activa
 * Extraído del código original (líneas 2909-3859)
 * RESPONSABILIDAD: Manager principal del contenido del portal con todos los gestores
 */
const PortalContentManager: React.FC<PortalContentManagerProps> = ({
  activeTab,
  config,
  setConfig,
  previewMode,
  setPreviewMode,
  brandingConfig,
  handleBrandingChange,
  showNotification,
}) => {
  
  // 🆕 Estado para datos reales de vista previa desde BD
  const [previewData, setPreviewData] = useState<any>(null);
  
  // 🆕 Función para cargar datos reales para vista previa
  const loadPreviewData = useCallback(async () => {
    try {
      const response = await fetch('/api/portal/config-v2', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        console.log('🔄 Preview data loaded from DB:', {
          banners: data.banners?.length || 0,
          promociones: data.promociones?.length || 0
        });
      }
    } catch (error) {
      console.error('❌ Error loading preview data:', error);
    }
  }, []);
  
  // 🆕 Efecto para cargar datos cuando cambia el modo de vista previa
  useEffect(() => {
    if (previewMode === 'portal') {
      loadPreviewData();
      // Recargar cada 10 segundos para mantener sincronización
      const interval = setInterval(loadPreviewData, 10000);
      return () => clearInterval(interval);
    }
  }, [previewMode, loadPreviewData]);
  
  // Función para renderizar contenido de vista previa
  const renderPreviewContent = () => {
    if (previewMode === 'login') {
      return (
        <div className="bg-black text-white min-h-96 max-w-xs mx-auto rounded-xl overflow-hidden border border-dark-600">
          <div className="flex items-center justify-center p-4">
            <span className="text-white font-bold text-lg">
              {brandingConfig.businessName || 'LEALTA'}
            </span>
          </div>

          <div className="relative h-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
              <h1 className="text-lg font-bold text-white mb-2">
                Descubre Nuestro Menú
              </h1>

              {(brandingConfig.carouselImages?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <div className="flex space-x-1 justify-center">
                    {brandingConfig.carouselImages
                      ?.slice(0, 3)
                      .map((image: string, index: number) => (
                        <div
                          key={`carousel-preview-${index}-${image.substring(0, 10)}`}
                          className="w-16 h-10 relative overflow-hidden rounded"
                        >
                          <img
                            src={image}
                            alt={`Carrusel ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    {(brandingConfig.carouselImages?.length ?? 0) > 3 && (
                      <div className="w-16 h-10 bg-black/70 rounded flex items-center justify-center">
                        <span className="text-white text-xs">
                          +{(brandingConfig.carouselImages?.length ?? 0) - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-white/60 text-xs mt-1 text-center">
                    Carrusel de Imágenes
                  </p>
                </div>
              )}

              <button
                className="text-white px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1 text-xs"
                style={{
                  backgroundColor: brandingConfig.primaryColor || '#2563EB',
                }}
              >
                <Eye className="w-3 h-3" />
                <span>Acceder con Cédula</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Vista Previa de Tarjetas
    if (previewMode === 'tarjetas') {
      return (
        <TarjetaCompacta
          config={{
            nivelesConfig: config.nivelesConfig || {},
            empresa: config.empresa || {
              nombre: config.nombreEmpresa || 'Mi Negocio',
            },
            nombreEmpresa:
              config.nombreEmpresa || config.empresa?.nombre || 'Mi Negocio',
          }}
        />
      );
    }

    return (
      <div className="bg-black text-white min-h-96 max-w-xs mx-auto rounded-xl overflow-hidden border border-dark-600 flex items-center justify-center">
        <p className="text-dark-400">Vista previa de tarjetas</p>
      </div>
    );
  };

  // Función para sincronización manual
  const handleSyncToClient = async () => {
    try {
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
        const errorText = await response.text();
        throw new Error(
          `Error al sincronizar con el cliente: ${response.status} - ${errorText}`
        );
      }

      await response.json();
      showNotification(
        '✅ Configuración sincronizada con el portal del cliente',
        'success'
      );

      // Actualización de vista previa
      setTimeout(() => {
        setPreviewMode('portal-refresh');
        setTimeout(() => setPreviewMode('portal'), 100);
      }, 1000);
    } catch (error) {
      console.error('❌ Admin - Error sincronizando configuración:', error);
      showNotification(
        `❌ Error al sincronizar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
    }
  };

  const addItem = async (type: ConfigurableItemType, item: ConfigurableItem) => {
    const newItem = {
      ...item,
      id: item.id || `${type}_${Date.now()}`,
      activo: true,
    };

    // 🆕 Actualizar estado local primero para UI responsiva
    setConfig((prev: GeneralConfig): GeneralConfig => {
      // Caso especial para favoritoDelDia
      if (type === 'favoritoDelDia') {
        const currentFavoritos = Array.isArray(prev.favoritoDelDia)
          ? prev.favoritoDelDia
          : [];

        const existingIndex = currentFavoritos.findIndex(
          (f: FavoritoDelDia) =>
            isFavoritoWithDia(f) && f.dia === getFavoritoProperty(item, 'dia')
        );

        if (existingIndex >= 0) {
          const updatedFavoritos = [...currentFavoritos];
          updatedFavoritos[existingIndex] = newItem;
          return {
            ...prev,
            favoritoDelDia: updatedFavoritos,
          };
        } else {
          return {
            ...prev,
            favoritoDelDia: [...currentFavoritos, newItem],
          };
        }
      }

      const newConfig = {
        ...prev,
        [type]: [...(prev[type] || []), newItem],
      };

      return newConfig;
    });

    // 🆕 Guardar inmediatamente en PostgreSQL
    try {
      await handleSyncToClient();
      // 🆕 Recargar datos de vista previa inmediatamente
      await loadPreviewData();
      showNotification(`✅ ${type} agregado y sincronizado con el cliente`, 'success');
    } catch (error) {
      console.error('Error sincronizando con cliente:', error);
      showNotification(`❌ Error sincronizando ${type}`, 'error');
    }
  };

  const updateItem = async (
    type: ConfigurableItemType,
    itemId: string,
    updates: Partial<ConfigurableItem>
  ) => {
    console.log('🔄 updateItem ejecutado:', { type, itemId, updates });
    
    // 🆕 Actualizar estado local primero para UI responsiva
    setConfig((prev: GeneralConfig): GeneralConfig => {
      if (type === 'favoritoDelDia') {
        const currentFavoritos = Array.isArray(prev.favoritoDelDia)
          ? prev.favoritoDelDia
          : [];

        return {
          ...prev,
          favoritoDelDia: currentFavoritos.map((item: FavoritoDelDia) =>
            isFavoritoWithId(item) && item.id === itemId
              ? { ...item, ...updates }
              : item
          ),
        };
      }

      // 🎯 NUEVO: Manejo especial para tarjetas (usar nivel como ID)
      if (type === 'tarjetas') {
        const currentTarjetas = Array.isArray(prev.tarjetas)
          ? prev.tarjetas
          : [];

        return {
          ...prev,
          tarjetas: currentTarjetas.map((tarjeta: any) =>
            tarjeta.nivel === itemId ? { ...tarjeta, ...updates } : tarjeta
          ),
        };
      }

      // 🎯 NUEVO: Manejo para nombre de empresa
      if (type === 'nombreEmpresa') {
        return {
          ...prev,
          nombreEmpresa: updates.nombreEmpresa || prev.nombreEmpresa,
        };
      }

      const newConfig = {
        ...prev,
        [type]: (prev[type] || []).map((item: { id?: string }) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      };

      console.log('✅ Config actualizado para', type, ':', newConfig[type]);
      return newConfig;
    });

    // 🆕 Guardar inmediatamente en PostgreSQL
    try {
      await handleSyncToClient();
      // 🆕 Recargar datos de vista previa inmediatamente
      await loadPreviewData();
      showNotification(`✅ ${type} actualizado y sincronizado con el cliente`, 'success');
    } catch (error) {
      console.error('Error sincronizando con cliente:', error);
      showNotification(`❌ Error sincronizando ${type}`, 'error');
    }
  };

  const deleteItem = async (type: ConfigurableItemType, itemId: string) => {
    // Usar notificationService para confirmar la eliminación
    const itemTypeNames: Record<ConfigurableItemType, string> = {
      banners: 'banner',
      promociones: 'promoción',
      favoritoDelDia: 'favorito del día',
      recompensas: 'recompensa',
      eventos: 'evento',
      tarjetas: 'tarjeta',
      nombreEmpresa: 'nombre de empresa',
    };

    const itemName = itemTypeNames[type] || 'elemento';

    // 🚫 No permitir eliminar tarjetas o nombre de empresa
    if (type === 'tarjetas' || type === 'nombreEmpresa') {
      showNotification(`❌ No se puede eliminar ${itemName}`, 'error');
      return;
    }

    // 🆕 Actualizar estado local primero para UI responsiva
    setConfig((prev: GeneralConfig): GeneralConfig => {
      if (type === 'favoritoDelDia') {
        const currentFavoritos = Array.isArray(prev.favoritoDelDia)
          ? prev.favoritoDelDia
          : [];

        return {
          ...prev,
          favoritoDelDia: currentFavoritos.filter(
            (item: FavoritoDelDia) =>
              !isFavoritoWithId(item) || item.id !== itemId
          ),
        };
      }

      // Para arrays normales
      const currentArray = Array.isArray(prev[type]) ? prev[type] as any[] : [];
      const newConfig = {
        ...prev,
        [type]: currentArray.filter(
          (item: { id?: string }) => item.id !== itemId
        ),
      };

      return newConfig;
    });

    // 🆕 Guardar inmediatamente en PostgreSQL
    try {
      await handleSyncToClient();
      // 🆕 Recargar datos de vista previa inmediatamente
      await loadPreviewData();
      showNotification(`✅ ${itemName} eliminado y sincronizado con el cliente`, 'success');
    } catch (error) {
      console.error('Error sincronizando con cliente:', error);
      showNotification(`❌ Error sincronizando ${itemName}`, 'error');
    }
  };

  const toggleActive = async (type: ConfigurableItemType, itemId: string) => {
    // 🚫 No permitir toggle para tarjetas o nombre de empresa
    if (type === 'tarjetas' || type === 'nombreEmpresa') {
      return;
    }
    
    // 🆕 Actualizar estado local primero para UI responsiva
    setConfig((prev: GeneralConfig): GeneralConfig => {
      if (type === 'favoritoDelDia') {
        const currentFavoritos = Array.isArray(prev.favoritoDelDia)
          ? prev.favoritoDelDia
          : [];

        return {
          ...prev,
          favoritoDelDia: currentFavoritos.map((item: FavoritoDelDia) =>
            item.id === itemId ? { ...item, activo: !item.activo } : item
          ),
        };
      }

      // Para arrays normales
      const currentArray = Array.isArray(prev[type]) ? prev[type] as any[] : [];
      const newConfig = {
        ...prev,
        [type]: currentArray.map(
          (item: { id?: string; activo?: boolean }) =>
            item.id === itemId ? { ...item, activo: !item.activo } : item
        ),
      };

      return newConfig;
    });

    // 🆕 Guardar inmediatamente en PostgreSQL
    try {
      await handleSyncToClient();
      // 🆕 Recargar datos de vista previa inmediatamente
      await loadPreviewData();
      showNotification(`✅ ${type} actualizado y sincronizado con el cliente`, 'success');
    } catch (error) {
      console.error('Error sincronizando con cliente:', error);
      showNotification(`❌ Error sincronizando ${type}`, 'error');
    }
  };

  // Función auxiliar para cambiar el día simulado y reducir complejidad
  const handleDaySimulation = (diaSimulado: string, setPreviewMode: any) => {
    try {
      // Primero limpiamos cualquier valor anterior y notificamos el cambio
      delete (window as any).portalPreviewDay;

      // Permitir un pequeño tiempo para que se procese la limpieza
      setTimeout(() => {
        // Actualizar la variable global con el nuevo valor
        (window as any).portalPreviewDay = diaSimulado;

        // Disparar un evento para notificar a los componentes del cambio
        const event = new CustomEvent('portalPreviewDayChanged', {
          detail: { day: diaSimulado },
        });
        window.dispatchEvent(event);

        // Disparar eventos adicionales para asegurar que los componentes se actualicen
        try {
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('visibilitychange'));
        } catch (innerError) {
          console.warn('Error disparando eventos adicionales:', innerError);
        }

        // Forzar re-render del administrador
        setPreviewMode('portal-refresh');
        setTimeout(() => setPreviewMode('portal'), 150);
      }, 100);
    } catch (e) {
      console.error('❌ Error al disparar evento de cambio de día:', e);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Vista Previa del Portal */}
      <div className="premium-card">
        <div className="flex items-center justify-center mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center absolute left-6">
            <Smartphone className="w-5 h-5 mr-2" />
          </h4>

          {/* Botones Switch para Portal/Login/Tarjetas */}
          <div className="flex bg-dark-700 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('portal')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                previewMode === 'portal'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Portal Cliente
            </button>
            <button
              onClick={() => setPreviewMode('login')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                previewMode === 'login'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Branding
            </button>
            <button
              onClick={() => setPreviewMode('tarjetas')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                previewMode === 'tarjetas'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Tarjetas
            </button>
          </div>
        </div>

        {/* Selector de día para simular vista en diferentes días (solo aparece en modo portal) */}
        {previewMode === 'portal' && (
          <div className="mb-3 flex items-center space-x-2">
            <div className="text-sm text-dark-300">Simular día:</div>
            <div className="flex space-x-1">
              {/* Botones de días */}
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((dia, index) => {
                const diasCompletos = [
                  'domingo',
                  'lunes',
                  'martes',
                  'miercoles',
                  'jueves',
                  'viernes',
                  'sabado',
                ];
                const diaActual = diasCompletos[new Date().getDay()];
                const diaSimulado = diasCompletos[index];
                return (
                  <button
                    key={`dia-${diaSimulado}`}
                    onClick={() => {
                      // Actualizar el estado para simular un día diferente
                      handleDaySimulation(diaSimulado, setPreviewMode);
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      (window.portalPreviewDay || diaActual) ===
                      diasCompletos[index]
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-700 text-dark-300'
                    }`}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-dark-950 rounded-xl p-4 border border-dark-700">
          {previewMode === 'portal' ? (
            // Vista Previa del Portal
            <div className="bg-black text-white min-h-96 max-w-xs mx-auto rounded-xl overflow-hidden border border-dark-600">
              {/* Header del móvil */}
              <div className="flex items-center justify-between p-4">
                <h1 className="text-lg">
                  Hola,{' '}
                  <span className="text-pink-500 font-semibold">Cliente</span>
                </h1>
                <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
              </div>

              {/* Balance Card */}
              <div className="mx-4 mb-4">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-4">
                  <div className="text-white/80 text-sm mb-1">
                    Balance de Puntos
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">---</div>
                  <div className="text-white/60 text-xs">
                    Vista previa del cliente
                  </div>
                </div>
              </div>

              {/* Evento del día - Solo mostrar si hay banners activos para el día actual/simulado */}
              {(() => {
                // Obtener el día actual o simulado para filtrar banners
                const diasSemana = [
                  'domingo',
                  'lunes',
                  'martes',
                  'miercoles',
                  'jueves',
                  'viernes',
                  'sabado',
                ];
                const diaActual = diasSemana[new Date().getDay()];
                // Usar el día simulado si está definido, de lo contrario usar el día actual
                const diaParaMostrar = window.portalPreviewDay || diaActual;

                // Filtrar banners por día seleccionado y actividad
                // 🆕 USAR DATOS REALES DE BD EN LUGAR DEL ESTADO LOCAL
                const bannersReales = previewData?.banners || config.banners || [];
                const bannersDia = bannersReales.filter(
                  (b: Banner) =>
                    b.activo &&
                    b.imagenUrl &&
                    b.imagenUrl.trim() !== '' &&
                    (b.dia === diaParaMostrar || !b.dia) // Sin restricción de día o día específico
                );

                return bannersDia.length > 0 ? (
                  <div className="mx-4 mb-3">
                    {/* Mostrar el título del banner como un encabezado separado */}
                    {bannersDia[0].titulo && (
                      <h3 className="text-white font-semibold text-sm mb-2">
                        {bannersDia[0].titulo}
                      </h3>
                    )}
                    {bannersDia.slice(0, 1).map((banner: Banner) => (
                      <div
                        key={banner.id}
                        className="relative overflow-hidden rounded-xl"
                      >
                        <img
                          src={banner.imagenUrl}
                          alt={banner.titulo || 'Evento del día'}
                          className="w-full h-36 object-cover"
                        />
                        {/* Solo mostrar la descripción si existe y no es igual al título */}
                        {banner.descripcion &&
                          banner.descripcion !== banner.titulo && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2">
                              <p className="text-xs text-white">
                                {banner.descripcion}
                              </p>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Promociones - Con filtrado por día simulado */}
              {(() => {
                // Obtener el día actual o simulado para filtrar promociones
                const diasSemana = [
                  'domingo',
                  'lunes',
                  'martes',
                  'miercoles',
                  'jueves',
                  'viernes',
                  'sabado',
                ];
                const diaActual = diasSemana[new Date().getDay()];
                // Usar el día simulado si está definido, de lo contrario usar el día actual
                const diaParaMostrar = window.portalPreviewDay || diaActual;

                // Filtrar promociones por día seleccionado y actividad
                // 🆕 USAR DATOS REALES DE BD EN LUGAR DEL ESTADO LOCAL
                const promocionesReales = previewData?.promociones || config.promociones || [];
                const promocionesDia = promocionesReales.filter(
                  (p: Promocion) =>
                    p.activo &&
                    p.titulo &&
                    p.descripcion &&
                    (p.dia === diaParaMostrar || !p.dia) // Sin restricción de día o día específico
                );

                return (
                  promocionesDia.length > 0 && (
                    <div className="mx-4 mb-6">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-white/20 rounded-full p-1">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-white font-semibold text-sm">
                            Ofertas del Día
                          </h3>
                        </div>
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                          {promocionesDia.map((promo: Promocion) => (
                            <div
                              key={promo.id}
                              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 min-w-[140px] flex-shrink-0"
                            >
                              <h4 className="text-white font-medium text-xs mb-1">
                                {promo.titulo}
                              </h4>
                              <p className="text-white/80 text-xs mb-2">
                                {promo.descripcion}
                              </p>
                              {promo.descuento && promo.descuento > 0 && (
                                <div className="text-white text-xs font-bold">
                                  {promo.descuento}% OFF
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                );
              })()}

              {/* Favorito del Día */}
              {(() => {
                const diasSemana = [
                  'domingo',
                  'lunes',
                  'martes',
                  'miercoles',
                  'jueves',
                  'viernes',
                  'sabado',
                ];
                const diaActual = diasSemana[new Date().getDay()];
                // Usar el día simulado si está definido, igual que en Banner Diario
                const diaParaMostrar = window.portalPreviewDay || diaActual;

                // En modo simulación, mostrar favorito del día simulado aunque esté inactivo
                // 🆕 USAR DATOS REALES DE BD EN LUGAR DEL ESTADO LOCAL
                const favoritosReales = previewData?.favoritoDelDia || config.favoritoDelDia || [];
                const favoritoHoy = Array.isArray(favoritosReales)
                  ? favoritosReales.find((f: FavoritoDelDia) => {
                      // Si hay día simulado, mostrar ese específico independiente del estado activo
                      if (window.portalPreviewDay) {
                        return (
                          f.dia === diaParaMostrar &&
                          f.imagenUrl &&
                          f.imagenUrl.trim() !== ''
                        );
                      }
                      // En modo normal, respetar estado activo
                      return (
                        f.dia === diaParaMostrar &&
                        f.activo &&
                        f.imagenUrl &&
                        f.imagenUrl.trim() !== ''
                      );
                    })
                  : null;

                // Solo usar fallback si no hay simulación de día
                const favoritoFallback =
                  !window.portalPreviewDay &&
                  Array.isArray(favoritosReales)
                    ? favoritosReales.find(
                        (f: FavoritoDelDia) =>
                          f.activo && f.imagenUrl && f.imagenUrl.trim() !== ''
                      )
                    : null;

                const favoritoMostrar = favoritoHoy || favoritoFallback;

                return (
                  favoritoMostrar && (
                    <div className="mx-4 mb-3">
                      {/* Usar el título personalizado si existe, de lo contrario usar texto genérico */}
                      <h3 className="text-white font-semibold text-sm mb-2">
                        {getFavoritoProperty(favoritoMostrar, 'nombre') ||
                          'Favorito del día'}
                      </h3>
                      <div className="relative overflow-hidden rounded-xl">
                        <img
                          src={
                            getFavoritoProperty(
                              favoritoMostrar,
                              'imagenUrl'
                            ) as string
                          }
                          alt={
                            getFavoritoProperty(favoritoMostrar, 'nombre') ||
                            'Favorito del día'
                          }
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {/* Mostrar descripción si existe */}
                        {getFavoritoProperty(
                          favoritoMostrar,
                          'descripcion'
                        ) && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2">
                            <p className="text-xs text-white">
                              {getFavoritoProperty(
                                favoritoMostrar,
                                'descripcion'
                              )}
                            </p>
                          </div>
                        )}
                        <div className="absolute top-2 left-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">⭐</span>
                            </div>
                            <span className="text-white font-medium text-xs">
                              Favorito del{' '}
                              {favoritoHoy
                                ? 'Día'
                                : `${String(getFavoritoProperty(favoritoMostrar, 'dia')) || 'Día'}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                );
              })()}

              {/* Recompensas */}
              {(() => {
                // 🆕 USAR DATOS REALES DE BD EN LUGAR DEL ESTADO LOCAL
                const recompensasReales = previewData?.recompensas || config.recompensas || [];
                const recompensasActivas = getRecompensasList(recompensasReales).filter(
                  (r: Recompensa) => r.activo && r.nombre && r.puntosRequeridos
                );
                
                return recompensasActivas.length > 0 && (
                  <div className="mx-4 mb-3">
                    <h3 className="text-white font-semibold text-sm mb-2">
                      Recompensas
                    </h3>
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Gift className="w-4 h-4 text-white" />
                        <span className="text-white font-medium text-sm">
                          Programa de Puntos
                        </span>
                      </div>
                      <div className="flex overflow-x-auto space-x-2 pb-1">
                        {recompensasActivas
                          .slice(0, 3)
                          .map((recompensa: Recompensa) => (
                            <div
                              key={recompensa.id}
                              className="bg-white/20 rounded-lg p-2 min-w-[120px]"
                            >
                              <div className="text-white font-medium text-xs">
                                {recompensa.nombre}
                              </div>
                              <div className="text-white font-bold text-xs">
                                {recompensa.puntosRequeridos} pts
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Estado vacío */}
              {!config.banners?.filter(
                (b: Banner) =>
                  b.activo && b.imagenUrl && b.imagenUrl.trim() !== ''
              ).length &&
                !isFavoritoActivo(config.favoritoDelDia) &&
                !getPromocionesList(config.promociones).filter(
                  (p: Promocion) => p.activo && p.titulo && p.descripcion
                ).length &&
                !getRecompensasList(config.recompensas).filter(
                  (r: Recompensa) => r.activo && r.nombre && r.puntosRequeridos
                ).length && (
                  <div className="mx-4 mb-4 text-center py-8">
                    <div className="text-white/50 text-sm mb-2">
                      👆 Configure contenido arriba
                    </div>
                    <div className="text-white/30 text-xs">
                      El portal se mostrará limpio hasta que agregue banners,
                      promociones, recompensas o favoritos del día
                    </div>
                  </div>
                )}
            </div>
          ) : (
            renderPreviewContent()
          )}
        </div>
      </div>

      {/* Panel de Edición */}
      <div className="premium-card">
        {activeTab === 'preview' && previewMode === 'login' && (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto mb-4 text-primary-500" />
            <h4 className="text-lg font-semibold text-white mb-2">
              Vista Previa del Branding
            </h4>
            <p className="text-dark-400 mb-4">
              Esta vista muestra cómo se verá el branding configurado en la pantalla de acceso.
            </p>
            <div className="bg-dark-800 rounded-lg p-4 text-left">
              <h5 className="text-white font-medium mb-2">
                Configuración Actual:
              </h5>
              <ul className="space-y-1 text-sm text-dark-300">
                <li>
                  • Nombre del Negocio: {brandingConfig.businessName || 'No configurado'}
                </li>
                <li>
                  • Color Primario: {brandingConfig.primaryColor || 'No configurado'}
                </li>
                <li>
                  • Imágenes del Carrusel: {(brandingConfig.carouselImages?.length ?? 0)} imagen(es)
                </li>
              </ul>
              <div className="mt-3 pt-3 border-t border-dark-600">
                <p className="text-xs text-dark-400">
                  💡 Para editar el branding, usa la pestaña "Branding" en el menú principal.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && previewMode === 'tarjetas' && (
          <div className="space-y-6">
            {/* Solo Asignación Manual de Tarjetas en vista previa */}
            <AsignacionTarjetas
              showNotification={(message: string, type: any) =>
                showNotification(message, type)
              }
              tarjetasConfig={config.tarjetas || []}
            />
          </div>
        )}

        {activeTab === 'preview' && previewMode === 'portal' && (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto mb-4 text-primary-500" />
            <h4 className="text-lg font-semibold text-white mb-2">
              Vista Previa en Tiempo Real
            </h4>
            <p className="text-dark-400 mb-4">
              Esta vista muestra cómo verán los clientes tu portal. Los cambios
              se reflejan automáticamente.
            </p>
            <div className="bg-dark-800 rounded-lg p-4 text-left">
              <h5 className="text-white font-medium mb-2">
                Elementos Activos:
              </h5>
              <ul className="space-y-1 text-sm text-dark-300">
                <li>
                  •{' '}
                  {
                    (config.banners || []).filter((b: Banner) => b.activo)
                      .length
                  }{' '}
                  Banners activos
                </li>
                <li>
                  •{' '}
                  {
                    getPromocionesList(config.promociones).filter(
                      (p: Promocion) => p.activo
                    ).length
                  }{' '}
                  Promociones activas
                </li>
                <li>
                  • {isFavoritoActivo(config.favoritoDelDia) ? '1' : '0'}{' '}
                  Favorito del día activo
                </li>
                <li>
                  •{' '}
                  {
                    getRecompensasList(config.recompensas).filter(
                      (r: Recompensa) => r.activo
                    ).length
                  }{' '}
                  Recompensas activas
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'banners' && (
          <div className="max-h-[80vh] overflow-y-auto">
            <BannersManager
              banners={config.banners || []}
              onAdd={(banner: Banner) => addItem('banners', banner)}
              onUpdate={(id: string, updates: Partial<Banner>) =>
                updateItem('banners', id, updates)
              }
              onDelete={(id: string) => deleteItem('banners', id)}
              onToggle={(id: string) => toggleActive('banners', id)}
            />
          </div>
        )}

        {activeTab === 'promociones' && (
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Promociones</h2>
              <button
                onClick={handleSyncToClient}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Sincronizar con Cliente
              </button>
            </div>
            <PromocionesManager
              promociones={getPromocionesList(config.promociones)}
              onAdd={(promo: Promocion) => addItem('promociones', promo)}
              onUpdate={(id: string, updates: Partial<Promocion>) =>
                updateItem('promociones', id, updates)
              }
              onDelete={(id: string) => deleteItem('promociones', id)}
              onToggle={(id: string) => toggleActive('promociones', id)}
            />
          </div>
        )}

        {activeTab === 'favorito' && (
          <div className="max-h-[80vh] overflow-y-auto">
            <FavoritoDelDiaManager
              favoritos={getFavoritosList(config.favoritoDelDia)}
              onUpdate={(favorito: FavoritoDelDia) => {
                const currentFavoritos = Array.isArray(config.favoritoDelDia)
                  ? config.favoritoDelDia
                  : [];

                const existingFavorito = currentFavoritos.find(
                  (f: FavoritoDelDia) => f.dia === favorito.dia
                );

                if (existingFavorito) {
                  const existingId = getFavoritoProperty(
                    existingFavorito,
                    'id'
                  ) as string;
                  updateItem('favoritoDelDia', existingId, favorito);
                } else {
                  addItem('favoritoDelDia', favorito);
                }
                showNotification(
                  'Favorito del día actualizado correctamente',
                  'success'
                );
              }}
              onDelete={(favoritoId: string) => {
                deleteItem('favoritoDelDia', favoritoId);
                showNotification(
                  'Favorito del día eliminado correctamente',
                  'success'
                );
              }}
              onToggle={(favoritoId: string) => {
                toggleActive('favoritoDelDia', favoritoId);
                showNotification(
                  'Estado del favorito del día actualizado',
                  'success'
                );
              }}
            />
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="xl:col-span-2">
            <BrandingManager
              brandingConfig={brandingConfig}
              handleBrandingChange={handleBrandingChange}
              showNotification={showNotification}
            />
          </div>
        )}

        {activeTab === 'recompensas' && (
          <div className="max-h-[80vh] overflow-y-auto">
            <RecompensasManager
              recompensas={getRecompensasList(config.recompensas)}
              onAdd={(recompensa: Recompensa) =>
                addItem('recompensas', recompensa)
              }
              onUpdate={(id: string, updates: Partial<Recompensa>) =>
                updateItem('recompensas', id, updates)
              }
              onDelete={(id: string) => deleteItem('recompensas', id)}
              onToggle={(id: string) => toggleActive('recompensas', id)}
            />
          </div>
        )}

        {activeTab === 'tarjetas' && (
          <div className="max-h-[80vh] overflow-y-auto">
            <TarjetaEditor
              config={config}
              onUpdateCard={(nivel: string, updates: Partial<any>) =>
                updateItem('tarjetas', nivel, updates)
              }
              onUpdateNombreEmpresa={(nombreEmpresa: string) =>
                updateItem('nombreEmpresa', 'nombreEmpresa', { nombreEmpresa })
              }
              showNotification={showNotification}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalContentManager;
