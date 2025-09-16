import { useAuth } from './useAuth';

/**
 * Hook que obtiene automáticamente el business del usuario autenticado
 * Simplificado porque el user ya incluye la información del business
 */
export function useUserBusiness() {
  const { user, loading, error } = useAuth();

  // El business ya viene incluido en el user object
  const business = user?.business || null;
  const isAuthenticated = !!user;

  return {
    business,
    businessLoading: loading,
    error: error || (!business && !loading ? 'Usuario sin business asignado' : null),
    isAuthenticated,
    user
  };
}
