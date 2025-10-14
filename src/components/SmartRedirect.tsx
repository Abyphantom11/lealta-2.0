'use client';

import { useEffect, useState } from 'react';
import { useUserBusiness } from '../hooks/useUserBusiness';
import { motion } from './motion';
import { Shield, LogIn, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface SmartRedirectProps {
  targetPath: string; // '/admin', '/staff', '/superadmin', etc.
  legacyRoute?: string; // La ruta legacy original para debugging
}

/**
 * Componente inteligente que maneja redirecciones basadas en autenticación
 * 1. Si hay usuario autenticado → Redirige a su business + targetPath
 * 2. Si no hay usuario → Redirige a login
 * 3. Solo muestra selección manual como último recurso
 */
export default function SmartRedirect({ targetPath, legacyRoute }: SmartRedirectProps) {
  const { business, businessLoading, isAuthenticated, user, error } = useUserBusiness();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (businessLoading) return; // Esperar a que termine la carga

    // Caso 1: Usuario no autenticado → Redirigir a login
    if (!isAuthenticated || !user) {
      // console.log('🔒 Usuario no autenticado, redirigiendo a login');
      setRedirecting(true);
      
      const loginUrl = new URL('/login', window.location.origin);
      if (legacyRoute) {
        loginUrl.searchParams.set('redirect', legacyRoute);
        loginUrl.searchParams.set('reason', 'auth-required');
      }
      
      window.location.href = loginUrl.toString();
      return;
    }

    // Caso 2: Usuario autenticado con business → Redirigir automáticamente
    if (business?.subdomain) {
      // console.log(`✅ Usuario autenticado con business: ${business.subdomain}, redirigiendo a /${business.subdomain}${targetPath}`);
      setRedirecting(true);
      
      const targetUrl = `/${business.subdomain}${targetPath}`;
      window.location.href = targetUrl;
      return;
    }

    // Caso 3: Error o usuario sin business → Mostrar error/fallback
    console.warn('⚠️ Usuario autenticado pero sin business válido:', { user, business, error });
  }, [business, businessLoading, isAuthenticated, user, error, targetPath, legacyRoute]);

  // Loading state durante verificación
  if (businessLoading || redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {redirecting ? 'Redirigiendo...' : 'Verificando acceso...'}
          </h2>
          <p className="text-gray-600 text-sm">
            {redirecting 
              ? `Te llevamos a ${targetPath.replace('/', '')} automáticamente`
              : 'Validando tu sesión y permisos'
            }
          </p>
        </motion.div>
      </div>
    );
  }

  // Estado de error - Usuario autenticado pero sin business
  if (isAuthenticated && !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
        >
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error de Configuración
          </h2>
          <p className="text-gray-600 mb-6">
            Tu cuenta está autenticada pero no tienes un negocio asignado. 
            Contacta al administrador del sistema.
          </p>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Usuario: {user?.email}<br/>
              Error: {error || 'Business no encontrado'}
            </p>
            <Link
              href="/logout"
              className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Cerrar Sesión y Reportar
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallback - no debería llegar aquí normalmente
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
      >
        <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Estado Desconocido
        </h2>
        <p className="text-gray-600 mb-6">
          Hay un problema con el estado de tu sesión.
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
          >
            Recargar Página
          </button>
        </div>
      </motion.div>
    </div>
  );
}
