/**
 * Sistema de control de acceso basado en suscripciones y trials
 * 
 * IMPORTANTE: Este sistema protege a usuarios existentes que no tienen trial asignado
 * Solo aplica restricciones a usuarios con trialEndsAt configurado
 */

import { prisma } from '@/lib/prisma';

export interface SubscriptionAccess {
  hasAccess: boolean;
  status: 'active' | 'trialing' | 'expired' | 'legacy' | 'grace_period';
  daysRemaining: number | null;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
  needsPayment: boolean;
  message: string;
  isLegacyUser: boolean; // Usuario sin trial asignado (anterior al sistema)
}

/**
 * Verifica si un negocio tiene acceso a la plataforma
 * 
 * Lógica de acceso:
 * 1. Si tiene suscripción activa → Acceso completo
 * 2. Si NO tiene trialEndsAt (usuario legacy) → Acceso completo
 * 3. Si trial está vigente → Acceso con advertencia
 * 4. Si trial expiró hace menos de 3 días → Grace period
 * 5. Si trial expiró hace más de 3 días → Requiere pago
 */
export async function checkBusinessAccess(
  businessId: string
): Promise<SubscriptionAccess> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        subscriptionStatus: true,
        subscriptionId: true,
        trialEndsAt: true,
        subscriptionEndDate: true,
      },
    });

    if (!business) {
      return {
        hasAccess: false,
        status: 'expired',
        daysRemaining: null,
        trialEndsAt: null,
        subscriptionStatus: null,
        needsPayment: true,
        message: 'Negocio no encontrado',
        isLegacyUser: false,
      };
    }

    const now = new Date();
    const GRACE_PERIOD_DAYS = 3;

    // 1. Verificar suscripción activa
    if (
      business.subscriptionStatus === 'active' &&
      business.subscriptionId
    ) {
      return {
        hasAccess: true,
        status: 'active',
        daysRemaining: null,
        trialEndsAt: business.trialEndsAt,
        subscriptionStatus: business.subscriptionStatus,
        needsPayment: false,
        message: 'Suscripción activa',
        isLegacyUser: false,
      };
    }

    // 2. PROTECCIÓN: Usuario legacy (sin trial asignado)
    // Estos usuarios existían antes del sistema de trials
    if (!business.trialEndsAt) {
      return {
        hasAccess: true,
        status: 'legacy',
        daysRemaining: null,
        trialEndsAt: null,
        subscriptionStatus: business.subscriptionStatus,
        needsPayment: false,
        message: 'Usuario legacy - Acceso completo',
        isLegacyUser: true,
      };
    }

    // 3. Verificar trial vigente
    const trialEndsAt = new Date(business.trialEndsAt);
    const daysRemaining = Math.ceil(
      (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (now < trialEndsAt) {
      return {
        hasAccess: true,
        status: 'trialing',
        daysRemaining,
        trialEndsAt: business.trialEndsAt,
        subscriptionStatus: business.subscriptionStatus,
        needsPayment: false,
        message:
          daysRemaining <= 3
            ? `Tu prueba gratis termina en ${daysRemaining} días`
            : 'Periodo de prueba activo',
        isLegacyUser: false,
      };
    }

    // 4. Trial expirado - verificar grace period
    const daysSinceExpiration = Math.abs(daysRemaining);

    if (daysSinceExpiration <= GRACE_PERIOD_DAYS) {
      return {
        hasAccess: true, // Aún tiene acceso en grace period
        status: 'grace_period',
        daysRemaining: GRACE_PERIOD_DAYS - daysSinceExpiration,
        trialEndsAt: business.trialEndsAt,
        subscriptionStatus: business.subscriptionStatus,
        needsPayment: true,
        message: `Tu prueba gratis expiró. Tienes ${GRACE_PERIOD_DAYS - daysSinceExpiration} días para suscribirte`,
        isLegacyUser: false,
      };
    }

    // 5. Trial expirado y grace period terminado
    return {
      hasAccess: false,
      status: 'expired',
      daysRemaining: 0,
      trialEndsAt: business.trialEndsAt,
      subscriptionStatus: business.subscriptionStatus,
      needsPayment: true,
      message: 'Tu periodo de prueba ha expirado. Suscríbete para continuar',
      isLegacyUser: false,
    };
  } catch (error) {
    console.error('Error checking business access:', error);
    
    // En caso de error, dar acceso para no interrumpir el servicio
    return {
      hasAccess: true,
      status: 'legacy',
      daysRemaining: null,
      trialEndsAt: null,
      subscriptionStatus: null,
      needsPayment: false,
      message: 'Error verificando acceso - Acceso otorgado por seguridad',
      isLegacyUser: true,
    };
  }
}

/**
 * Verifica si un negocio debe mostrar banner de advertencia
 */
export async function shouldShowSubscriptionBanner(
  businessId: string
): Promise<boolean> {
  const access = await checkBusinessAccess(businessId);
  
  // Mostrar banner si:
  // - Está en trial y le quedan 7 días o menos
  // - Está en grace period
  // - Trial expirado
  return (
    (access.status === 'trialing' && access.daysRemaining !== null && access.daysRemaining <= 7) ||
    access.status === 'grace_period' ||
    access.status === 'expired'
  );
}
