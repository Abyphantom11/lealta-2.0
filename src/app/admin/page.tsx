'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '../../hooks/useAuth';
import RoleSwitch from '../../components/RoleSwitch';
import { 
  Users, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  Settings,
  Search,
  Filter,
  MoreVertical,
  Eye,
  LogOut,
  Menu,
  X,
  BarChart3,
  UtensilsCrossed,
  Smartphone,
  Home,
  ChevronRight,
  Plus
} from 'lucide-react';

type AdminSection = 'dashboard' | 'clientes' | 'menu' | 'portal' | 'analytics' | 'configuracion';

export default function AdminPage() {
  const { user, loading, logout, isAuthenticated } = useRequireAuth('ADMIN');
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalConsumos: 0,
    totalRevenue: 0,
    unpaidCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/cliente/lista');
        const data = await response.json();
        if (data.success) {
          setStats({
            totalClients: data.clientes.length,
            totalConsumos: 423,
            totalRevenue: 15678.50,
            unpaidCount: 12
          });
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // Fallback data
        setStats({
          totalClients: 0,
          totalConsumos: 423,
          totalRevenue: 15678.50,
          unpaidCount: 12
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

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'menu', label: 'Gestión de Menú', icon: UtensilsCrossed },
    { id: 'portal', label: 'Portal Cliente', icon: Smartphone },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-dark-900 border-r border-dark-700`}>
        <div className="p-4">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-white font-bold text-lg">Lealta</h1>
                <p className="text-dark-400 text-xs">Admin Panel</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as AdminSection)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30' 
                      : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 text-dark-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
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
                currentPath="/admin"
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

        {/* Content Area */}
        <main className="flex-1 p-6 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 overflow-auto">
          {activeSection === 'dashboard' && <DashboardContent stats={stats} />}
          {activeSection === 'clientes' && <ClientesContent />}
          {activeSection === 'menu' && <MenuContent />}
          {activeSection === 'portal' && <PortalContent />}
          {activeSection === 'analytics' && <AnalyticsContent />}
          {activeSection === 'configuracion' && <ConfiguracionContent />}
        </main>
      </div>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent({ stats }: Readonly<{ stats: any }>) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Clientes"
          value={stats.totalClients.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          gradient="from-primary-600 to-blue-600"
          change="+12%"
        />
        <StatsCard
          title="Consumos"
          value={stats.totalConsumos.toLocaleString()}
          icon={<Receipt className="w-6 h-6" />}
          gradient="from-purple-600 to-pink-600"
          change="+8%"
        />
        <StatsCard
          title="Ingresos"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          gradient="from-success-600 to-green-600"
          change="+15%"
        />
        <StatsCard
          title="Impagos"
          value={stats.unpaidCount.toString()}
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-warning-600 to-orange-600"
          change="-5%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="premium-card">
          <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {[
              { id: 'cliente', type: 'cliente', text: 'Nuevo cliente registrado: Juan Pérez', time: '2 min' },
              { id: 'consumo', type: 'consumo', text: 'Consumo registrado: $45.50', time: '5 min' },
              { id: 'pago', type: 'pago', text: 'Pago confirmado: María García', time: '8 min' },
              { id: 'promocion', type: 'promocion', text: 'Promoción vista 12 veces', time: '15 min' },
            ].map((activity) => {
              const getActivityColor = (type: string) => {
                if (type === 'cliente') return 'bg-primary-500';
                if (type === 'consumo') return 'bg-success-500';
                if (type === 'pago') return 'bg-green-500';
                return 'bg-purple-500';
              };

              return (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-dark-800/30 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${getActivityColor(activity.type)}`} />
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.text}</p>
                  </div>
                  <span className="text-dark-400 text-xs">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="premium-card">
          <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-primary-600/10 border border-primary-600/30 rounded-lg hover:bg-primary-600/20 transition-colors">
              <Plus className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <p className="text-white text-sm">Nuevo Cliente</p>
            </button>
            <button className="p-4 bg-purple-600/10 border border-purple-600/30 rounded-lg hover:bg-purple-600/20 transition-colors">
              <UtensilsCrossed className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-white text-sm">Añadir Producto</p>
            </button>
            <button className="p-4 bg-success-600/10 border border-success-600/30 rounded-lg hover:bg-success-600/20 transition-colors">
              <Smartphone className="w-6 h-6 text-success-400 mx-auto mb-2" />
              <p className="text-white text-sm">Nueva Promoción</p>
            </button>
            <button className="p-4 bg-warning-600/10 border border-warning-600/30 rounded-lg hover:bg-warning-600/20 transition-colors">
              <BarChart3 className="w-6 h-6 text-warning-400 mx-auto mb-2" />
              <p className="text-white text-sm">Ver Reportes</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Clientes Content Component
function ClientesContent() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch('/api/cliente/lista');
        const data = await response.json();
        if (data.success) {
          setClientes(data.clientes);
        }
      } catch (error) {
        console.error('Error cargando clientes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Gestión de Clientes</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white">Nuevo Cliente</span>
        </button>
      </div>

      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
              <input 
                type="text" 
                placeholder="Buscar clientes..."
                className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              />
            </div>
            <button className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors">
              <Filter className="w-4 h-4 text-dark-400" />
            </button>
          </div>
          <div className="text-dark-400 text-sm">
            {(() => {
              if (isLoading) return 'Cargando...';
              return `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`;
            })()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 text-dark-300 font-medium">Cliente</th>
                <th className="text-left py-3 text-dark-300 font-medium">Cédula</th>
                <th className="text-left py-3 text-dark-300 font-medium">Contacto</th>
                <th className="text-left py-3 text-dark-300 font-medium">Puntos</th>
                <th className="text-left py-3 text-dark-300 font-medium">Registro</th>
                <th className="text-left py-3 text-dark-300 font-medium">Estado</th>
                <th className="text-left py-3 text-dark-300 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (isLoading) {
                  return (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-dark-400">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                          <span>Cargando clientes...</span>
                        </div>
                      </td>
                    </tr>
                  );
                }
                
                if (clientes.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-dark-400">
                        No hay clientes registrados aún
                      </td>
                    </tr>
                  );
                }
                
                return clientes.map((client) => (
                  <tr key={client.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {client.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-white">{client.nombre}</span>
                      </div>
                    </td>
                    <td className="py-4 text-dark-300">{client.cedula}</td>
                    <td className="py-4">
                      <div className="text-dark-300 text-sm">
                        <div>{client.telefono}</div>
                        <div className="text-dark-500">{client.correo}</div>
                      </div>
                    </td>
                    <td className="py-4 text-success-400 font-semibold">{client.puntos} pts</td>
                    <td className="py-4 text-dark-300">
                      {new Date(client.registeredAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-success-500/20 text-success-400">
                        Activo
                      </span>
                    </td>
                    <td className="py-4">
                      <button className="p-1 hover:bg-dark-700 rounded">
                        <MoreVertical className="w-4 h-4 text-dark-400" />
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Menu Content Component
function MenuContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Gestión de Menú</h3>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white">Nueva Categoría</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white">Nuevo Producto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categorías */}
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Categorías</h4>
          <div className="space-y-2">
            {[
              { id: 'botellas', name: 'Botellas', count: 24, color: 'from-purple-600 to-pink-600' },
              { id: 'comidas', name: 'Comidas', count: 18, color: 'from-success-600 to-green-600' },
              { id: 'postres', name: 'Postres', count: 8, color: 'from-warning-600 to-orange-600' },
              { id: 'bebidas', name: 'Bebidas', count: 12, color: 'from-primary-600 to-blue-600' },
            ].map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg hover:bg-dark-800/50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${category.color}`} />
                  <span className="text-white">{category.name}</span>
                </div>
                <span className="text-dark-400 text-sm">{category.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Productos Destacados */}
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Productos Destacados</h4>
          <div className="space-y-3">
            {[
              { id: 'ron', name: 'Ron Barceló Imperial', category: 'Botellas', price: '$45', status: 'Disponible' },
              { id: 'paella', name: 'Paella Valenciana', category: 'Comidas', price: '$18', status: 'Disponible' },
              { id: 'mojito', name: 'Mojito Clásico', category: 'Bebidas', price: '$8', status: 'Agotado' },
            ].map((product) => (
              <div key={product.id} className="p-3 bg-dark-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{product.name}</span>
                  <span className="text-primary-400 font-semibold">{product.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-400 text-sm">{product.category}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.status === 'Disponible' 
                      ? 'bg-success-500/20 text-success-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {product.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats del Menú */}
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Estadísticas</h4>
          <div className="space-y-4">
            <div className="text-center p-4 bg-primary-600/10 rounded-lg">
              <p className="text-2xl font-bold text-primary-400">62</p>
              <p className="text-dark-300 text-sm">Total Productos</p>
            </div>
            <div className="text-center p-4 bg-success-600/10 rounded-lg">
              <p className="text-2xl font-bold text-success-400">58</p>
              <p className="text-dark-300 text-sm">Disponibles</p>
            </div>
            <div className="text-center p-4 bg-warning-600/10 rounded-lg">
              <p className="text-2xl font-bold text-warning-400">4</p>
              <p className="text-dark-300 text-sm">Agotados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Portal Content Component
function PortalContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Portal del Cliente</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
          <Eye className="w-4 h-4 text-white" />
          <span className="text-white">Vista Previa</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestión de Contenido */}
        <div className="space-y-6">
          <div className="premium-card">
            <h4 className="text-lg font-semibold text-white mb-4">Banners Principales</h4>
            <div className="space-y-3">
              {[
                { id: 'promo1', title: 'Promoción 2x1 Cócteles', status: 'Activo', views: 245 },
                { id: 'promo2', title: 'Nueva Carta de Vinos', status: 'Programado', views: 0 },
                { id: 'promo3', title: 'Happy Hour Viernes', status: 'Activo', views: 189 },
              ].map((banner) => (
                <div key={banner.id} className="p-3 bg-dark-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{banner.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      banner.status === 'Activo' 
                        ? 'bg-success-500/20 text-success-400' 
                        : 'bg-warning-500/20 text-warning-400'
                    }`}>
                      {banner.status}
                    </span>
                  </div>
                  <p className="text-dark-400 text-sm">{banner.views} visualizaciones</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-primary-400 hover:text-primary-300 transition-colors">
              + Agregar Banner
            </button>
          </div>

          <div className="premium-card">
            <h4 className="text-lg font-semibold text-white mb-4">Promociones del Día</h4>
            <div className="space-y-3">
              {[
                { id: 'descuento', name: 'Descuento 20% Paella', active: true },
                { id: 'mojito', name: 'Mojito + Tapa Gratis', active: true },
                { id: 'postre', name: 'Postre del Chef', active: false },
              ].map((promo) => (
                <div key={promo.id} className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg">
                  <span className="text-white">{promo.name}</span>
                  <button className={`w-12 h-6 rounded-full transition-colors ${
                    promo.active ? 'bg-success-600' : 'bg-dark-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      promo.active ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview del Portal */}
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Vista Previa - Portal Cliente</h4>
          <div className="bg-dark-800 rounded-lg p-4 aspect-[9/16] max-w-xs mx-auto border-2 border-dark-600">
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg p-4 mb-4">
              <h5 className="text-white font-bold">¡Bienvenido Juan!</h5>
              <p className="text-white/80 text-sm">Tus puntos: 150</p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-success-600/20 rounded-lg p-3">
                <p className="text-success-400 text-sm font-medium">Promoción 2x1 Cócteles</p>
              </div>
              
              <div className="bg-dark-700 rounded-lg p-3">
                <p className="text-white text-sm">Plato de la Semana</p>
                <p className="text-dark-400 text-xs">Paella Valenciana</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-dark-700 rounded-lg p-2 text-center">
                  <p className="text-white text-xs">Botellas</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-2 text-center">
                  <p className="text-white text-xs">Comidas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics Content Component
function AnalyticsContent() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Analytics y Reportes</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Productos Más Vendidos</h4>
          <div className="space-y-4">
            {[
              { id: 'mojito', name: 'Mojito Clásico', sales: 45, percentage: 85 },
              { id: 'paella', name: 'Paella Valenciana', sales: 32, percentage: 65 },
              { id: 'ron', name: 'Ron Barceló', sales: 28, percentage: 55 },
            ].map((product) => (
              <div key={product.id} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white text-sm">{product.name}</span>
                  <span className="text-dark-400 text-sm">{product.sales}</span>
                </div>
                <div className="w-full bg-dark-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-600 to-purple-600 h-2 rounded-full" 
                    style={{ width: `${product.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Actividad del Portal</h4>
          <div className="space-y-4">
            <div className="text-center p-4 bg-purple-600/10 rounded-lg">
              <p className="text-2xl font-bold text-purple-400">1,234</p>
              <p className="text-dark-300 text-sm">Vistas del Portal</p>
            </div>
            <div className="text-center p-4 bg-success-600/10 rounded-lg">
              <p className="text-2xl font-bold text-success-400">89%</p>
              <p className="text-dark-300 text-sm">Tasa de Interacción</p>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Tendencias</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg">
              <span className="text-white">Nuevos Registros</span>
              <span className="text-success-400">+23%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg">
              <span className="text-white">Engagement</span>
              <span className="text-success-400">+15%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg">
              <span className="text-white">Conversión</span>
              <span className="text-warning-400">-5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Configuracion Content Component
function ConfiguracionContent() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Configuración del Sistema</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Información del Negocio</h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="business-name" className="block text-dark-300 text-sm mb-2">Nombre del Negocio</label>
              <input 
                id="business-name"
                type="text" 
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Mi Restaurante"
              />
            </div>
            <div>
              <label htmlFor="business-address" className="block text-dark-300 text-sm mb-2">Dirección</label>
              <input 
                id="business-address"
                type="text" 
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Calle Principal #123"
              />
            </div>
            <div>
              <label htmlFor="business-phone" className="block text-dark-300 text-sm mb-2">Teléfono</label>
              <input 
                id="business-phone"
                type="text" 
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Configuración de Puntos</h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="points-per-dollar" className="block text-dark-300 text-sm mb-2">Puntos por Dólar</label>
              <input 
                id="points-per-dollar"
                type="number" 
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="1"
              />
            </div>
            <div>
              <label htmlFor="point-value" className="block text-dark-300 text-sm mb-2">Valor del Punto (USD)</label>
              <input 
                id="point-value"
                type="number" 
                step="0.01"
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="0.01"
              />
            </div>
            <div>
              <label htmlFor="welcome-points" className="block text-dark-300 text-sm mb-2">Puntos Bienvenida</label>
              <input 
                id="welcome-points"
                type="number" 
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="100"
              />
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Usuarios del Sistema</h4>
          <div className="space-y-3">
            {[
              { id: 'admin', name: 'Admin Principal', email: 'admin@restaurant.com', role: 'ADMIN' },
              { id: 'staff1', name: 'Staff 1', email: 'staff1@restaurant.com', role: 'STAFF' },
              { id: 'staff2', name: 'Staff 2', email: 'staff2@restaurant.com', role: 'STAFF' },
            ].map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-dark-400 text-sm">{user.email}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-primary-600/20 text-primary-400 rounded-full">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-primary-400 hover:text-primary-300 transition-colors">
            + Agregar Usuario
          </button>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Preferencias del Portal</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Registro automático</span>
              <button className="w-12 h-6 bg-success-600 rounded-full">
                <div className="w-5 h-5 bg-white rounded-full translate-x-6 transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Notificaciones push</span>
              <button className="w-12 h-6 bg-dark-600 rounded-full">
                <div className="w-5 h-5 bg-white rounded-full translate-x-0.5 transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Modo oscuro por defecto</span>
              <button className="w-12 h-6 bg-success-600 rounded-full">
                <div className="w-5 h-5 bg-white rounded-full translate-x-6 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, gradient, change }: Readonly<{
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  change: string;
}>) {
  return (
    <div className="premium-card">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className={`text-sm font-medium ${
          change.startsWith('+') ? 'text-success-400' : 'text-warning-400'
        }`}>
          {change}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-dark-400 text-sm">{title}</p>
      </div>
    </div>
  );
}
