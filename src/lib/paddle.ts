/**
 * 💳 CONFIGURACIÓN DE PADDLE PARA LEALTA 2.0
 * 
 * Configuración centralizada de Paddle Billing para manejar:
 * - Suscripciones de restaurantes
 * - Pagos únicos por funciones premium
 * - Facturación automática
 */

import { Environment, Paddle } from '@paddle/paddle-node-sdk';

// ===== VALIDACIÓN DE VARIABLES DE ENTORNO =====
const requiredEnvVars = {
  PADDLE_API_KEY: process.env.PADDLE_API_KEY,
  PADDLE_CLIENT_TOKEN: process.env.PADDLE_CLIENT_TOKEN,
  PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,
  NEXT_PUBLIC_PADDLE_ENVIRONMENT: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
};

// Validar en producción
if (process.env.NODE_ENV === 'production') {
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      console.error(`❌ Variable de entorno requerida faltante: ${key}`);
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
}

// Validar en desarrollo (warnings)
if (process.env.NODE_ENV === 'development') {
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      console.warn(`⚠️ Variable de entorno faltante: ${key} - usando valor por defecto`);
    }
  });
}

// Configuración del entorno
const paddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production' 
  ? Environment.production 
  : Environment.sandbox;

// Cliente de Paddle (Backend) - ahora con validación
export const paddleClient = new Paddle(
  process.env.PADDLE_API_KEY || 'sandbox_default_key',
  {
    environment: paddleEnvironment,
  }
);

// Configuración del cliente (Frontend)
export const paddleConfig = {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox',
  token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
  eventCallback: (data: any) => {
    console.log('🎯 Paddle Event:', data);
  },
};

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

  /**
   * @deprecated Esta función está deprecada. La verificación real de webhooks 
   * se hace en src/app/api/webhooks/paddle/route.ts usando verifyPaddleWebhook()
   * con HMAC-SHA256 correctamente implementado.
   */
  verifyWebhook: (_signature: string, _body: string): boolean => {
    console.warn('⚠️ paddleUtils.verifyWebhook está deprecado. Usa verifyPaddleWebhook en route.ts');
    return false;
  }
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
