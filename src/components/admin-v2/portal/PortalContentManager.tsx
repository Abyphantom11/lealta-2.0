'use client';

import React from 'react';
import { Smartphone, Building, Save, Eye, Gift } from 'lucide-react';

// Importar componentes ya creados
import BannersManager from './BannersManager';
import FavoritoDelDiaManager from './FavoritoDelDiaManager';
import PromocionesManager from './PromocionesManager';
import RecompensasManager from './RecompensasManager';
import TarjetaCompacta from './TarjetaCompacta';
import AsignacionTarjetas from './AsignacionTarjetas';
import TarjetaEditor from './TarjetaEditor';
import BrandingManager from './BrandingManager';
import { GeneralConfig as TarjetasConfig } from './types';
import { SharedBrandingConfig } from './shared-branding-types';

// Configuración temporal para evitar conflictos de tipos
type PortalConfig = any; // Usamos any temporalmente para el PortalContentManager

interface PortalContentManagerProps {
  activeTab: string;
  config: GeneralConfig;
  setConfig: React.Dispatch<React.SetStateAction<GeneralConfig>>;
  previewMode: ModoVistaPrevia;
  setPreviewMode: React.Dispatch<React.SetStateAction<ModoVistaPrevia>>;
  brandingConfig: BrandingConfig;
  handleBrandingChange: (field: string, value: string | string[]) => Promise<void>;
  showNotification: (message: string, type: NivelTarjeta) => void;
  onAssignCard?: (clientId: string, nivel: string) => Promise<void>;
  onUpdateConfig?: (field: string, value: any) => Promise<void>;
  handleCarouselImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveCarouselImage?: (index: number) => Promise<void>;
}

interface GeneralConfig {
  banners?: Banner[];
  promociones?: Promocion[];
  eventos?: Evento[];
  favoritoDelDia?: FavoritoDelDia[];
  recompensas?: Recompensa[];
  tarjetas?: Tarjeta[];
  nombreEmpresa?: string;
  nivelesConfig?: Record<string, {
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
  }>;
  empresa?: {
    nombre: string;
  };
}

// Usar tipos compartidos
type BrandingConfig = SharedBrandingConfig;

interface Banner {
  id?: string;
  dia?: string;
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

interface Tarjeta {
  id?: string;
  nivel?: string;
  nombre?: string;
  descripcion?: string;
  puntosRequeridos?: number;
  beneficios?: string[];
  color?: string;
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

type ModoVistaPrevia = 'portal' | 'login' | 'tarjetas';
type NivelTarjeta = 'success' | 'error' | 'info' | 'warning';

// Tipos para items de configuración
type ConfigurableItem = Banner | Promocion | Recompensa | FavoritoDelDia;
type ConfigurableItemType = 'banners' | 'promociones' | 'recompensas' | 'favoritoDelDia';

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
  onAssignCard,
  onUpdateConfig,
}) => {
  
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
              <h1 className="text-lg font-bold text-white mb-2">Descubre Nuestro Menú</h1>

              {(brandingConfig.carouselImages?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <div className="flex space-x-1 justify-center">
                    {brandingConfig.carouselImages
                      ?.slice(0, 3)
                      .map((image: string, index: number) => (
                        <div key={`carousel-preview-${index}-${image.substring(0, 10)}`} className="w-16 h-10 relative overflow-hidden rounded">
                          <img
                            src={image}
                            alt={`Carrusel ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    {(brandingConfig.carouselImages?.length ?? 0) > 3 && (
                      <div className="w-16 h-10 bg-black/70 rounded flex items-center justify-center">
                        <span className="text-white text-xs">+{(brandingConfig.carouselImages?.length ?? 0) - 3}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-white/60 text-xs mt-1 text-center">Carrusel de Imágenes</p>
                </div>
              )}

              <button
                className="text-white px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1 text-xs"
                style={{ backgroundColor: brandingConfig.primaryColor || '#2563EB' }}
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
            empresa: config.empresa || { nombre: config.nombreEmpresa || 'Love me' },
            nombreEmpresa: config.nombreEmpresa || config.empresa?.nombre || 'Love me'
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
      console.log('🔄 Admin - Sincronizando promociones con el cliente:', config.promociones);
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
        throw new Error('Error al sincronizar con el cliente');
      }

      const result = await response.json();
      console.log('✅ Admin - Promociones sincronizadas exitosamente:', result);
      showNotification('✅ Promociones sincronizadas con el portal del cliente', 'success');
    } catch (error) {
      console.error('❌ Admin - Error sincronizando promociones:', error);
      showNotification('❌ Error al sincronizar promociones', 'error');
    }
  };

  const addItem = (type: ConfigurableItemType, item: ConfigurableItem) => {
    const newItem = {
      ...item,
      id: item.id || `${type}_${Date.now()}`,
      activo: true,
    };

    setConfig((prev: GeneralConfig): GeneralConfig => {
      // Caso especial para favoritoDelDia
      if (type === 'favoritoDelDia') {
        const currentFavoritos = Array.isArray(prev.favoritoDelDia) 
          ? prev.favoritoDelDia 
          : [];
        
        const existingIndex = currentFavoritos.findIndex(
          (f: FavoritoDelDia) => isFavoritoWithDia(f) && f.dia === getFavoritoProperty(item, 'dia')
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
      
      return {
        ...prev,
        [type]: [...(prev[type] || []), newItem],
      };
    });
  };

  const updateItem = (type: ConfigurableItemType, itemId: string, updates: Partial<ConfigurableItem>) => {
    setConfig((prev: GeneralConfig): GeneralConfig => {
      if (type === 'favoritoDelDia') {
        const currentFavoritos = Array.isArray(prev.favoritoDelDia) 
          ? prev.favoritoDelDia 
          : [];
        
        return {
          ...prev,
          favoritoDelDia: currentFavoritos.map((item: FavoritoDelDia) =>
            isFavoritoWithId(item) && item.id === itemId ? { ...item, ...updates } : item
          ),
        };
      }
      
      return {
        ...prev,
        [type]: (prev[type] || []).map((item: { id?: string }) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      };
    });
  };

  const deleteItem = (type: ConfigurableItemType, itemId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
      setConfig((prev: GeneralConfig): GeneralConfig => {
        if (type === 'favoritoDelDia') {
          const currentFavoritos = Array.isArray(prev.favoritoDelDia) 
            ? prev.favoritoDelDia 
            : [];
          
          return {
            ...prev,
            favoritoDelDia: currentFavoritos.filter((item: FavoritoDelDia) => 
              !isFavoritoWithId(item) || item.id !== itemId
            ),
          };
        }
        
        return {
          ...prev,
          [type]: (prev[type] || []).filter((item: { id?: string }) => item.id !== itemId),
        };
      });
    }
  };

  const toggleActive = (type: ConfigurableItemType, itemId: string) => {
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
      
      return {
        ...prev,
        [type]: (prev[type] || []).map((item: { id?: string; activo?: boolean }) =>
          item.id === itemId ? { ...item, activo: !item.activo } : item
        ),
      };
    });
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
        
        <div className="bg-dark-950 rounded-xl p-4 border border-dark-700">
          {previewMode === 'portal' ? (
            // Vista Previa del Portal
            <div className="bg-black text-white min-h-96 max-w-xs mx-auto rounded-xl overflow-hidden border border-dark-600">
              {/* Header del móvil */}
              <div className="flex items-center justify-between p-4">
                <h1 className="text-lg">
                  Hola, <span className="text-pink-500 font-semibold">Cliente</span>
                </h1>
                <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
              </div>

              {/* Balance Card */}
              <div className="mx-4 mb-4">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-4">
                  <div className="text-white/80 text-sm mb-1">Balance de Puntos</div>
                  <div className="text-2xl font-bold text-white mb-1">---</div>
                  <div className="text-white/60 text-xs">Vista previa del cliente</div>
                </div>
              </div>

              {/* Evento del día */}
              {(config.banners || []).filter((b: Banner) => b.activo && b.imagenUrl && b.imagenUrl.trim() !== '').length > 0 && (
                <div className="mx-4 mb-3">
                  <h3 className="text-white font-semibold text-sm mb-2">Evento del día</h3>
                  {(config.banners || [])
                    .filter((b: Banner) => b.activo && b.imagenUrl && b.imagenUrl.trim() !== '')
                    .slice(0, 1)
                    .map((banner: Banner) => (
                      <div key={banner.id} className="relative overflow-hidden rounded-xl">
                        <img
                          src={banner.imagenUrl}
                          alt="Evento del día"
                          className="w-full h-36 object-cover"
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Promociones */}
              {getPromocionesList(config.promociones).filter((p: Promocion) => p.activo && p.titulo && p.descripcion).length > 0 && (
                <div className="mx-4 mb-3">
                  <h3 className="text-white font-semibold text-sm mb-2">Promociones Especiales</h3>
                  {getPromocionesList(config.promociones)
                    .filter((p: Promocion) => p.activo && p.titulo && p.descripcion)
                    .slice(0, 2)
                    .map((promo: Promocion) => (
                      <div key={promo.id} className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-3 mb-2">
                        <h4 className="text-white font-medium text-sm">{promo.titulo}</h4>
                        <p className="text-white/80 text-xs">{promo.descripcion}</p>
                      </div>
                    ))}
                </div>
              )}

              {/* Favorito del Día */}
              {(() => {
                const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
                const diaActual = diasSemana[new Date().getDay()];
                
                const favoritoHoy = Array.isArray(config.favoritoDelDia) 
                  ? config.favoritoDelDia.find((f: FavoritoDelDia) => 
                      f.dia === diaActual && f.activo && f.imagenUrl && f.imagenUrl.trim() !== ''
                    )
                  : null;

                const favoritoFallback = Array.isArray(config.favoritoDelDia)
                  ? config.favoritoDelDia.find((f: FavoritoDelDia) => 
                      f.activo && f.imagenUrl && f.imagenUrl.trim() !== ''
                    )
                  : null;

                const favoritoMostrar = favoritoHoy || favoritoFallback;

                return favoritoMostrar && (
                  <div className="mx-4 mb-3">
                    <h3 className="text-white font-semibold text-sm mb-2">Favorito del día</h3>
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={getFavoritoProperty(favoritoMostrar, 'imagenUrl') as string}
                        alt="Favorito del día"
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-2 left-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">⭐</span>
                          </div>
                          <span className="text-white font-medium text-xs">
                            Favorito del {favoritoHoy ? 'Día' : `${String(getFavoritoProperty(favoritoMostrar, 'dia')) || 'Día'}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Recompensas */}
              {getRecompensasList(config.recompensas).filter((r: Recompensa) => r.activo && r.nombre && r.puntosRequeridos).length > 0 && (
                <div className="mx-4 mb-3">
                  <h3 className="text-white font-semibold text-sm mb-2">Recompensas</h3>
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Gift className="w-4 h-4 text-white" />
                      <span className="text-white font-medium text-sm">Programa de Puntos</span>
                    </div>
                    <div className="flex overflow-x-auto space-x-2 pb-1">
                      {getRecompensasList(config.recompensas)
                        .filter((r: Recompensa) => r.activo && r.nombre && r.puntosRequeridos)
                        .slice(0, 3)
                        .map((recompensa: Recompensa) => (
                          <div key={recompensa.id} className="bg-white/20 rounded-lg p-2 min-w-[120px]">
                            <div className="text-white font-medium text-xs">{recompensa.nombre}</div>
                            <div className="text-white font-bold text-xs">{recompensa.puntosRequeridos} pts</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Estado vacío */}
              {(!config.banners?.filter((b: Banner) => b.activo && b.imagenUrl && b.imagenUrl.trim() !== '').length &&
                !isFavoritoActivo(config.favoritoDelDia) &&
                !getPromocionesList(config.promociones).filter((p: Promocion) => p.activo && p.titulo && p.descripcion).length &&
                !getRecompensasList(config.recompensas).filter((r: Recompensa) => r.activo && r.nombre && r.puntosRequeridos).length) && (
                <div className="mx-4 mb-4 text-center py-8">
                  <div className="text-white/50 text-sm mb-2">👆 Configure contenido arriba</div>
                  <div className="text-white/30 text-xs">
                    El portal se mostrará limpio hasta que agregue banners, promociones, recompensas o favoritos del día
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
          <BrandingManager
            brandingConfig={brandingConfig}
            handleBrandingChange={handleBrandingChange}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'preview' && previewMode === 'tarjetas' && (
          <div className="space-y-6">
            {/* Orden EXACTO del admin original: AsignacionTarjetas primero */}
            <AsignacionTarjetas
              showNotification={(message: string, type: any) => showNotification(message, type)}
            />

            {/* Gestión de tarjetas separada - como en admin original */}
            <TarjetaEditor
              config={{
                ...config,
                nivelesConfig: config.nivelesConfig || {},
                nombreEmpresa: config.nombreEmpresa || 'Love me',
                tarjetas: config.tarjetas || [],
              } as any}
              setConfig={(newConfig: any) => setConfig(newConfig)}
              showNotification={(message: string, type: any) => showNotification(message, type)}
            />
          </div>
        )}

        {activeTab === 'preview' && previewMode === 'portal' && (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto mb-4 text-primary-500" />
            <h4 className="text-lg font-semibold text-white mb-2">Vista Previa en Tiempo Real</h4>
            <p className="text-dark-400 mb-4">
              Esta vista muestra cómo verán los clientes tu portal. Los cambios se reflejan automáticamente.
            </p>
            <div className="bg-dark-800 rounded-lg p-4 text-left">
              <h5 className="text-white font-medium mb-2">Elementos Activos:</h5>
              <ul className="space-y-1 text-sm text-dark-300">
                <li>• {(config.banners || []).filter((b: Banner) => b.activo).length} Banners activos</li>
                <li>• {getPromocionesList(config.promociones).filter((p: Promocion) => p.activo).length} Promociones activas</li>
                <li>• {isFavoritoActivo(config.favoritoDelDia) ? '1' : '0'} Favorito del día activo</li>
                <li>• {getRecompensasList(config.recompensas).filter((r: Recompensa) => r.activo).length} Recompensas activas</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'banners' && (
          <BannersManager
            banners={config.banners || []}
            onAdd={(banner: Banner) => addItem('banners', banner)}
            onUpdate={(id: string, updates: Partial<Banner>) => updateItem('banners', id, updates)}
            onDelete={(id: string) => deleteItem('banners', id)}
            onToggle={(id: string) => toggleActive('banners', id)}
          />
        )}

        {activeTab === 'promociones' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Promociones</h2>
              <button
                onClick={handleSyncToClient}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sincronizar con Cliente
              </button>
            </div>
            <PromocionesManager
              promociones={getPromocionesList(config.promociones)}
              onAdd={(promo: Promocion) => addItem('promociones', promo)}
              onUpdate={(id: string, updates: Partial<Promocion>) => updateItem('promociones', id, updates)}
              onDelete={(id: string) => deleteItem('promociones', id)}
              onToggle={(id: string) => toggleActive('promociones', id)}
            />
          </div>
        )}

        {activeTab === 'favorito' && (
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
                const existingId = getFavoritoProperty(existingFavorito, 'id') as string;
                updateItem('favoritoDelDia', existingId, favorito);
              } else {
                addItem('favoritoDelDia', favorito);
              }
              showNotification('Favorito del día actualizado correctamente', 'success');
            }}
            onDelete={(favoritoId: string) => {
              deleteItem('favoritoDelDia', favoritoId);
              showNotification('Favorito del día eliminado correctamente', 'success');
            }}
            onToggle={(favoritoId: string) => {
              toggleActive('favoritoDelDia', favoritoId);
              showNotification('Estado del favorito del día actualizado', 'success');
            }}
          />
        )}

        {activeTab === 'recompensas' && (
          <RecompensasManager
            recompensas={getRecompensasList(config.recompensas)}
            onAdd={(recompensa: Recompensa) => addItem('recompensas', recompensa)}
            onUpdate={(id: string, updates: Partial<Recompensa>) => updateItem('recompensas', id, updates)}
            onDelete={(id: string) => deleteItem('recompensas', id)}
            onToggle={(id: string) => toggleActive('recompensas', id)}
          />
        )}
      </div>
    </div>
  );
};

export default PortalContentManager;
