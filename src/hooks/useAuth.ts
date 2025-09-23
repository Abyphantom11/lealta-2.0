import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateBusinessForRedirect, handleRoleRedirect } from '@/utils/redirect-helpers';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  businessId: string;
  business: {
    id: string;
    name: string;
    subdomain: string;
    subscriptionPlan: string;
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth(requiredRole?: UserRole) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 useAuth: Iniciando verificación de autenticación');
      
      // 🔥 VERIFICAR SI ESTAMOS EN UNA RUTA DE CLIENTE PÚBLICA
      const isClientPublicRoute = typeof window !== 'undefined' && 
        /^\/[a-zA-Z0-9_-]+\/cliente(\/|$)/.test(window.location.pathname);
        
      console.log('🔐 useAuth: Ruta cliente pública?', isClientPublicRoute);
      
      try {
        const response = await fetch('/api/auth/me');
      
      console.log('🔐 useAuth: Respuesta recibida:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        const userData = await response.json();
        
        console.log('🔐 useAuth: Datos de usuario:', {
          userId: userData.user?.id,
          role: userData.user?.role,
          businessId: userData.user?.businessId,
          businessSlug: userData.user?.business?.slug,
          requiredRole
        });

        // Verificar rol requerido
        if (requiredRole && userData.user.role !== requiredRole) {
          console.log('🔐 useAuth: Rol no coincide - verificando SUPERADMIN');
          
          // SUPERADMIN puede acceder a cualquier dashboard
          if (userData.user.role === 'SUPERADMIN') {
            console.log('✅ useAuth: Usuario es SUPERADMIN - acceso permitido');
            setAuthState({
              user: userData.user,
              loading: false,
              error: null,
            });
            return;
          }

          console.log('❌ useAuth: Usuario no es SUPERADMIN - redirigiendo');
          
          // ✅ Usar helper centralizado para redirecciones
          if (!validateBusinessForRedirect(userData.user.business)) {
            console.error('❌ useAuth: Business inválido para redirección');
            
            // 🔥 NO REDIRIGIR SI ESTAMOS EN RUTA DE CLIENTE PÚBLICA
            if (isClientPublicRoute) {
              console.log('ℹ️ useAuth: Business inválido en ruta cliente pública - no redireccionar');
              setAuthState({
                user: null,
                loading: false,
                error: null,
              });
              return;
            }
            
            router.push('/login');
            return;
          }

          handleRoleRedirect(
            userData.user,
            router,
            window.location.pathname
          );
          return;
        }

        console.log('✅ useAuth: Autenticación exitosa');
        setAuthState({
          user: userData.user,
          loading: false,
          error: null,
        });
      } else {
        console.log('❌ useAuth: No autenticado');
        
        // 🔥 NO REDIRIGIR SI ESTAMOS EN RUTA DE CLIENTE PÚBLICA
        if (isClientPublicRoute) {
          console.log('ℹ️ useAuth: Ruta cliente pública - no redireccionar');
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
          return;
        }
        
        console.log('🔄 useAuth: Redirigiendo a login');
        router.push('/login');
      }
    } catch (error) {
      console.error('💥 useAuth: Error durante verificación:', error);
      
      // 🔥 NO REDIRIGIR SI ESTAMOS EN RUTA DE CLIENTE PÚBLICA
      if (isClientPublicRoute) {
        console.log('ℹ️ useAuth: Error en ruta cliente pública - no redireccionar');
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
        return;
      }
      
      setAuthState({
        user: null,
        loading: false,
        error: 'Error verificando autenticación',
      });
      router.push('/login');
    }
    };

    checkAuth();
  }, [requiredRole, router]);

  const checkAuth = async () => {
    // La implementación ya está en el useEffect
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Forzar logout local aunque falle el servidor
      router.push('/login');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!authState.user) return false;

    const rolePermissions: Record<string, string[]> = {
      SUPERADMIN: [
        'business.manage',
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'locations.manage',
        'clients.manage',
        'consumos.manage',
        'reports.view',
        'settings.manage',
        'billing.manage',
      ],
      ADMIN: [
        'users.create',
        'users.read',
        'users.update',
        'clients.manage',
        'consumos.manage',
        'reports.view',
        'locations.read',
      ],
      STAFF: [
        'clients.read',
        'clients.create',
        'consumos.create',
        'consumos.read',
      ],
    };

    return rolePermissions[authState.user.role]?.includes(permission) || false;
  };

  const canManageRole = (targetRole: UserRole): boolean => {
    if (!authState.user) return false;

    const hierarchy: Record<string, string[]> = {
      SUPERADMIN: ['ADMIN', 'STAFF'],
      ADMIN: ['STAFF'],
      STAFF: [],
    };

    return hierarchy[authState.user.role]?.includes(targetRole) || false;
  };

  return {
    ...authState,
    logout,
    hasPermission,
    canManageRole,
    checkAuth,
  };
}

// Hook específico para componentes que requieren autenticación
export function useRequireAuth(requiredRole?: UserRole) {
  const auth = useAuth(requiredRole);

  // 🎯 LOG REDUCIDO: Solo mostrar en cambios críticos, no en cada render
  const shouldLog = !auth.loading && (!!auth.error || !auth.user);
  if (shouldLog) {
    console.log('🔒 useRequireAuth:', { 
      hasUser: !!auth.user, 
      role: auth.user?.role,
      error: auth.error 
    });
  }

  // Mostrar loading mientras se verifica
  if (auth.loading) {
    return {
      ...auth,
      isAuthenticated: false,
    };
  }

  // ✅ Autenticación completada, log removido para reducir spam

  // Si no hay usuario, el hook ya redirigió
  return {
    ...auth,
    isAuthenticated: !!auth.user,
  };
}
