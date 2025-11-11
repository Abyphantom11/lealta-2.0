/**
 * 💳 CONFIGURACIÓN DE PADDLE PARA LEALTA 2.0
 * 
 * Configuración centralizada de Paddle Billing para manejar:
 * - Suscripciones de restaurantes
 * - Pagos únicos por funciones premium
 * - Facturación automática
 */

import { Environment, Paddle } from '@paddle/paddle-node-sdk';

// ===== VALIDACIÓN SOLO EN SERVIDOR =====
// ⚠️ IMPORTANTE: Las validaciones de variables del servidor (PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET)
// se hacen en los endpoints de API, NO aquí. Este archivo puede ser importado por el cliente.

// Configuración del entorno
const paddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production' 
  ? Environment.production 
  : Environment.sandbox;

// ===== CLIENTE DE PADDLE (SOLO BACKEND) =====
// Este cliente solo debe usarse en rutas API del servidor
// La validación de PADDLE_API_KEY se hace en cada endpoint que lo usa
let paddleClientInstance: Paddle | null = null;

function getPaddleClient(): Paddle {
  if (!paddleClientInstance) {
    // Solo validar en servidor cuando se intenta usar
    if (typeof window === 'undefined') {
      const apiKey = process.env.PADDLE_API_KEY;
      if (!apiKey) {
        throw new Error('PADDLE_API_KEY no está configurada. Configúrala en las variables de entorno.');
      }
      paddleClientInstance = new Paddle(apiKey, {
        environment: paddleEnvironment,
      });
    } else {
      throw new Error('paddleClient solo puede usarse en el servidor, no en el cliente');
    }
  }
  return paddleClientInstance;
}

// Export como getter para validación lazy
export const paddleClient = new Proxy({} as Paddle, {
  get: (target, prop) => {
    const client = getPaddleClient();
    return (client as any)[prop];
  }
});

// ===== CONFIGURACIÓN DEL CLIENTE (FRONTEND) =====
// Solo usa variables NEXT_PUBLIC_* que son seguras para el cliente
const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
const clientEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';

// Validar solo en el cliente
if (typeof window !== 'undefined') {
  if (!clientToken) {
    console.warn('⚠️ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN no está configurada. El checkout de Paddle no funcionará.');
  }
  console.log('🏗️ Paddle configurado en modo:', clientEnvironment);
}

export const paddleConfig = {
  environment: clientEnvironment,
  token: clientToken || '',
  eventCallback: (data: any) => {
    console.log('🎯 Paddle Event:', data);
  },
};

// ===== PRICE IDs =====
// Price ID del Plan Enterprise (disponible en cliente y servidor)
export const PADDLE_PRICE_ID_ENTERPRISE = 'pri_01k9d95qvht02dqzvkw0h5876p';

// Planes de suscripción disponibles
export const PADDLE_PLANS = {
  ENTERPRISE: {
    id: process.env.PADDLE_PLAN_ENTERPRISE_ID || 'pri_lealta_enterprise_250',
    name: 'Lealta Enterprise',
    description: 'Solución empresarial personalizada para múltiples negocios',
    price: '$250/negocio',
    annualPrice: '$2,500/año por negocio',
    features: [
      'Gestión ilimitada de negocios',
      'Clientes y reservas ilimitados',
      'Staff y promotores ilimitados',
      'Implementación personalizada',
      'Soporte dedicado 24/7',
      'Integración enterprise a medida',
      'Analytics avanzados personalizados',
      'Sistema de fidelización completo',
      'OCR con IA incluido',
      'Capacitación y onboarding completo',
      'Actualizaciones y mantenimiento',
      'Portal personalizado para la marca'
    ]
  },
  // Mantenido por compatibilidad con código existente
  PRO: {
    id: process.env.PADDLE_PLAN_PRO_ID || 'pri_lealta_pro_plan',
    name: 'Lealta Enterprise',
    description: 'Solución empresarial personalizada para múltiples negocios',
    price: '$250/negocio',
    annualPrice: '$2,500/año por negocio',
    features: [
      'Gestión ilimitada de negocios',
      'Clientes y reservas ilimitados',
      'Staff y promotores ilimitados',
      'Implementación personalizada',
      'Soporte dedicado 24/7',
      'Integración enterprise a medida',
      'Analytics avanzados personalizados',
      'Sistema de fidelización completo',
      'OCR con IA incluido'
    ]
  }
} as const;

// Productos únicos para implementación enterprise
export const PADDLE_PRODUCTS = {
  ENTERPRISE_SETUP: {
    id: process.env.PADDLE_PRODUCT_ENTERPRISE_SETUP_ID || 'pri_enterprise_setup_product',
    name: 'Configuración Enterprise',
    description: 'Implementación y configuración inicial personalizada',
    price: '$2,500'
  },
  CUSTOM_INTEGRATION: {
    id: process.env.PADDLE_PRODUCT_CUSTOM_INTEGRATION_ID || 'pri_custom_integration_product',
    name: 'Integración Personalizada',
    description: 'Desarrollo de integraciones específicas para su empresa',
    price: '$5,000'
  }
} as const;

/**
 * Utilidades para manejo de precios
 */
export const paddleUtils = {
  /**
   * Formatea un precio de Paddle a formato local
   */
  formatPrice: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency
    }).format(amount / 100); // Paddle usa centavos
  },

  /**
   * Convierte precio local a formato Paddle (centavos)
   */
  toPaddleAmount: (amount: number): number => {
    return Math.round(amount * 100);
  },
};

/**
 * Tipos TypeScript para Paddle
 */
export interface PaddleSubscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  planId: string;
  customerId: string;
  nextBillDate: string;
  cancelUrl?: string;
  updateUrl?: string;
}

export interface PaddleCustomer {
  id: string;
  email: string;
  name?: string;
  businessId?: string; // ID del negocio en Lealta
}

export interface PaddleCheckoutOptions {
  priceId: string;
  customData?: {
    businessId: string;
    userId: string;
  };
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * URLs de callback para Paddle
 */
export const paddleUrls = {
  success: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
  cancel: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
  webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paddle`,
  portal: `${process.env.NEXT_PUBLIC_APP_URL}/billing/portal`,
};

export default paddleClient;
