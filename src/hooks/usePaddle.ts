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
  createCheckoutWithLink: (options: CheckoutOptions) => Promise<void>; // ← Método alternativo
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
        
        // Verificar si tenemos el token
        if (!paddleConfig.token || paddleConfig.token === '') {
          console.warn('⚠️ PADDLE_CLIENT_TOKEN no configurado - Paddle no se inicializará');
          console.warn('📝 Para probar Paddle, sigue la guía: PADDLE_TESTING_GUIDE.md');
          setError('Paddle no configurado. Necesitas crear una cuenta en Paddle Sandbox primero.');
          setIsLoading(false);
          return;
        }
        
        // Verificar si Paddle está bloqueado por AdBlock
        if (typeof window !== 'undefined' && !window.Paddle && !initializePaddle) {
          console.error('❌ Paddle bloqueado por extensión del navegador');
          setError('BLOQUEADO: Desactiva tu bloqueador de anuncios para usar Paddle. Dominios: *.paddle.com');
          setIsLoading(false);
          return;
        }
        
        const paddleInstance = await initializePaddle({
          environment: paddleConfig.environment as any,
          token: paddleConfig.token,
          eventCallback: paddleConfig.eventCallback,
        });

        if (paddleInstance) {
          setPaddle(paddleInstance);
          console.log('✅ Paddle inicializado correctamente');
          console.log('🌍 Entorno:', paddleConfig.environment);
          console.log('🔑 Token:', paddleConfig.token.substring(0, 10) + '...');
        } else {
          throw new Error('No se pudo inicializar Paddle');
        }

      } catch (err) {
        console.error('❌ Error inicializando Paddle:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        
        // Detectar errores comunes
        if (errorMessage.includes('blocked') || errorMessage.includes('ERR_BLOCKED_BY_CLIENT')) {
          setError('BLOQUEADO: Tu bloqueador de anuncios está bloqueando Paddle. Desactívalo para este sitio.');
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          setError('ERROR DE AUTENTICACIÓN: Verifica tu Client Token de Paddle.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    }

    initPaddle();
  }, []);

  // Crear checkout con Paddle Overlay (muestra formulario inline)
  const createCheckout = async (options: CheckoutOptions) => {
    if (!paddle) {
      throw new Error('Paddle no está inicializado');
    }

    try {
      console.log('🛒 Creando checkout con Paddle Overlay:', options);
      console.log('📦 Usando Price ID:', options.priceId);

      // Preparar los datos del checkout - SIMPLIFICADO para evitar errores 400
      const checkoutData: any = {
        items: [{
          priceId: options.priceId,
          quantity: 1,
        }]
      };

      // Solo agregar customer si tenemos email válido
      if (options.customerEmail && options.customerEmail.includes('@')) {
        checkoutData.customer = {
          email: options.customerEmail,
        };
        
        // Agregar nombre solo si está presente
        if (options.customerName) {
          checkoutData.customer.name = options.customerName;
        }
      }

      // Custom data simplificado - solo lo esencial
      if (options.businessId) {
        checkoutData.customData = {
          business_id: options.businessId, // Usar snake_case
        };
      }

      // Settings opcionales
      checkoutData.settings = {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'es',
      };

      // Solo agregar URLs si están presentes
      if (options.successUrl) {
        checkoutData.settings.successUrl = options.successUrl;
      }

      console.log('📤 Datos del checkout:', JSON.stringify(checkoutData, null, 2));

      // Usar Paddle Overlay directamente (muestra el formulario de pago)
      paddle.Checkout.open(checkoutData);

      console.log('✅ Checkout overlay abierto exitosamente');

    } catch (err) {
      console.error('❌ Error creando checkout:', err);
      
      // Log detallado del error
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      
      throw err;
    }
  };

  // 🔗 ALTERNATIVA: Crear checkout con Payment Link (evita 403)
  const createCheckoutWithLink = async (options: CheckoutOptions) => {
    try {
      console.log('🔗 Creando checkout con Payment Link (alternativa al 403)');

      // Generar payment link desde backend
      const response = await fetch('/api/billing/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: options.priceId,
          businessId: options.businessId,
          customerEmail: options.customerEmail,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.paymentUrl) {
        throw new Error('No se pudo generar el payment link');
      }

      console.log('✅ Payment link generado:', data.paymentUrl);

      // Redirigir al usuario al checkout de Paddle
      globalThis.location.href = data.paymentUrl;

    } catch (err) {
      console.error('❌ Error creando checkout con link:', err);
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
      
      // Obtener URL del portal desde nuestro backend
      const response = await fetch(`/api/billing/portal?subscriptionId=${subscriptionId}`);
      const data = await response.json();

      if (!data.success || !data.portalUrls) {
        throw new Error('No se pudo obtener la URL del portal');
      }

      // Abrir URL del portal de gestión
      const portalUrl = data.portalUrls.updatePaymentMethod || data.portalUrls.cancel;
      
      if (portalUrl) {
        globalThis.open(portalUrl, '_blank');
      } else {
        throw new Error('URL del portal no disponible');
      }

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
    createCheckoutWithLink, // ← Método alternativo
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
