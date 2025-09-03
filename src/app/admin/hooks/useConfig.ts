// Hook personalizado para la gestión de la configuración del portal
import { useState, useCallback, useEffect } from 'react';
import {
  PortalConfig,
  BannerConfig,
  PromocionConfig,
  EventoConfig,
  RecompensaConfig,
  TarjetaConfig,
  FavoritoDelDiaConfig,
  ConfigOperationResult,
} from '../../../types/admin/config';
import logger from '../../../lib/logger';

export function useConfig() {
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar la configuración
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        '/api/admin/portal-config?businessId=default'
      );
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || data);
      } else {
        // Si no hay configuración, creamos una por defecto
        setConfig({
          id: 'default',
          colorPrimario: '#2563EB',
          colorSecundario: '#1E40AF',
          colorAcento: '#F59E0B',
          colorFondo: '#111827',
          colorTexto: '#FFFFFF',
          nombreNegocio: 'Mi Negocio',
          banners: [],
          promociones: [],
          eventos: [],
          recompensas: [],
          tarjetas: [],
          favoritoDelDia: [],
        });
        const errorData = await response.json();
        logger.warn(
          'No se encontró configuración, usando valores predeterminados:',
          errorData
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar la configuración: ${message}`);
      logger.error('Error al cargar configuración:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para guardar la configuración
  const saveConfig = useCallback(
    async (newConfig: PortalConfig): Promise<ConfigOperationResult> => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/portal-config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newConfig,
            businessId: 'default',
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setConfig(result.config || result);
          return {
            success: true,
            message: 'Configuración guardada correctamente',
            config: result.config || result,
          };
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Error al guardar la configuración');
          logger.error('Error al guardar configuración:', errorData);
          return {
            success: false,
            message: 'Error al guardar la configuración',
            error: errorData.message,
          };
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al guardar la configuración: ${message}`);
        logger.error('Error al guardar configuración:', error);
        return {
          success: false,
          message: 'Error al guardar la configuración',
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Función para actualizar un banner
  const updateBanner = useCallback(
    async (banner: BannerConfig): Promise<ConfigOperationResult> => {
      if (!config)
        return { success: false, message: 'No hay configuración cargada' };

      try {
        // Crear una copia de la configuración actual
        const updatedConfig = { ...config };

        // Buscar si ya existe el banner
        const bannerIndex = updatedConfig.banners.findIndex(
          b => b.id === banner.id
        );

        if (bannerIndex >= 0) {
          // Actualizar banner existente
          updatedConfig.banners[bannerIndex] = banner;
        } else {
          // Añadir nuevo banner
          updatedConfig.banners.push({
            ...banner,
            id: banner.id || `banner_${Date.now()}`,
          });
        }

        // Guardar la configuración actualizada
        return await saveConfig(updatedConfig);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al actualizar el banner: ${message}`);
        logger.error('Error al actualizar banner:', error);
        return {
          success: false,
          message: 'Error al actualizar el banner',
          error: message,
        };
      }
    },
    [config, saveConfig]
  );

  // Función para actualizar una promoción
  const updatePromocion = useCallback(
    async (promocion: PromocionConfig): Promise<ConfigOperationResult> => {
      if (!config)
        return { success: false, message: 'No hay configuración cargada' };

      try {
        // Crear una copia de la configuración actual
        const updatedConfig = { ...config };

        // Buscar si ya existe la promoción
        const promocionIndex = updatedConfig.promociones.findIndex(
          p => p.id === promocion.id
        );

        if (promocionIndex >= 0) {
          // Actualizar promoción existente
          updatedConfig.promociones[promocionIndex] = promocion;
        } else {
          // Añadir nueva promoción
          updatedConfig.promociones.push({
            ...promocion,
            id: promocion.id || `promo_${Date.now()}`,
          });
        }

        // Guardar la configuración actualizada
        return await saveConfig(updatedConfig);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al actualizar la promoción: ${message}`);
        logger.error('Error al actualizar promoción:', error);
        return {
          success: false,
          message: 'Error al actualizar la promoción',
          error: message,
        };
      }
    },
    [config, saveConfig]
  );

  // Función para actualizar un evento
  const updateEvento = useCallback(
    async (evento: EventoConfig): Promise<ConfigOperationResult> => {
      if (!config)
        return { success: false, message: 'No hay configuración cargada' };

      try {
        // Crear una copia de la configuración actual
        const updatedConfig = { ...config };

        // Buscar si ya existe el evento
        const eventoIndex = updatedConfig.eventos.findIndex(
          e => e.id === evento.id
        );

        if (eventoIndex >= 0) {
          // Actualizar evento existente
          updatedConfig.eventos[eventoIndex] = evento;
        } else {
          // Añadir nuevo evento
          updatedConfig.eventos.push({
            ...evento,
            id: evento.id || `evento_${Date.now()}`,
          });
        }

        // Guardar la configuración actualizada
        return await saveConfig(updatedConfig);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al actualizar el evento: ${message}`);
        logger.error('Error al actualizar evento:', error);
        return {
          success: false,
          message: 'Error al actualizar el evento',
          error: message,
        };
      }
    },
    [config, saveConfig]
  );

  // Función para actualizar una recompensa
  const updateRecompensa = useCallback(
    async (recompensa: RecompensaConfig): Promise<ConfigOperationResult> => {
      if (!config)
        return { success: false, message: 'No hay configuración cargada' };

      try {
        // Crear una copia de la configuración actual
        const updatedConfig = { ...config };

        // Buscar si ya existe la recompensa
        const recompensaIndex = updatedConfig.recompensas.findIndex(
          r => r.id === recompensa.id
        );

        if (recompensaIndex >= 0) {
          // Actualizar recompensa existente
          updatedConfig.recompensas[recompensaIndex] = recompensa;
        } else {
          // Añadir nueva recompensa
          updatedConfig.recompensas.push({
            ...recompensa,
            id: recompensa.id || `recompensa_${Date.now()}`,
          });
        }

        // Guardar la configuración actualizada
        return await saveConfig(updatedConfig);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al actualizar la recompensa: ${message}`);
        logger.error('Error al actualizar recompensa:', error);
        return {
          success: false,
          message: 'Error al actualizar la recompensa',
          error: message,
        };
      }
    },
    [config, saveConfig]
  );

  // Función para actualizar una tarjeta
  const updateTarjeta = useCallback(
    async (tarjeta: TarjetaConfig): Promise<ConfigOperationResult> => {
      if (!config)
        return { success: false, message: 'No hay configuración cargada' };

      try {
        // Crear una copia de la configuración actual
        const updatedConfig = { ...config };

        // Buscar si ya existe la tarjeta
        const tarjetaIndex = updatedConfig.tarjetas.findIndex(
          t => t.id === tarjeta.id
        );

        if (tarjetaIndex >= 0) {
          // Actualizar tarjeta existente
          updatedConfig.tarjetas[tarjetaIndex] = tarjeta;
        } else {
          // Añadir nueva tarjeta
          updatedConfig.tarjetas.push({
            ...tarjeta,
            id: tarjeta.id || `tarjeta_${Date.now()}`,
          });
        }

        // Guardar la configuración actualizada
        return await saveConfig(updatedConfig);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al actualizar la tarjeta: ${message}`);
        logger.error('Error al actualizar tarjeta:', error);
        return {
          success: false,
          message: 'Error al actualizar la tarjeta',
          error: message,
        };
      }
    },
    [config, saveConfig]
  );

  // Función para actualizar/crear un favorito del día
  const updateFavoritoDia = useCallback(
    async (favorito: FavoritoDelDiaConfig): Promise<ConfigOperationResult> => {
      if (!config)
        return { success: false, message: 'No hay configuración cargada' };

      try {
        // Crear una copia de la configuración actual
        const updatedConfig = { ...config };

        // Asegurar que favoritoDelDia sea un array
        if (!Array.isArray(updatedConfig.favoritoDelDia)) {
          updatedConfig.favoritoDelDia = [];
        }

        // Buscar si ya existe un favorito para este día
        const existingIndex = updatedConfig.favoritoDelDia.findIndex(
          f => f.dia === favorito.dia
        );

        const favoritoCompleto = {
          ...favorito,
          id: favorito.id || `favorito_${favorito.dia}_${Date.now()}`,
        };

        if (existingIndex >= 0) {
          // Actualizar favorito existente
          updatedConfig.favoritoDelDia[existingIndex] = favoritoCompleto;
        } else {
          // Agregar nuevo favorito
          updatedConfig.favoritoDelDia.push(favoritoCompleto);
        }

        // Guardar la configuración actualizada
        return await saveConfig(updatedConfig);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al actualizar el favorito del día: ${message}`);
        logger.error('Error al actualizar favorito del día:', error);
        return {
          success: false,
          message: 'Error al actualizar el favorito del día',
          error: message,
        };
      }
    },
    [config, saveConfig]
  );

  // Función para eliminar un favorito del día
  const deleteFavoritoDia = useCallback(
    async (favoritoId: string): Promise<ConfigOperationResult> => {
      if (!config)
        return { success: false, message: 'No hay configuración cargada' };

      try {
        const updatedConfig = { ...config };
        
        // Asegurar que favoritoDelDia sea un array
        if (!Array.isArray(updatedConfig.favoritoDelDia)) {
          updatedConfig.favoritoDelDia = [];
        }

        // Filtrar el favorito a eliminar
        updatedConfig.favoritoDelDia = updatedConfig.favoritoDelDia.filter(
          f => f.id !== favoritoId
        );

        return await saveConfig(updatedConfig);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al eliminar el favorito del día: ${message}`);
        logger.error('Error al eliminar favorito del día:', error);
        return {
          success: false,
          message: 'Error al eliminar el favorito del día',
          error: message,
        };
      }
    },
    [config, saveConfig]
  );

  // Función para activar/desactivar un favorito del día
  const toggleFavoritoDia = useCallback(
    async (favoritoId: string): Promise<ConfigOperationResult> => {
      if (!config)
        return { success: false, message: 'No hay configuración cargada' };

      try {
        const updatedConfig = { ...config };
        
        // Asegurar que favoritoDelDia sea un array
        if (!Array.isArray(updatedConfig.favoritoDelDia)) {
          updatedConfig.favoritoDelDia = [];
        }

        // Encontrar y toggle el favorito
        const favoritoIndex = updatedConfig.favoritoDelDia.findIndex(
          f => f.id === favoritoId
        );

        if (favoritoIndex >= 0) {
          updatedConfig.favoritoDelDia[favoritoIndex] = {
            ...updatedConfig.favoritoDelDia[favoritoIndex],
            activo: !updatedConfig.favoritoDelDia[favoritoIndex].activo
          };
        }

        return await saveConfig(updatedConfig);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al cambiar estado del favorito del día: ${message}`);
        logger.error('Error al cambiar estado del favorito del día:', error);
        return {
          success: false,
          message: 'Error al cambiar estado del favorito del día',
          error: message,
        };
      }
    },
    [config, saveConfig]
  );

  // Función para subir imágenes
  const uploadImage = useCallback(
    async (file: File, type: string, id?: string): Promise<string> => {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (id) formData.append('id', id);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          return data.url;
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Error al subir la imagen');
          logger.error('Error al subir imagen:', errorData);
          throw new Error(errorData.message || 'Error al subir la imagen');
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al subir la imagen: ${message}`);
        logger.error('Error al subir imagen:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Cargar la configuración inicialmente
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    fetchConfig,
    saveConfig,
    updateBanner,
    updatePromocion,
    updateEvento,
    updateRecompensa,
    updateTarjeta,
    updateFavoritoDia,
    deleteFavoritoDia,
    toggleFavoritoDia,
    uploadImage,
  };
}
