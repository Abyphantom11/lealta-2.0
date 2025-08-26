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
  EyeOff,
  LogOut,
  Menu,
  X,
  BarChart3,
  UtensilsCrossed,
  Smartphone,
  Home,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Gift,
  Save,
  Coffee
} from 'lucide-react';

// Hook personalizado para manejar carga de archivos
const useFileUpload = (setFormData: (updater: (prev: any) => any) => void) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Crear preview URL para mostrar la imagen
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, imagenUrl: previewUrl }));
    }
  };

  const resetFile = () => {
    setSelectedFile(null);
  };

  return { selectedFile, handleFileChange, resetFile };
};

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
  const [activeTab, setActiveTab] = useState<'categorias' | 'productos' | 'preview'>('preview');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para modales
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch('/api/admin/menu?businessId=business_1');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.menu || []);
        }

        // Fetch products
        const productsResponse = await fetch('/api/admin/menu/productos?businessId=business_1');
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.productos || []);
        }
      } catch (error) {
        console.error('Error fetching menu data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleCategoryStatus = async (categoryId: string) => {
    const category = categories.find((c: any) => c.id === categoryId);
    if (!category) return;

    try {
      const response = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: categoryId,
          activo: !category.activo
        })
      });

      if (response.ok) {
        setCategories(prev => prev.map((c: any) => 
          c.id === categoryId ? { ...c, activo: !c.activo } : c
        ));
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const toggleProductStatus = async (productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;

    try {
      const response = await fetch('/api/admin/menu/productos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          disponible: !product.disponible
        })
      });

      if (response.ok) {
        setProducts(prev => prev.map((p: any) => 
          p.id === productId ? { ...p, disponible: !p.disponible } : p
        ));
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-dark-400">Cargando información del menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Gestión de Menú</h3>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-dark-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'preview' 
              ? 'bg-green-600 text-white shadow-sm' 
              : 'text-dark-300 hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Vista Previa
        </button>
        <button
          onClick={() => setActiveTab('categorias')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'categorias' 
              ? 'bg-primary-600 text-white shadow-sm' 
              : 'text-dark-300 hover:text-white'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 inline mr-2" />
          Categorías ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('productos')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'productos' 
              ? 'bg-primary-600 text-white shadow-sm' 
              : 'text-dark-300 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Productos ({products.length})
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categorias' && (
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white">Categorías del Menú</h4>
            <button 
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-success-600 hover:bg-success-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white">Nueva Categoría</span>
            </button>
          </div>
          
          {categories.length === 0 ? (
            <div className="text-center text-dark-400 py-12">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-dark-500" />
              <p>No hay categorías creadas</p>
              <p className="text-sm">Comienza creando tu primera categoría</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Categorías principales */}
              {categories.filter(cat => !cat.parentId).map((category: any) => (
                <div key={category.id}>
                  {/* Categoría principal */}
                  <div className="bg-dark-800/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="text-lg font-medium text-white">{category.nombre}</h5>
                        <p className="text-dark-300 text-sm mt-1">{category.descripcion}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            category.activo ? 'bg-success-500/20 text-success-400' : 'bg-dark-600 text-dark-400'
                          }`}>
                            {category.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="text-xs text-dark-400">Orden: {category.orden}</span>
                          <span className="text-xs text-primary-400">Categoría Principal</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCategoryStatus(category.id)}
                          className={`p-2 rounded-md ${
                            category.activo
                              ? 'text-success-400 hover:text-success-300 hover:bg-success-500/10'
                              : 'text-dark-400 hover:text-dark-300 hover:bg-dark-600'
                          }`}
                        >
                          {category.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingCategory(category);
                            setShowCategoryModal(true);
                          }}
                          className="text-primary-400 hover:text-primary-300 p-2 rounded-md hover:bg-primary-500/10">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subcategorías */}
                  {categories.filter(subcat => subcat.parentId === category.id).length > 0 && (
                    <div className="ml-8 mt-2 space-y-2">
                      {categories.filter(subcat => subcat.parentId === category.id).map((subcategory: any) => (
                        <div key={subcategory.id} className="bg-dark-700/30 rounded-lg p-3 border-l-4 border-primary-500">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h6 className="text-md font-medium text-white">{subcategory.nombre}</h6>
                              <p className="text-dark-300 text-sm mt-1">{subcategory.descripcion}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                  subcategory.activo ? 'bg-success-500/20 text-success-400' : 'bg-dark-600 text-dark-400'
                                }`}>
                                  {subcategory.activo ? 'Activo' : 'Inactivo'}
                                </span>
                                <span className="text-xs text-dark-400">Orden: {subcategory.orden}</span>
                                <span className="text-xs text-yellow-400">Subcategoría</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleCategoryStatus(subcategory.id)}
                                className={`p-2 rounded-md ${
                                  subcategory.activo
                                    ? 'text-success-400 hover:text-success-300 hover:bg-success-500/10'
                                    : 'text-dark-400 hover:text-dark-300 hover:bg-dark-600'
                                }`}
                              >
                                {subcategory.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingCategory(subcategory);
                                  setShowCategoryModal(true);
                                }}
                                className="text-primary-400 hover:text-primary-300 p-2 rounded-md hover:bg-primary-500/10">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'productos' && (
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">Productos del Menú</h4>
            <button 
              onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-success-600 hover:bg-success-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white">Nuevo Producto</span>
            </button>
          </div>
          
          {products.length === 0 ? (
            <div className="text-center text-dark-400 py-12">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-dark-500" />
              <p>No hay productos creados</p>
              <p className="text-sm">Comienza agregando productos a tu menú</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: any) => {
                const category = categories.find((c: any) => c.id === product.categoryId);
                return (
                  <div key={product.id} className="bg-dark-800/30 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h6 className="font-medium text-white">{product.nombre}</h6>
                        <p className="text-dark-300 text-sm mt-1">{product.descripcion}</p>
                        {category && (
                          <span className="inline-block px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full mt-2">
                            {category.nombre}
                          </span>
                        )}
                      </div>
                      {product.imagen && (
                        <div className="w-12 h-12 bg-dark-700 rounded-lg flex items-center justify-center ml-3">
                          <span className="text-dark-400 text-xs">IMG</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {product.precioVaso && (
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-300">Vaso:</span>
                          <span className="font-medium text-primary-400">${product.precioVaso}</span>
                        </div>
                      )}
                      {product.precioBotella && (
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-300">Botella:</span>
                          <span className="font-medium text-primary-400">${product.precioBotella}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        product.disponible ? 'bg-success-500/20 text-success-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.disponible ? 'Disponible' : 'No disponible'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleProductStatus(product.id)}
                          className={`p-1 rounded ${
                            product.disponible
                              ? 'text-success-400 hover:bg-success-500/10'
                              : 'text-dark-400 hover:bg-dark-600'
                          }`}
                        >
                          {product.disponible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductModal(true);
                          }}
                          className="text-primary-400 hover:bg-primary-500/10 p-1 rounded">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="text-red-400 hover:bg-red-500/10 p-1 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Vista Previa Tab */}
      {activeTab === 'preview' && (
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white">Vista Previa del Menú</h4>
            <div className="flex items-center space-x-2 text-sm text-dark-400">
              <Smartphone className="w-4 h-4" />
              <span>Vista del Cliente</span>
            </div>
          </div>
          
          <MenuPreview categories={categories} products={products} />
        </div>
      )}

      {/* Modal para crear/editar categoría */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onSave={async (categoryData) => {
            try {
              setIsLoading(true);
              const method = editingCategory ? 'PUT' : 'POST';
              const body = editingCategory 
                ? { ...categoryData, id: editingCategory.id }
                : { ...categoryData, businessId: 'business_1' };

              const response = await fetch('/api/admin/menu', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });

              if (response.ok) {
                setShowCategoryModal(false);
                setEditingCategory(null);
                
                // Refrescar categorías
                const categoriesResponse = await fetch('/api/admin/menu?businessId=business_1');
                if (categoriesResponse.ok) {
                  const categoriesData = await categoriesResponse.json();
                  setCategories(categoriesData.menu || []);
                }
              } else {
                console.error('Error saving category');
              }
            } catch (error) {
              console.error('Error:', error);
            } finally {
              setIsLoading(false);
            }
          }}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Modal para crear/editar producto */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={async (productData) => {
            try {
              setIsLoading(true);
              
              // Validar que no existe un producto con el mismo nombre en la misma categoría
              const existingProduct = products.find(p => 
                p.categoryId === productData.categoryId && 
                p.nombre.toLowerCase() === productData.nombre.toLowerCase() &&
                (!editingProduct || p.id !== editingProduct.id)
              );
              
              if (existingProduct) {
                alert('Ya existe un producto con ese nombre en esta categoría. Por favor elige otro nombre.');
                setIsLoading(false);
                return;
              }

              const method = editingProduct ? 'PUT' : 'POST';
              const body = editingProduct 
                ? { ...productData, id: editingProduct.id }
                : productData;

              const response = await fetch('/api/admin/menu/productos', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });

              if (response.ok) {
                setShowProductModal(false);
                setEditingProduct(null);
                
                // Refrescar productos
                const productsResponse = await fetch('/api/admin/menu/productos?businessId=business_1');
                if (productsResponse.ok) {
                  const productsData = await productsResponse.json();
                  setProducts(productsData.productos || []);
                } else {
                  console.error('Error refrescando productos');
                }
              } else {
                const errorData = await response.json();
                alert(`Error guardando producto: ${errorData.error || 'Error desconocido'}`);
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Error de conexión al guardar el producto');
            } finally {
              setIsLoading(false);
            }
          }}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// Componente de Vista Previa del Menú
function MenuPreview({ categories, products }: { readonly categories: any[], readonly products: any[] }) {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  const activeCategories = categories.filter(cat => cat.activo && !cat.parentId); // Solo categorías principales activas
  const availableProducts = products.filter(prod => prod.disponible);
  
  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId && cat.activo);
  };
  
  const getProductsForCategory = (categoryId: string) => {
    return availableProducts.filter(product => product.categoryId === categoryId);
  };
  
  return (
    <div className="bg-black rounded-xl p-6 max-w-md mx-auto text-white" style={{ minHeight: '600px' }}>
      {/* Header del menú */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Nuestro Menú</h1>
        <p className="text-gray-400 text-sm">Vista previa del menú del cliente</p>
      </div>

      {/* Categorías */}
      {activeCategories.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p>No hay categorías activas</p>
          <p className="text-sm">Crea categorías para mostrar el menú</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Lista de categorías */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {activeCategories.map((category: any) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory?.id === category.id ? null : category)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedCategory?.id === category.id
                    ? 'bg-primary-600 border-primary-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-medium">{category.nombre}</div>
                  <div className="text-xs mt-1 opacity-75">{category.descripcion}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Productos de la categoría seleccionada */}
          {selectedCategory && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-3">
                {selectedCategory.nombre}
              </h3>
              
              {/* Subcategorías si existen */}
              {getSubcategories(selectedCategory.id).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-medium text-gray-300 mb-2">Subcategorías:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {getSubcategories(selectedCategory.id).map((subcategory: any) => (
                      <div key={subcategory.id} className="bg-gray-700 rounded-lg p-3">
                        <h5 className="font-medium text-white mb-2">{subcategory.nombre}</h5>
                        
                        {/* Productos de la subcategoría */}
                        <div className="space-y-2">
                          {getProductsForCategory(subcategory.id).map((product: any) => (
                            <div key={product.id} className="bg-gray-600 rounded-md p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h6 className="font-medium text-white text-sm">{product.nombre}</h6>
                                  {product.descripcion && (
                                    <p className="text-gray-300 text-xs mt-1">{product.descripcion}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  {product.precio && (
                                    <div className="text-primary-400 font-bold text-sm">
                                      ${product.precio.toFixed(2)}
                                    </div>
                                  )}
                                  {product.precioVaso && (
                                    <div className="text-primary-400 font-bold text-xs">
                                      Vaso: ${product.precioVaso.toFixed(2)}
                                    </div>
                                  )}
                                  {product.precioBotella && (
                                    <div className="text-primary-400 font-bold text-xs">
                                      Botella: ${product.precioBotella.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {getProductsForCategory(subcategory.id).length === 0 && (
                            <div className="text-center text-gray-400 py-4">
                              <p className="text-xs">No hay productos en esta subcategoría</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Productos directos de la categoría principal */}
              {getProductsForCategory(selectedCategory.id).map((product: any) => (
                <div key={product.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{product.nombre}</h4>
                      {product.descripcion && (
                        <p className="text-gray-400 text-sm mt-1">{product.descripcion}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {product.precio && (
                        <div className="text-primary-400 font-bold">
                          ${product.precio.toFixed(2)}
                        </div>
                      )}
                      {product.precioVaso && (
                        <div className="text-primary-400 font-bold text-sm">
                          Vaso: ${product.precioVaso.toFixed(2)}
                        </div>
                      )}
                      {product.precioBotella && (
                        <div className="text-primary-400 font-bold text-sm">
                          Botella: ${product.precioBotella.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {getProductsForCategory(selectedCategory.id).length === 0 && getSubcategories(selectedCategory.id).length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Coffee className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <p className="text-sm">No hay productos ni subcategorías en esta categoría</p>
                </div>
              )}
            </div>
          )}

          {!selectedCategory && (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">Selecciona una categoría para ver los productos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Modal para crear/editar categorías
function CategoryModal({ category, onSave, onClose }: Readonly<{
  category: any;
  onSave: (data: any) => void;
  onClose: () => void;
}>) {
  const [formData, setFormData] = useState({
    nombre: category?.nombre || '',
    descripcion: category?.descripcion || '',
    orden: category?.orden || 0,
    activo: category?.activo ?? true,
    icono: category?.icono || '',
    parentId: category?.parentId || ''
  });

  const [categories, setCategories] = useState<any[]>([]);

  // Cargar categorías para el selector de categoría padre
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/menu?businessId=business_1');
        if (response.ok) {
          const data = await response.json();
          // Filtrar categorías que no sean subcategorías y que no sea la categoría actual (para evitar auto-referencia)
          const parentCategories = (data.menu || []).filter((cat: any) => 
            !cat.parentId && (!category || cat.id !== category.id)
          );
          setCategories(parentCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4 relative z-10">
        <h3 className="text-lg font-semibold text-white mb-4">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category-parent" className="block text-sm font-medium text-dark-300 mb-2">
              Categoría Padre (opcional)
            </label>
            <select
              id="category-parent"
              value={formData.parentId}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
            >
              <option value="">Categoría principal</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category-nombre" className="block text-sm font-medium text-dark-300 mb-2">
              Nombre
            </label>
            <input
              id="category-nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="category-descripcion" className="block text-sm font-medium text-dark-300 mb-2">
              Descripción
            </label>
            <textarea
              id="category-descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="category-orden" className="block text-sm font-medium text-dark-300 mb-2">
              Orden
            </label>
            <input
              id="category-orden"
              type="number"
              value={formData.orden}
              onChange={(e) => setFormData(prev => ({ ...prev, orden: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="activo" className="text-sm text-dark-300">
              Categoría activa
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              {category ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para crear/editar productos
function ProductModal({ product, categories, onSave, onClose }: Readonly<{
  product: any;
  categories: any[];
  onSave: (data: any) => void;
  onClose: () => void;
}>) {
  const [formData, setFormData] = useState({
    nombre: product?.nombre || '',
    descripcion: product?.descripcion || '',
    categoryId: product?.categoryId || '',
    precio: product?.precio || '',
    precioVaso: product?.precioVaso || '',
    precioBotella: product?.precioBotella || '',
    tipoProducto: product?.tipoProducto || 'simple',
    disponible: product?.disponible ?? true,
    destacado: product?.destacado ?? false,
    imagenUrl: product?.imagenUrl || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto relative z-10">
        <h3 className="text-lg font-semibold text-white mb-4">
          {product ? 'Editar Producto' : 'Nuevo Producto'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="product-categoria" className="block text-sm font-medium text-dark-300 mb-2">
              Categoría
            </label>
            <select
              id="product-categoria"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="product-nombre" className="block text-sm font-medium text-dark-300 mb-2">
              Nombre
            </label>
            <input
              id="product-nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="product-descripcion" className="block text-sm font-medium text-dark-300 mb-2">
              Descripción
            </label>
            <textarea
              id="product-descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="product-tipo" className="block text-sm font-medium text-dark-300 mb-2">
              Tipo de Producto
            </label>
            <select
              id="product-tipo"
              value={formData.tipoProducto}
              onChange={(e) => setFormData(prev => ({ ...prev, tipoProducto: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
            >
              <option value="simple">Simple</option>
              <option value="botella">Botella</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          {formData.tipoProducto === 'simple' && (
            <div>
              <label htmlFor="product-precio" className="block text-sm font-medium text-dark-300 mb-2">
                Precio
              </label>
              <input
                id="product-precio"
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              />
            </div>
          )}

          {formData.tipoProducto === 'botella' && (
            <>
              <div>
                <label htmlFor="product-precio-vaso" className="block text-sm font-medium text-dark-300 mb-2">
                  Precio por Vaso
                </label>
                <input
                  id="product-precio-vaso"
                  type="number"
                  step="0.01"
                  value={formData.precioVaso}
                  onChange={(e) => setFormData(prev => ({ ...prev, precioVaso: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
                />
              </div>
              <div>
                <label htmlFor="product-precio-botella" className="block text-sm font-medium text-dark-300 mb-2">
                  Precio por Botella
                </label>
                <input
                  id="product-precio-botella"
                  type="number"
                  step="0.01"
                  value={formData.precioBotella}
                  onChange={(e) => setFormData(prev => ({ ...prev, precioBotella: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="product-imagen" className="block text-sm font-medium text-dark-300 mb-2">
              Imagen del Producto
            </label>
            <input
              id="product-imagen"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setFormData(prev => ({ ...prev, imagenUrl: event.target?.result as string }));
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
            />
            {formData.imagenUrl && (
              <div className="mt-2">
                <img 
                  src={formData.imagenUrl} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="disponible"
                checked={formData.disponible}
                onChange={(e) => setFormData(prev => ({ ...prev, disponible: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="disponible" className="text-sm text-dark-300">
                Producto disponible
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="destacado"
                checked={formData.destacado}
                onChange={(e) => setFormData(prev => ({ ...prev, destacado: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="destacado" className="text-sm text-dark-300">
                Producto destacado
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              {product ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Portal Content Component - Gestión completa del portal del cliente
function PortalContent() {
  const [activeTab, setActiveTab] = useState<'preview' | 'banners' | 'promociones' | 'recompensas' | 'favorito'>('preview');
  const [config, setConfig] = useState<any>({
    banners: [],
    promociones: [],
    eventos: [],
    recompensas: [],
    favoritoDelDia: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  // Auto-save when config changes
  useEffect(() => {
    if (config && Object.keys(config).length > 0) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 1000); // Auto-save después de 1 segundo de inactividad

      return () => clearTimeout(timeoutId);
    }
  }, [config]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/portal-config?businessId=default');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || data);
      } else {
        setConfig({
          banners: [
            {
              id: '1',
              titulo: 'Bienvenido a nuestro restaurante',
              descripcion: 'Disfruta de la mejor experiencia gastronómica',
              activo: true,
            }
          ],
          promociones: [
            {
              id: '1',
              titulo: '2x1 en Cócteles',
              descripcion: 'Válido hasta el domingo',
              descuento: 50,
              activo: true,
            }
          ],
          eventos: [
            {
              id: '1',
              titulo: 'Música en vivo',
              descripcion: 'Todos los viernes a partir de las 8pm',
              activo: true
            }
          ],
          recompensas: [
            {
              id: '1',
              nombre: 'Postre gratis',
              descripcion: 'Elige cualquier postre de nuestra carta',
              puntosRequeridos: 150,
              activo: true,
              stock: 50
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading portal config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log('💾 Admin - Guardando config:', config); // Debug
      const response = await fetch('/api/admin/portal-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          businessId: 'default'
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }

      const result = await response.json();
      console.log('✅ Admin - Config guardada exitosamente:', result); // Debug
    } catch (error) {
      console.error('❌ Admin - Error saving portal config:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-dark-400">Cargando configuración del portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Portal del Cliente</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-success-600 hover:bg-success-700 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4 text-white" />
            <span className="text-white">Guardar Cambios</span>
          </button>
          <button 
            onClick={() => window.open('http://localhost:3001/cliente', '_blank')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4 text-white" />
            <span className="text-white">Ver Portal</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-dark-800 rounded-lg p-1">
        {[
          { id: 'preview', label: 'Vista Previa', icon: Eye },
          { id: 'banners', label: 'Banner Diario', icon: Smartphone },
          { id: 'promociones', label: 'Promociones', icon: Gift },
          { id: 'favorito', label: 'Favorito del Día', icon: TrendingUp },
          { id: 'recompensas', label: 'Recompensas', icon: Gift }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors text-sm ${
                activeTab === tab.id 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <PortalContentManager 
        activeTab={activeTab}
        config={config}
        setConfig={setConfig}
      />
    </div>
  );
}

// Componente principal que maneja el contenido del portal según la pestaña activa
function PortalContentManager({ activeTab, config, setConfig }: any) {
  const addItem = (type: string, item: any) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      activo: true
    };
    
    setConfig((prev: any) => ({
      ...prev,
      [type]: [...prev[type], newItem]
    }));
  };

  const updateItem = (type: string, itemId: string, updates: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [type]: prev[type].map((item: any) => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const deleteItem = (type: string, itemId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
      setConfig((prev: any) => ({
        ...prev,
        [type]: prev[type].filter((item: any) => item.id !== itemId)
      }));
    }
  };

  const toggleActive = (type: string, itemId: string) => {
    setConfig((prev: any) => ({
      ...prev,
      [type]: prev[type].map((item: any) => 
        item.id === itemId ? { ...item, activo: !item.activo } : item
      )
    }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Vista Previa del Portal */}
      <div className="premium-card">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Smartphone className="w-5 h-5 mr-2" />
          Vista del Cliente - ACTUALIZADA v2.0
        </h4>
        <div className="bg-dark-950 rounded-xl p-4 border border-dark-700">
          {/* Simulación móvil del portal */}
          <div className="bg-black text-white min-h-96 max-w-xs mx-auto rounded-xl overflow-hidden border border-dark-600">
            {/* Header del móvil */}
            <div className="flex items-center justify-between p-4">
              <h1 className="text-lg">
                Hola, <span className="text-pink-500 font-semibold">Cliente</span>
              </h1>
              <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
            </div>

            {/* Balance Card */}
            <div className="mx-4 mb-4">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-4">
                <div className="text-white/80 text-sm mb-1">Balance de Puntos</div>
                <div className="text-2xl font-bold text-white mb-1">250</div>
                <div className="text-white/60 text-xs">Tarjeta ****1234</div>
              </div>
            </div>

            {/* Evento del día */}
            {config.banners.filter((b: any) => b.activo && b.imagenUrl).length > 0 && (
              <div className="mx-4 mb-3">
                <h3 className="text-white font-semibold text-sm mb-2">Evento del día</h3>
                {config.banners.filter((b: any) => b.activo && b.imagenUrl).slice(0, 1).map((banner: any) => (
                  <div key={banner.id} className="relative overflow-hidden rounded-xl">
                    <img 
                      src={banner.imagenUrl} 
                      alt="Evento del día"
                      className="w-full h-36 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Favorito del Día */}
            {config.favoritoDelDia?.activo && config.favoritoDelDia?.imagenUrl && (
              <div className="mx-4 mb-3">
                <h3 className="text-white font-semibold text-sm mb-2">Favorito del día</h3>
                <div className="relative overflow-hidden rounded-xl">
                  <img 
                    src={config.favoritoDelDia.imagenUrl} 
                    alt="Favorito del día" 
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">⭐</span>
                      </div>
                      <span className="text-white font-medium text-xs">Favorito del Día</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Promociones */}
            {config.promociones.filter((p: any) => p.activo).length > 0 && (
              <div className="mx-4 mb-3">
                <h3 className="text-white font-semibold text-sm mb-2">Promociones Especiales</h3>
                {config.promociones.filter((p: any) => p.activo).slice(0, 2).map((promo: any) => (
                  <div key={promo.id} className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-3 mb-2">
                    <h4 className="text-white font-medium text-sm">{promo.titulo}</h4>
                    <p className="text-white/80 text-xs">{promo.descripcion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Recompensas */}
            {config.recompensas.filter((r: any) => r.activo).length > 0 && (
              <div className="mx-4 mb-3">
                <h3 className="text-white font-semibold text-sm mb-2">Recompensas</h3>
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Gift className="w-4 h-4 text-white" />
                    <span className="text-white font-medium text-sm">Programa de Puntos</span>
                  </div>
                  <div className="flex overflow-x-auto space-x-2 pb-1">
                    {config.recompensas.filter((r: any) => r.activo).slice(0, 3).map((recompensa: any) => (
                      <div key={recompensa.id} className="bg-white/20 rounded-lg p-2 min-w-[120px]">
                        <div className="text-white font-medium text-xs">{recompensa.nombre}</div>
                        <div className="text-white font-bold text-xs">{recompensa.puntosRequeridos} pts</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Edición */}
      <div className="premium-card">
        {activeTab === 'preview' && (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto mb-4 text-primary-500" />
            <h4 className="text-lg font-semibold text-white mb-2">Vista Previa en Tiempo Real</h4>
            <p className="text-dark-400 mb-4">
              Esta vista muestra cómo verán los clientes tu portal. Los cambios se reflejan automáticamente.
            </p>
            <div className="bg-dark-800 rounded-lg p-4 text-left">
              <h5 className="text-white font-medium mb-2">Elementos Activos:</h5>
              <ul className="space-y-1 text-sm text-dark-300">
                <li>• {config.banners.filter((b: any) => b.activo).length} Banners activos</li>
                <li>• {config.promociones.filter((p: any) => p.activo).length} Promociones activas</li>
                <li>• {config.favoritoDelDia?.activo ? '1' : '0'} Favorito del día activo</li>
                <li>• {config.eventos.filter((e: any) => e.activo).length} Eventos activos</li>
                <li>• {config.recompensas.filter((r: any) => r.activo).length} Recompensas activas</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'banners' && (
          <BannersManager 
            banners={config.banners}
            onAdd={(banner: any) => addItem('banners', banner)}
            onUpdate={(id: string, updates: any) => updateItem('banners', id, updates)}
            onDelete={(id: string) => deleteItem('banners', id)}
            onToggle={(id: string) => toggleActive('banners', id)}
          />
        )}

        {activeTab === 'promociones' && (
          <PromocionesManager 
            promociones={config.promociones}
            onAdd={(promo: any) => addItem('promociones', promo)}
            onUpdate={(id: string, updates: any) => updateItem('promociones', id, updates)}
            onDelete={(id: string) => deleteItem('promociones', id)}
            onToggle={(id: string) => toggleActive('promociones', id)}
          />
        )}

        {activeTab === 'favorito' && (
          <FavoritoDelDiaManager 
            favorito={config.favoritoDelDia}
            onUpdate={(favorito: any) => setConfig((prev: any) => ({ ...prev, favoritoDelDia: favorito }))}
          />
        )}

        {activeTab === 'recompensas' && (
          <RecompensasManager 
            recompensas={config.recompensas}
            onAdd={(recompensa: any) => addItem('recompensas', recompensa)}
            onUpdate={(id: string, updates: any) => updateItem('recompensas', id, updates)}
            onDelete={(id: string) => deleteItem('recompensas', id)}
            onToggle={(id: string) => toggleActive('recompensas', id)}
          />
        )}
      </div>
    </div>
  );
}

// Componentes de gestión para cada sección
function BannersManager({ banners, onAdd, onUpdate, onDelete, onToggle }: any) {
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [publishTime, setPublishTime] = useState('04:00');
  const [formData, setFormData] = useState({ dia: 'lunes', imagenUrl: '', horaPublicacion: '04:00' });
  const [uploading, setUploading] = useState(false);
  const { selectedFile, handleFileChange, resetFile } = useFileUpload(setFormData);

  const diasSemana = [
    { value: 'lunes', label: 'L' },
    { value: 'martes', label: 'M' },
    { value: 'miercoles', label: 'X' },
    { value: 'jueves', label: 'J' },
    { value: 'viernes', label: 'V' },
    { value: 'sabado', label: 'S' },
    { value: 'domingo', label: 'D' }
  ];

  const diasCompletos = {
    'lunes': 'Lunes',
    'martes': 'Martes', 
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
  };

  const bannerPorDia = banners.find((b: any) => b.dia === selectedDay);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    let imageUrl = formData.imagenUrl;
    
    // Si hay un archivo seleccionado, subirlo primero
    if (selectedFile) {
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedFile);
        
        const uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formDataUpload
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.fileUrl;
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    
    const dataToSubmit = { 
      dia: selectedDay, 
      imagenUrl: imageUrl, 
      horaPublicacion: publishTime,
      activo: true
    };
    
    if (bannerPorDia) {
      onUpdate(bannerPorDia.id, dataToSubmit);
    } else {
      onAdd(dataToSubmit);
    }
    
    resetFile();
    setUploading(false);
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Banner Diario</h4>
        <p className="text-dark-400 text-sm mb-4">
          Configura banners para cada día de la semana. Se publicarán automáticamente a la hora especificada.
        </p>
      </div>

      {/* Selector de día */}
      <div className="bg-dark-800 rounded-lg p-4 mb-4">
        <h5 className="text-white font-medium mb-3">Seleccionar Día</h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map((dia) => (
            <button
              key={dia.value}
              onClick={() => setSelectedDay(dia.value)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                selectedDay === dia.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
              }`}
            >
              {dia.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario para el día seleccionado */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">
          Banner para {diasCompletos[selectedDay as keyof typeof diasCompletos]}
        </h5>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="publishTime" className="block text-sm font-medium text-dark-300 mb-2">
              Hora de Publicación (día siguiente)
            </label>
            <input
              id="publishTime"
              type="time"
              value={publishTime}
              onChange={(e) => setPublishTime(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white"
              required
            />
            <p className="text-xs text-dark-400 mt-1">
              Se publicará el día siguiente a esta hora (trabajamos de 6pm a 3am)
            </p>
          </div>

          <div>
            <label htmlFor="bannerImage" className="block text-sm font-medium text-dark-300 mb-2">
              Imagen del Banner
            </label>
            <input
              id="bannerImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
              required={!bannerPorDia?.imagenUrl}
            />
          </div>

          {(formData.imagenUrl || bannerPorDia?.imagenUrl) && (
            <div>
              <p className="text-sm text-dark-300 mb-2">Vista previa:</p>
              <img 
                src={formData.imagenUrl || bannerPorDia?.imagenUrl} 
                alt="Preview" 
                className="w-full h-32 object-cover rounded-lg border border-dark-600"
              />
            </div>
          )}

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-success-600 hover:bg-success-700 disabled:bg-success-400 text-white rounded transition-colors"
            >
              {(() => {
                if (uploading) return 'Subiendo...';
                return bannerPorDia ? 'Actualizar' : 'Crear';
              })()}
            </button>
            {bannerPorDia && (
              <button
                type="button"
                onClick={() => onDelete(bannerPorDia.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </form>

        {bannerPorDia && (
          <div className="mt-4 p-3 bg-dark-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-300">
                Configurado para: {bannerPorDia.horaPublicacion}
              </span>
              <button
                onClick={() => onToggle(bannerPorDia.id)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  bannerPorDia.activo 
                    ? 'bg-success-600 text-white' 
                    : 'bg-dark-600 text-dark-300'
                }`}
              >
                {bannerPorDia.activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FavoritoDelDiaManager({ favorito, onUpdate }: any) {
  const [formData, setFormData] = useState({
    imagenUrl: favorito?.imagenUrl || ''
  });
  const [uploading, setUploading] = useState(false);
  const { selectedFile, handleFileChange } = useFileUpload(setFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    let imageUrl = formData.imagenUrl;
    
    // Si hay un archivo seleccionado, subirlo primero
    if (selectedFile) {
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedFile);
        
        const uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formDataUpload
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.fileUrl;
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    
    const dataToSubmit = { 
      imagenUrl: imageUrl,
      activo: true
    };
    
    onUpdate(dataToSubmit);
    setUploading(false);
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Favorito del Día</h4>
        <p className="text-dark-400 text-sm mb-4">
          Sube una imagen destacada para mostrar en el portal del cliente.
        </p>
      </div>

      <div className="bg-dark-800 rounded-lg p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="favoritoImage" className="block text-sm font-medium text-dark-300 mb-2">
              Imagen del Favorito del Día
            </label>
            <input
              id="favoritoImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full px-4 py-2 bg-success-600 hover:bg-success-700 disabled:bg-success-400 text-white rounded transition-colors"
          >
            {uploading ? 'Subiendo...' : 'Guardar Favorito del Día'}
          </button>
        </form>

        {favorito && (
          <div className="mt-4 p-3 bg-dark-700 rounded-lg">
            <p className="text-sm text-success-400">✅ Favorito del día configurado</p>
            <p className="text-xs text-dark-400 mt-1">Se mostrará prominentemente en el portal cliente</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PromocionesManager({ promociones, onAdd, onUpdate, onDelete, onToggle }: any) {
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [formData, setFormData] = useState({ 
    dia: 'lunes', 
    titulo: '', 
    descripcion: '', 
    descuento: '', 
    horaTermino: '04:00' 
  });

  const diasSemana = [
    { value: 'lunes', label: 'L' },
    { value: 'martes', label: 'M' },
    { value: 'miercoles', label: 'X' },
    { value: 'jueves', label: 'J' },
    { value: 'viernes', label: 'V' },
    { value: 'sabado', label: 'S' },
    { value: 'domingo', label: 'D' }
  ];

  const diasCompletos = {
    'lunes': 'Lunes',
    'martes': 'Martes', 
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
  };

  const promoPorDia = promociones.find((p: any) => p.dia === selectedDay);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = { 
      dia: selectedDay,
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      descuento: formData.descuento,
      horaTermino: formData.horaTermino,
      activo: true
    };
    
    if (promoPorDia) {
      onUpdate(promoPorDia.id, dataToSubmit);
    } else {
      onAdd(dataToSubmit);
    }
    
    setFormData({ 
      dia: selectedDay, 
      titulo: '', 
      descripcion: '', 
      descuento: '', 
      horaTermino: '04:00' 
    });
  };

  const loadPromoData = (dia: string) => {
    const promo = promociones.find((p: any) => p.dia === dia);
    if (promo) {
      setFormData({
        dia: dia,
        titulo: promo.titulo || '',
        descripcion: promo.descripcion || '',
        descuento: promo.descuento || '',
        horaTermino: promo.horaTermino || '04:00'
      });
    } else {
      setFormData({
        dia: dia,
        titulo: '',
        descripcion: '',
        descuento: '',
        horaTermino: '04:00'
      });
    }
  };

  const handleDaySelect = (dia: string) => {
    setSelectedDay(dia);
    loadPromoData(dia);
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Promociones por Día</h4>
        <p className="text-dark-400 text-sm mb-4">
          Configura promociones específicas para cada día de la semana. Se actualizan automáticamente a las 4:00 AM.
        </p>
      </div>

      {/* Selector de día */}
      <div className="bg-dark-800 rounded-lg p-4 mb-4">
        <h5 className="text-white font-medium mb-3">Seleccionar Día</h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map((dia) => {
            const tienePromo = promociones.some((p: any) => p.dia === dia.value);
            return (
              <button
                key={dia.value}
                onClick={() => handleDaySelect(dia.value)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors relative ${
                  selectedDay === dia.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
              >
                {dia.label}
                {tienePromo && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario para el día seleccionado */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">
          Promoción para {diasCompletos[selectedDay as keyof typeof diasCompletos]}
        </h5>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="promoTitle" className="block text-sm font-medium text-dark-300 mb-2">
              Título de la Promoción
            </label>
            <input
              id="promoTitle"
              type="text"
              placeholder="Ej: 2x1 en Cócteles"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
              required
            />
          </div>

          <div>
            <label htmlFor="promoDescription" className="block text-sm font-medium text-dark-300 mb-2">
              Descripción
            </label>
            <textarea
              id="promoDescription"
              placeholder="Descripción de la promoción..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="promoDiscount" className="block text-sm font-medium text-dark-300 mb-2">
                Descuento (%)
              </label>
              <input
                id="promoDiscount"
                type="number"
                placeholder="50"
                value={formData.descuento}
                onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                min="0"
                max="100"
                required
              />
            </div>

            <div>
              <label htmlFor="promoEndTime" className="block text-sm font-medium text-dark-300 mb-2">
                Hora de Término (día siguiente)
              </label>
              <input
                id="promoEndTime"
                type="time"
                value={formData.horaTermino}
                onChange={(e) => setFormData({ ...formData, horaTermino: e.target.value })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white"
                required
              />
            </div>
          </div>

          <p className="text-xs text-dark-400">
            Horario de trabajo: 6pm a 3am. La promoción se actualiza automáticamente al día siguiente a las 4am.
          </p>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded transition-colors"
            >
              {promoPorDia ? 'Actualizar' : 'Crear'} Promoción
            </button>
            {promoPorDia && (
              <button
                type="button"
                onClick={() => onDelete(promoPorDia.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </form>

        {promoPorDia && (
          <div className="mt-4 p-3 bg-dark-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-dark-300">
                  {promoPorDia.descuento}% descuento hasta {promoPorDia.horaTermino}
                </span>
              </div>
              <button
                onClick={() => onToggle(promoPorDia.id)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  promoPorDia.activo 
                    ? 'bg-success-600 text-white' 
                    : 'bg-dark-600 text-dark-300'
                }`}
              >
                {promoPorDia.activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resumen de promociones de la semana */}
      <div className="bg-dark-800 rounded-lg p-4 mt-4">
        <h6 className="text-white font-medium mb-3">Resumen de la Semana</h6>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map((dia) => {
            const promo = promociones.find((p: any) => p.dia === dia.value);
            return (
              <div key={dia.value} className="text-center">
                <div className="text-xs text-dark-400 mb-1">{dia.label}</div>
                <div className={`text-xs p-2 rounded ${
                  promo 
                    ? 'bg-success-600 text-white' 
                    : 'bg-dark-700 text-dark-400'
                }`}>
                  {promo ? `${promo.descuento}%` : 'Sin promo'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RecompensasManager({ recompensas, onAdd, onUpdate, onDelete, onToggle }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', puntosRequeridos: '', stock: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      puntosRequeridos: parseInt(formData.puntosRequeridos),
      stock: formData.stock ? parseInt(formData.stock) : null
    };
    
    if (editingItem) {
      onUpdate(editingItem.id, data);
      setEditingItem(null);
    } else {
      onAdd(data);
    }
    
    setFormData({ nombre: '', descripcion: '', puntosRequeridos: '', stock: '' });
    setShowForm(false);
  };

  const startEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ 
      nombre: item.nombre, 
      descripcion: item.descripcion, 
      puntosRequeridos: item.puntosRequeridos?.toString() || '',
      stock: item.stock?.toString() || ''
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Sistema de Recompensas</h4>
        <p className="text-dark-400 text-sm mb-4">
          Crea recompensas que los clientes pueden canjear usando sus puntos de lealtad acumulados.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Recompensa</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-dark-800 rounded-lg p-4">
          <h5 className="text-white font-medium mb-4">
            {editingItem ? 'Editar Recompensa' : 'Nueva Recompensa'}
          </h5>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rewardName" className="block text-sm font-medium text-dark-300 mb-2">
                Nombre de la Recompensa
              </label>
              <input
                id="rewardName"
                type="text"
                placeholder="Ej: Bebida Gratis"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                required
              />
            </div>

            <div>
              <label htmlFor="rewardDescription" className="block text-sm font-medium text-dark-300 mb-2">
                Descripción
              </label>
              <textarea
                id="rewardDescription"
                placeholder="Describe los detalles de la recompensa..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rewardPoints" className="block text-sm font-medium text-dark-300 mb-2">
                  Puntos Requeridos
                </label>
                <input
                  id="rewardPoints"
                  type="number"
                  placeholder="100"
                  value={formData.puntosRequeridos}
                  onChange={(e) => setFormData({ ...formData, puntosRequeridos: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="rewardStock" className="block text-sm font-medium text-dark-300 mb-2">
                  Stock Disponible (Opcional)
                </label>
                <input
                  id="rewardStock"
                  type="number"
                  placeholder="Dejar vacío para ilimitado"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded transition-colors"
              >
                {editingItem ? 'Actualizar' : 'Crear'} Recompensa
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({ nombre: '', descripcion: '', puntosRequeridos: '', stock: '' });
                }}
                className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {recompensas.length === 0 ? (
          <div className="text-center py-8 bg-dark-800 rounded-lg border-2 border-dashed border-dark-600">
            <Gift className="w-8 h-8 mx-auto mb-3 text-dark-500" />
            <p className="text-dark-400">No hay recompensas creadas</p>
            <p className="text-dark-500 text-sm">Agrega recompensas para incentivar la lealtad de tus clientes</p>
          </div>
        ) : (
          recompensas.map((recompensa: any) => (
            <div key={recompensa.id} className="bg-dark-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="text-white font-medium">{recompensa.nombre}</h5>
                    <span className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium">
                      {recompensa.puntosRequeridos} pts
                    </span>
                    <button
                      onClick={() => onToggle(recompensa.id)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        recompensa.activo 
                          ? 'bg-success-600 text-white' 
                          : 'bg-dark-600 text-dark-300'
                      }`}
                    >
                      {recompensa.activo ? 'Activa' : 'Inactiva'}
                    </button>
                  </div>
                  <p className="text-dark-300 text-sm mb-1">{recompensa.descripcion}</p>
                  {recompensa.stock && (
                    <p className="text-dark-400 text-xs">📦 Stock: {recompensa.stock}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(recompensa)}
                    className="p-2 bg-primary-600 hover:bg-primary-700 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => onDelete(recompensa.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
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
            <div className="text-center text-dark-400 py-8">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 text-dark-500" />
              <p>Analytics disponible próximamente</p>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Ingresos Mensuales</h4>
          <div className="text-center text-dark-400 py-8">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-dark-500" />
            <p>Reportes disponibles próximamente</p>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Clientes Activos</h4>
          <div className="text-center text-dark-400 py-8">
            <Users className="w-8 h-8 mx-auto mb-3 text-dark-500" />
            <p>Métricas disponibles próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Configuration Content Component
function ConfiguracionContent() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Configuración del Sistema</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Configuración General</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Nombre del Negocio</span>
              <input
                type="text"
                defaultValue="Mi Restaurante"
                className="px-3 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Moneda</span>
              <select className="px-3 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm">
                <option>USD</option>
                <option>EUR</option>
                <option>COP</option>
              </select>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">Configuración del Portal</h4>
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
