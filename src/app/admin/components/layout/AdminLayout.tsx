'use client';

import React from 'react';
import { AdminProvider } from '../../contexts';
import { MenuPanel, ClientesPanel, StatsPanel, ConfigPanel } from '../panels';
import { useMenu } from '../../hooks/useMenu';
import { useClients } from '../../hooks/useClients';
import { useStats } from '../../hooks/useStats';
import { useConfig } from '../../hooks/useConfig';

interface AdminLayoutProps {
  children?: React.ReactNode;
  activeTab?: string;
}

export const AdminLayout: React.FC<Readonly<AdminLayoutProps>> = ({
  children,
  activeTab = 'dashboard',
}) => {
  const [currentTab, setCurrentTab] = React.useState<string>(activeTab);

  // Inicializar hooks para pasar a los paneles
  const menuContext = useMenu();
  const clientesContext = useClients();
  const statsContext = useStats();
  const configContext = useConfig();

  // Renderizar contenido basado en la pestaña activa
  const renderContent = () => {
    if (children) {
      return children;
    }

    switch (currentTab) {
      case 'menu':
        return <MenuPanel menuContext={menuContext} />;
      case 'clientes':
        return <ClientesPanel clientesContext={clientesContext} />;
      case 'estadisticas':
        return <StatsPanel statsContext={statsContext} />;
      case 'config':
        return <ConfigPanel configContext={configContext} />;
      case 'dashboard':
      default:
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Panel de Control</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-blue-700">
                  Total Clientes
                </h3>
                <p className="text-3xl font-bold">
                  {statsContext.stats?.totalClients || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-green-700">
                  Ingresos Totales
                </h3>
                <p className="text-3xl font-bold">
                  ${statsContext.stats?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-yellow-700">
                  Consumos
                </h3>
                <p className="text-3xl font-bold">
                  {statsContext.stats?.totalConsumos || 0}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-red-700">
                  Pendientes de Pago
                </h3>
                <p className="text-3xl font-bold">
                  {statsContext.stats?.unpaidCount || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">
                  Últimas Actividades
                </h3>
                <div className="space-y-4">
                  <p className="text-gray-600">No hay actividades recientes</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCurrentTab('clientes')}
                    className="p-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Nuevo Cliente
                  </button>
                  <button
                    onClick={() => setCurrentTab('menu')}
                    className="p-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Nuevo Producto
                  </button>
                  <button
                    onClick={() => setCurrentTab('estadisticas')}
                    className="p-4 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    Ver Estadísticas
                  </button>
                  <button
                    onClick={() => setCurrentTab('config')}
                    className="p-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    Configuración
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <AdminProvider>
      <div className="flex flex-col h-screen">
        {/* Barra superior */}
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <div className="flex items-center space-x-4">
              <span>Usuario Administrador</span>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Barra lateral */}
          <aside className="bg-gray-800 text-white w-64 p-6 overflow-y-auto">
            <nav>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`w-full text-left px-4 py-2 rounded transition-colors ${
                      currentTab === 'dashboard'
                        ? 'bg-blue-600'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    Panel de Control
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentTab('menu')}
                    className={`w-full text-left px-4 py-2 rounded transition-colors ${
                      currentTab === 'menu'
                        ? 'bg-blue-600'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    Gestión de Menú
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentTab('clientes')}
                    className={`w-full text-left px-4 py-2 rounded transition-colors ${
                      currentTab === 'clientes'
                        ? 'bg-blue-600'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    Gestión de Clientes
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentTab('tarjetas')}
                    className={`w-full text-left px-4 py-2 rounded transition-colors ${
                      currentTab === 'tarjetas'
                        ? 'bg-blue-600'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    Tarjetas de Fidelidad
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentTab('estadisticas')}
                    className={`w-full text-left px-4 py-2 rounded transition-colors ${
                      currentTab === 'estadisticas'
                        ? 'bg-blue-600'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    Estadísticas
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentTab('config')}
                    className={`w-full text-left px-4 py-2 rounded transition-colors ${
                      currentTab === 'config'
                        ? 'bg-blue-600'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    Configuración
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
            {renderContent()}
          </main>
        </div>
      </div>
    </AdminProvider>
  );
};
