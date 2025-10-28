'use client';

import { useState, useEffect, useCallback } from 'react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { paddleConfig, PADDLE_PLANS, PADDLE_PRODUCTS } from '@/lib/paddle';

/**
 * 🎣 HOOK: usePaddle
 * 
 * Hook personalizado para manejar Paddle en el frontend
 */

interface UsePaddleReturn {
  paddle: Paddle | null;
  isLoading: boolean;
  error: string | null;
  createCheckout: (options: CheckoutOptions) => Promise<void>;
  openSubscriptionPortal: (subscriptionId: string) => Promise<void>;
}

interface CheckoutOptions {
  priceId: string;
  businessId: string;
  customerEmail: string;
  customerName?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export function usePaddle(): UsePaddleReturn {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar Paddle
  useEffect(() => {
    async function initPaddle() {
      try {
        setIsLoading(true);
        
        console.log('🚀 Inicializando Paddle...');
        
        const paddleInstance = await initializePaddle({
          environment: paddleConfig.environment as any,
          token: paddleConfig.token,
          eventCallback: paddleConfig.eventCallback,
        });

        if (paddleInstance) {
          setPaddle(paddleInstance);
          console.log('✅ Paddle inicializado correctamente');
        } else {
          throw new Error('No se pudo inicializar Paddle');
        }

      } catch (err) {
        console.error('❌ Error inicializando Paddle:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    initPaddle();
  }, []);

  // Crear checkout
  const createCheckout = async (options: CheckoutOptions) => {
    if (!paddle) {
      throw new Error('Paddle no está inicializado');
    }

    try {
      console.log('🛒 Creando checkout con opciones:', options);

      // Llamar a nuestra API para crear el checkout
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error creando checkout');
      }

      // Redirect to Paddle checkout URL
      if (data.checkoutUrl && data.checkoutUrl !== '#') {
        globalThis.location?.assign(data.checkoutUrl);
      } else {
        throw new Error('URL de checkout inválida');
      }

    } catch (err) {
      console.error('❌ Error creando checkout:', err);
      throw err;
    }
  };

  // Abrir portal de suscripción
  const openSubscriptionPortal = async (subscriptionId: string) => {
    if (!paddle) {
      throw new Error('Paddle no está inicializado');
    }

    try {
      console.log('🎯 Abriendo portal de suscripción:', subscriptionId);
      
      // En un caso real, necesitarías obtener la URL del portal desde tu backend
      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing/portal?subscription=${subscriptionId}`;
      
      window.open(portalUrl, '_blank');

    } catch (err) {
      console.error('❌ Error abriendo portal:', err);
      throw err;
    }
  };

  return {
    paddle,
    isLoading,
    error,
    createCheckout,
    openSubscriptionPortal,
  };
}

/**
 * 🎣 HOOK: usePaddleSubscriptions
 * 
 * Hook para manejar suscripciones
 */
interface UsePaddleSubscriptionsReturn {
  subscriptions: any[];
  isLoading: boolean;
  error: string | null;
  refreshSubscriptions: () => Promise<void>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
}

export function usePaddleSubscriptions(businessId: string): UsePaddleSubscriptionsReturn {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/billing/subscriptions?businessId=${businessId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo suscripciones');
      }

      setSubscriptions(data.subscriptions);
      setError(null);

    } catch (err) {
      console.error('❌ Error obteniendo suscripciones:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/billing/subscriptions?subscriptionId=${subscriptionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error cancelando suscripción');
      }

      // Refrescar lista de suscripciones
      await fetchSubscriptions();

    } catch (err) {
      console.error('❌ Error cancelando suscripción:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchSubscriptions();
    }
  }, [businessId, fetchSubscriptions]);

  return {
    subscriptions,
    isLoading,
    error,
    refreshSubscriptions: fetchSubscriptions,
    cancelSubscription,
  };
}

/**
 * 🎣 HOOK: usePaddlePlans
 * 
 * Hook para obtener planes disponibles
 */
export function usePaddlePlans() {
  return {
    plans: Object.values(PADDLE_PLANS),
    products: Object.values(PADDLE_PRODUCTS),
    getPlanById: (id: string) => Object.values(PADDLE_PLANS).find(plan => plan.id === id),
    getProductById: (id: string) => Object.values(PADDLE_PRODUCTS).find(product => product.id === id),
  };
}
