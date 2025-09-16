'use client';

import React, { useState, useEffect } from 'react';
import { NavigationItem } from '../../types/api-routes';
import { useRequireAuth } from '../../hooks/useAuth';
import RoleSwitch from '../../components/RoleSwitch';
import {
  Home,
  Users,
  UtensilsCrossed,
  Smartphone,
  Settings,
  LogOut,
} from 'lucide-react';

// Importación de componentes modulares
import DashboardContent from './dashboard/DashboardContent';
import ClientesContent from './clientes/ClientesContent';
import MenuContent from './menu/MenuContent';
import PortalContent from './portal/PortalContent';
import ConfiguracionContent from './configuracion/ConfiguracionContent';

// Helper functions para business context
const getCurrentBusinessFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  // Si la URL es /[businessId]/admin, el businessId está en la primera posición
  if (pathSegments.length >= 2 && pathSegments[1] === 'admin') {
    return pathSegments[0];
  }
  return null;
};

const validateBusinessAccess = async (businessId: string) => {
  try {
    const response = await fetch(`/api/businesses/${businessId}/validate`);
    if (!response.ok) {
      throw new Error('Business validation failed');
    }
  } catch (error) {
    console.error('Error validating business access:', error);
    window.location.href = '/login?error=invalid-business&message=El negocio no es válido o no tienes acceso';
  }
};

// Tipos de sección admin
type AdminSection =
  | 'dashboard'
  | 'clientes'
  | 'menu'
  | 'portal'
  | 'configuracion';

// Tipo para notificaciones
type NivelTarjeta =
  | 'bronce'
  | 'plata'
  | 'oro'
  | 'platino'
  | 'diamante'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

// Props para AdminV2Page
interface AdminV2PageProps {
  businessId?: string; // Opcional para compatibilidad con rutas legacy
}

/**
 * Obtener clase de color de borde para notificaciones
 */
const getBorderColorClass = (type: NivelTarjeta): string => {
  switch (type) {
    case 'error':
      return 'border-red-500/30';
    case 'success':
      return 'border-green-500/30';
    case 'warning':
      return 'border-yellow-500/30';
    default:
      return 'border-blue-500/30';
  }
};

/**
 * Componente principal Admin V2 - Versión modular
 * Orquesta todos los componentes modulares extraídos del admin original
 * 
 * 🚀 TODO POST-LANZAMIENTO:
 * - Implementar routing completo con business context: /{businessId}/admin
 * - Actualizar middleware para extraer businessId dinámicamente  
 * - Activar verificación de email en signup/page.tsx línea 46
 * - Migrar de SQLite a PostgreSQL para producción
 */
export default function AdminV2Page({ businessId }: AdminV2PageProps = {}) {
  // � BUSINESS CONTEXT - Usar businessId de props o detectar desde URL
  const currentBusinessId = businessId || getCurrentBusinessFromUrl();
  
  // 🚫 VALIDACIÓN DE BUSINESS CONTEXT
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // Si no tenemos businessId y estamos en ruta legacy, redirigir
    if (!currentBusinessId && (currentPath === '/admin' || (currentPath.startsWith('/admin/') && !currentPath.includes('/business')))) {
      console.log('🚫 Admin: Sin business context, redirigiendo a login');
      
      const redirectUrl = '/login?error=no-business&message=No se pudo determinar el negocio. Inicia sesión nuevamente.';
      window.location.href = redirectUrl;
      return;
    }
    
    // Si tenemos businessId, validar que existe
    if (currentBusinessId) {
      validateBusinessAccess(currentBusinessId);
    }
  }, [currentBusinessId]);

  const { user, loading, logout, isAuthenticated } = useRequireAuth('ADMIN');
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  // Sistema de notificaciones
  const [notification, setNotification] = useState<{
    message: string;
    type: NivelTarjeta;
    show: boolean;
  }>({ message: '', type: 'info', show: false });

  const showNotification = (message: string, type: NivelTarjeta = 'info') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Mostrar loading mientras se verifica autenticación
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticación...</p>
        </div>
      </div>
    );
  }  // Elementos de navegación
  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'menu', label: 'Gestión de Menú', icon: UtensilsCrossed },
    { id: 'portal', label: 'Portal Cliente', icon: Smartphone },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar - Fijo */}
      <div className="w-64 bg-dark-900 border-r border-dark-700 fixed inset-y-0 left-0 z-10 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Lealta</h1>
              <p className="text-dark-400 text-xs">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map(item => {
              const isActive = activeSection === item.id;
              const IconComponent = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as AdminSection)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-dark-400 text-xs">Administrador</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {' '}
        {/* Agregamos margen izquierdo para compensar el sidebar fijo */}
        {/* Header */}
        <header className="bg-dark-900 border-b border-dark-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {navigationItems.find(item => item.id === activeSection)?.label}
              </h2>
              <p className="text-dark-400 text-sm">
                {user?.business?.name || 'Gestiona tu negocio desde aquí'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right mr-4">
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-dark-400 text-sm">{user?.email}</p>
              </div>
              <RoleSwitch
                currentRole={user?.role || 'ADMIN'}
                currentPath={businessId ? `/${businessId}/admin` : '/admin'}
                businessId={businessId}
              />
              <button
                onClick={logout}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </header>
        {/* Content Area - Renderización condicional de componentes modulares */}
        <main className="flex-1 p-6 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 overflow-auto">
          {activeSection === 'dashboard' && <DashboardContent />}
          {activeSection === 'clientes' && <ClientesContent />}
          {activeSection === 'menu' && <MenuContent />}
          {activeSection === 'portal' && (
            <PortalContent showNotification={showNotification} />
          )}
          {activeSection === 'configuracion' && <ConfiguracionContent />}
        </main>
        {/* Sistema de notificaciones mejorado */}
        {notification.show && (
          <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-full duration-300">
            <div
              className={`
                bg-dark-800/95 backdrop-blur-sm border rounded-xl p-4 max-w-sm shadow-2xl
                ${getBorderColorClass(notification.type)}
                ${notification.type === 'success' ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20' : ''}
                ${notification.type === 'error' ? 'bg-gradient-to-r from-red-900/20 to-rose-900/20' : ''}
                ${notification.type === 'warning' ? 'bg-gradient-to-r from-yellow-900/20 to-amber-900/20' : ''}
                ${notification.type === 'info' ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20' : ''}
              `}
            >
              <div className="flex items-start space-x-3">
                <div className={`
                  w-2 h-2 rounded-full mt-2 flex-shrink-0
                  ${notification.type === 'success' ? 'bg-green-400' : ''}
                  ${notification.type === 'error' ? 'bg-red-400' : ''}
                  ${notification.type === 'warning' ? 'bg-yellow-400' : ''}
                  ${notification.type === 'info' ? 'bg-blue-400' : ''}
                `} />
                <p className="text-white text-sm font-medium leading-relaxed">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
