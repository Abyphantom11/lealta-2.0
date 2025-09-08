'use client';

import React, { useState, useEffect } from 'react';
import { NavigationItem } from '../../types/api-routes';
import { useRequireAuth } from '../../hooks/useAuth';
import RoleSwitch from '../../components/RoleSwitch';
import { StatsData } from '../../types/admin';
import { Home, Users, UtensilsCrossed, Smartphone, BarChart3, Settings, LogOut } from 'lucide-react';

// Importación de componentes modulares
import DashboardContent from './dashboard/DashboardContent';
import ClientesContent from './clientes/ClientesContent';
import MenuContent from './menu/MenuContent';
import PortalContent from './portal/PortalContent';
import AnalyticsContent from './analytics/AnalyticsContent';
import ConfiguracionContent from './configuracion/ConfiguracionContent';

// Tipos de sección admin
type AdminSection = 'dashboard' | 'clientes' | 'menu' | 'portal' | 'analytics' | 'configuracion';

// Tipo para notificaciones
type NivelTarjeta = 'bronce' | 'plata' | 'oro' | 'platino' | 'diamante' | 'info' | 'success' | 'warning' | 'error';

/**
 * Obtener clase de color de borde para notificaciones
 */
const getBorderColorClass = (type: NivelTarjeta): string => {
  switch (type) {
    case 'error':
      return 'border-red-500';
    case 'success':
      return 'border-green-500';
    case 'warning':
      return 'border-yellow-500';
    default:
      return 'border-blue-500';
  }
};

/**
 * Componente principal Admin V2 - Versión modular
 * Orquesta todos los componentes modulares extraídos del admin original
 */
export default function AdminV2Page() {
  const { user, loading, logout, isAuthenticated } = useRequireAuth('ADMIN');
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [stats, setStats] = useState<StatsData>({
    totalClients: 0,
    totalConsumos: 0,
    totalRevenue: 0,
    unpaidCount: 0,
  });

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

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { robustGet } = await import('../../lib/robust-fetch');
        const response = await robustGet('/api/cliente/lista', { timeout: 8000 });
        const data = await response.json();
        if (data.success) {
          setStats({
            totalClients: data.clientes.length,
            totalConsumos: 423,
            totalRevenue: 15678.5,
            unpaidCount: 12,
          });
        }
      } catch (error) {
        // En desarrollo, mostrar error en consola
        if (process.env.NODE_ENV === 'development') {
          console.error('Error cargando estadísticas:', error);
        }
        // Fallback data
        setStats({
          totalClients: 0,
          totalConsumos: 423,
          totalRevenue: 15678.5,
          unpaidCount: 12,
        });
      }
    };

    fetchStats();
  }, []);

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
  }

  // Elementos de navegación
  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'menu', label: 'Gestión de Menú', icon: UtensilsCrossed },
    { id: 'portal', label: 'Portal Cliente', icon: Smartphone },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <div className="w-64 bg-dark-900 border-r border-dark-700">
        <div className="p-4">
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
            {navigationItems.map((item) => {
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{user?.name || 'Usuario'}</p>
              <p className="text-dark-400 text-xs">Administrador</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
                currentPath="/admin-v2"
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
          {activeSection === 'dashboard' && <DashboardContent stats={stats} />}
          {activeSection === 'clientes' && <ClientesContent />}
          {activeSection === 'menu' && <MenuContent />}
          {activeSection === 'portal' && (
            <PortalContent showNotification={showNotification} />
          )}
          {activeSection === 'analytics' && <AnalyticsContent />}
          {activeSection === 'configuracion' && <ConfiguracionContent />}
        </main>

        {/* Sistema de notificaciones */}
        {notification.show && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`premium-card p-4 max-w-sm ${
                getBorderColorClass(notification.type)
              }`}
            >
              <p className="text-white">{notification.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}