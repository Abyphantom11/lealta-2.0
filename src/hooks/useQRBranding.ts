'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRBrandingConfig, DEFAULT_QR_BRANDING } from '@/types/qr-branding';

interface UseQRBrandingReturn {
  config: QRBrandingConfig;
  isLoading: boolean;
  error: string | null;
  updateConfig: (newConfig: Partial<QRBrandingConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useQRBranding(businessId: string): UseQRBrandingReturn {
  const [config, setConfig] = useState<QRBrandingConfig>(DEFAULT_QR_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch config desde API
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/business/${businessId}/qr-branding`);
      
      if (!response.ok) {
        throw new Error('Error al cargar configuración');
      }

      const data = await response.json();
      setConfig(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching QR config:', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  // Actualizar config
  const updateConfig = useCallback(
    async (newConfig: Partial<QRBrandingConfig>) => {
      setError(null);
      
      try {
        const response = await fetch(`/api/business/${businessId}/qr-branding`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newConfig),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar configuración');
        }

        const data = await response.json();
        setConfig(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar');
        throw err;
      }
    },
    [businessId]
  );

  // Resetear a valores por defecto
  const resetConfig = useCallback(async () => {
    setError(null);
    
    try {
      const response = await fetch(`/api/business/${businessId}/qr-branding`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al resetear configuración');
      }

      const data = await response.json();
      setConfig(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resetear');
      throw err;
    }
  }, [businessId]);

  // Refetch manual
  const refetch = useCallback(async () => {
    await fetchConfig();
  }, [fetchConfig]);

  // Fetch inicial
  useEffect(() => {
    if (businessId) {
      fetchConfig();
    }
  }, [businessId, fetchConfig]);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    resetConfig,
    refetch,
  };
}
