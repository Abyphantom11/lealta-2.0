import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    error: null
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const userData = await response.json();
        
        // Verificar rol requerido
        if (requiredRole && userData.user.role !== requiredRole) {
          // SUPERADMIN puede acceder a cualquier dashboard
          if (userData.user.role === 'SUPERADMIN') {
            setAuthState({
              user: userData.user,
              loading: false,
              error: null
            });
            return;
          }
          
          // Para otros roles, redirigir al dashboard apropiado
          const roleRedirect: Record<string, string> = {
            ADMIN: '/admin',
            STAFF: '/staff'
          };
          
          router.push(roleRedirect[userData.user.role] || '/login');
          return;
        }
        
        setAuthState({
          user: userData.user,
          loading: false,
          error: null
        });
      } else {
        // No autenticado, redirigir a login
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        user: null,
        loading: false,
        error: 'Error verificando autenticación'
      });
      router.push('/login');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setAuthState({
        user: null,
        loading: false,
        error: null
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
        'billing.manage'
      ],
      ADMIN: [
        'users.create',
        'users.read',
        'users.update',
        'clients.manage',
        'consumos.manage',
        'reports.view',
        'locations.read'
      ],
      STAFF: [
        'clients.read',
        'clients.create',
        'consumos.create',
        'consumos.read'
      ]
    };

    return rolePermissions[authState.user.role]?.includes(permission) || false;
  };

  const canManageRole = (targetRole: UserRole): boolean => {
    if (!authState.user) return false;
    
    const hierarchy: Record<string, string[]> = {
      SUPERADMIN: ['ADMIN', 'STAFF'],
      ADMIN: ['STAFF'],
      STAFF: []
    };
    
    return hierarchy[authState.user.role]?.includes(targetRole) || false;
  };

  return {
    ...authState,
    logout,
    hasPermission,
    canManageRole,
    checkAuth
  };
}

// Hook específico para componentes que requieren autenticación
export function useRequireAuth(requiredRole?: UserRole) {
  const auth = useAuth(requiredRole);
  
  // Mostrar loading mientras se verifica
  if (auth.loading) {
    return {
      ...auth,
      isAuthenticated: false
    };
  }
  
  // Si no hay usuario, el hook ya redirigió
  return {
    ...auth,
    isAuthenticated: !!auth.user
  };
}
