// src/utils/redirect-helpers.ts

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'CLIENTE';

export interface BusinessInfo {
  id: string;
  name: string;
  subdomain: string;
  subscriptionPlan?: string; // Opcional para compatibilidad
}

/**
 * Genera la URL correcta con slug para un rol y business específico
 */
export function getRedirectUrl(role: UserRole, business: BusinessInfo): string {
  const slug = business.subdomain;
  
  const roleRoutes: Record<UserRole, string> = {
    SUPERADMIN: `/${slug}/superadmin`,
    ADMIN: `/${slug}/admin`,
    STAFF: `/${slug}/staff`,
    CLIENTE: `/${slug}/cliente`,
  };

  return roleRoutes[role] || `/${slug}/admin`;
}

/**
 * Valida que un business tenga la información necesaria para redirección
 */
export function validateBusinessForRedirect(business: any): business is BusinessInfo {
  return business && 
         typeof business.id === 'string' && 
         typeof business.subdomain === 'string' &&
         business.subdomain.length > 0;
}

/**
 * Helper para debugging de redirecciones
 */
export function logRedirect(from: string, to: string, role: UserRole, business: BusinessInfo) {
  console.log(`🔄 REDIRECT: ${from} -> ${to}`, {
    role,
    businessId: business.id,
    businessSlug: business.subdomain,
    timestamp: new Date().toISOString()
  });
}

/**
 * Función centralizada para manejar redirecciones de rol
 */
export function handleRoleRedirect(
  user: { 
    role: UserRole; 
    business: BusinessInfo | { 
      id: string; 
      name: string; 
      subdomain: string; 
      subscriptionPlan: string; 
    } 
  },
  router: { push: (url: string) => void },
  currentPath?: string
) {
  if (!validateBusinessForRedirect(user.business)) {
    console.error('❌ Business inválido para redirección:', user.business);
    router.push('/login');
    return;
  }

  const redirectUrl = getRedirectUrl(user.role, user.business as BusinessInfo);
  logRedirect(currentPath || 'unknown', redirectUrl, user.role, user.business as BusinessInfo);
  router.push(redirectUrl);
}
