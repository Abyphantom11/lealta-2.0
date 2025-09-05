'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavigationItem, Tarjeta } from '../../types/api-routes';

// ID de negocio centralizado para fácil transición futura
const BUSINESS_ID = 'business_1';
import { useRequireAuth } from '../../hooks/useAuth';
import RoleSwitch from '../../components/RoleSwitch';
import { MenuItem, MenuCategory, Cliente, StatsData } from '../../types/admin';
import { CategoryFormData } from '../../types/admin-extras';
import Image from 'next/image';

// Tipo para productos
interface ProductData {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  categoryId?: string;
  precioVaso?: number;
  precioBotella?: number;
  tipoProducto?: string;
  disponible?: boolean;
  destacado?: boolean;
  imagen?: string;
  imagenUrl?: string;
  tags?: string[];
}

// Tipo para categorías de productos
interface CategoryData {
  id?: string;
  nombre: string;
  descripcion?: string;
}

// Tipo para banners
interface Banner {
  id?: string;
  activo?: boolean; // Cambiado de required a optional
  imagenUrl?: string;
  dia?: string;
  titulo?: string;
  descripcion?: string;
  linkUrl?: string;
  orden?: number;
  horaPublicacion?: string;
}

// Tipo para promociones
interface Promocion {
  id?: string;
  activo?: boolean; // Cambiado de required a optional
  titulo?: string;
  descripcion?: string;
  dia?: string;
  codigo?: string;
  descuento?: number;
  fechaInicio?: string;
  fechaFin?: string;
  horaTermino?: string;
}

// Tipo para recompensas
interface Recompensa {
  id?: string;
  activo?: boolean; // Cambiado de required a optional
  nombre?: string;
  puntosRequeridos?: number;
  descripcion?: string;
  categoria?: string;
  stock?: number;
}

// Tipo para configuración de branding
interface BrandingConfig {
  businessName: string;
  primaryColor: string;
  carouselImages: string[];
}

// Tipo para favorito del día - interfaz unificada
interface FavoritoDelDia {
  id?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagenUrl?: string;
  activo?: boolean;
  dia?: string;
  titulo?: string;
  linkUrl?: string;
  orden?: number;
  horaPublicacion?: string;
}

// Funciones auxiliares para type guards
const isFavoritoWithDia = (item: FavoritoDelDia): item is FavoritoDelDia & { dia: string } => {
  return item !== null && typeof item === 'object' && 'dia' in item && typeof item.dia === 'string';
};

const isFavoritoWithId = (item: FavoritoDelDia): item is { id: string } & Record<string, unknown> => {
  return item !== null && typeof item === 'object' && 'id' in item && typeof item.id === 'string';
};

const getFavoritoProperty = (item: FavoritoDelDia, prop: string): unknown => {
  if (item && typeof item === 'object' && prop in item) {
    return (item as Record<string, unknown>)[prop];
  }
  return undefined;
};

const isFavoritoActivo = (favorito: FavoritoDelDia | FavoritoDelDia[] | null | undefined): boolean => {
  if (!favorito) return false;
  if (Array.isArray(favorito)) {
    return favorito.some(f => getFavoritoProperty(f, 'activo') === true);
  }
  return getFavoritoProperty(favorito, 'activo') === true;
};

const getFavoritosList = (favorito: FavoritoDelDia | FavoritoDelDia[] | null | undefined): FavoritoDelDia[] => {
  if (!favorito) return [];
  if (Array.isArray(favorito)) {
    return favorito;
  }
  return [favorito];
};

// Tipo para configuración general
interface GeneralConfig {
  [key: string]: unknown;
  tarjetaVirtual?: {
    habilitada: boolean;
    requerirTelefono: boolean;
  };
  promociones?: Promocion[];
  recompensas?: Recompensa[];
  banners?: Banner[];
  favoritoDelDia?: FavoritoDelDia[] | FavoritoDelDia | null;
  tarjetas?: Tarjeta[];
  nombreEmpresa?: string;
  eventos?: {
    id: string;
    titulo: string;
    descripcion?: string;
    fecha: string;
    activo: boolean;
  }[];
}

// Tipo para los niveles de las tarjetas
type NivelTarjeta = 'success' | 'error' | 'info' | 'warning';

// Tipo para los modos de vista previa
type ModoVistaPrevia = 'portal' | 'login' | 'tarjetas';

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
  Coffee,
  Building,
  IdCard,
  CheckCircle,
  AlertTriangle,
  Info,
  CreditCard,
  Pencil,
  Check,
} from 'lucide-react';

// Hook personalizado para manejar carga de archivos
const useFileUpload = <T extends Record<string, unknown>>(
  setFormData: (updater: (prev: T) => T) => void
) => {
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

// Función para obtener la clase de color según el tipo de notificación
const getNotificationColorClass = (type: NivelTarjeta): string => {
  switch (type) {
    case 'success':
      return 'bg-green-600';
    case 'error':
      return 'bg-red-600';
    case 'warning':
      return 'bg-yellow-600';
    case 'info':
    default:
      return 'bg-blue-600';
  }
};

type AdminSection =
  | 'dashboard'
  | 'clientes'
  | 'menu'
  | 'portal'
  | 'analytics'
  | 'configuracion';

// Funciones helper para manejar arrays de promociones y recompensas
const getPromocionesList = (promociones: unknown): Promocion[] => {
  if (Array.isArray(promociones)) {
    return promociones as Promocion[];
  }
  return [];
};

const getRecompensasList = (recompensas: unknown): Recompensa[] => {
  if (Array.isArray(recompensas)) {
    return recompensas as Recompensa[];
  }
  return [];
};

export default function AdminPage() {
  const { user, loading, logout, isAuthenticated } = useRequireAuth('ADMIN');
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/cliente/lista');
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
        console.error('Error cargando estadísticas:', error);
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
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-dark-900 border-r border-dark-700`}
      >
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
            {navigationItems.map(item => {
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
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Componente de notificación */}
        {notification.show && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 ${getNotificationColorClass(
              notification.type
            )}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <CheckCircle className="w-5 h-5 text-white" />
                )}
                {notification.type === 'error' && (
                  <AlertTriangle className="w-5 h-5 text-white" />
                )}
                {notification.type === 'warning' && (
                  <AlertTriangle className="w-5 h-5 text-white" />
                )}
                {notification.type === 'info' && (
                  <Info className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {notification.message}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() =>
                    setNotification(prev => ({ ...prev, show: false }))
                  }
                  className="inline-flex text-white hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

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
          {activeSection === 'portal' && (
            <PortalContent showNotification={showNotification} />
          )}
          {activeSection === 'analytics' && <AnalyticsContent />}
          {activeSection === 'configuracion' && <ConfiguracionContent />}
        </main>
      </div>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent({ stats }: Readonly<{ stats: StatsData }>) {
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
          <h3 className="text-lg font-semibold text-white mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-3">
            {[
              {
                id: 'cliente',
                type: 'cliente',
                text: 'Nuevo cliente registrado: Juan Pérez',
                time: '2 min',
              },
              {
                id: 'consumo',
                type: 'consumo',
                text: 'Consumo registrado: $45.50',
                time: '5 min',
              },
              {
                id: 'pago',
                type: 'pago',
                text: 'Pago confirmado: María García',
                time: '8 min',
              },
              {
                id: 'promocion',
                type: 'promocion',
                text: 'Promoción vista 12 veces',
                time: '15 min',
              },
            ].map(activity => {
              const getActivityColor = (type: string) => {
                if (type === 'cliente') return 'bg-primary-500';
                if (type === 'consumo') return 'bg-success-500';
                if (type === 'pago') return 'bg-green-500';
                return 'bg-purple-500';
              };

              return (
                <div
                  key={activity.id}
                  className="flex items-center space-x-3 p-3 bg-dark-800/30 rounded-lg"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${getActivityColor(activity.type)}`}
                  />
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
          <h3 className="text-lg font-semibold text-white mb-4">
            Acciones Rápidas
          </h3>
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
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch('/api/cliente/lista');
        const data = await response.json();
        if (data.success) {
          setClientes(data.clientes);
          setFilteredClientes(data.clientes);
        }
      } catch (error) {
        console.error('Error cargando clientes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientes();
  }, []);

  // Función para filtrar clientes localmente
  const filterClientsLocally = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredClientes(clientes);
        return;
      }

      const searchLower = query.toLowerCase();
      const filtered = clientes.filter(
        client =>
          client.nombre.toLowerCase().includes(searchLower) ||
          client.cedula?.toLowerCase().includes(searchLower) ||
          client.telefono?.toLowerCase().includes(searchLower) ||
          client.correo?.toLowerCase().includes(searchLower)
      );

      setFilteredClientes(filtered);
    },
    [clientes]
  );

  // Función para buscar clientes en el servidor
  const searchClientesAPI = useCallback(async (query: string) => {
    if (!query || query.length < 2) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/clientes/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        // Si tenemos resultados de la API, actualizar la lista filtrada
        setFilteredClientes(data);
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
      // En caso de error, volver a la búsqueda local
      filterClientsLocally(query);
    } finally {
      setIsSearching(false);
    }
  }, [filterClientsLocally]);

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= 3) {
        // Para búsquedas más específicas, usar la API
        searchClientesAPI(searchTerm);
      } else {
        // Para búsquedas cortas o vacías, filtrar localmente
        filterClientsLocally(searchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filterClientsLocally, searchClientesAPI]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          Gestión de Clientes
        </h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white">Nuevo Cliente</span>
        </button>
      </div>

      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search
                className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${isSearching ? 'text-primary-500 animate-pulse' : 'text-dark-400'}`}
              />
              <input
                type="text"
                placeholder="Buscar clientes..."
                className="pl-10 pr-10 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors">
              <Filter className="w-4 h-4 text-dark-400" />
            </button>
          </div>
          <div className="text-dark-400 text-sm">
            {(() => {
              if (isLoading) return 'Cargando...';
              return `${filteredClientes.length} cliente${filteredClientes.length !== 1 ? 's' : ''}`;
            })()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 text-dark-300 font-medium">
                  Cliente
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Cédula
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Contacto
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Puntos
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Registro
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Tarjeta
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Estado
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (isLoading) {
                  return (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-dark-400"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                          <span>Cargando clientes...</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                if (filteredClientes.length === 0) {
                  return (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-dark-400"
                      >
                        {clientes.length > 0
                          ? 'No se encontraron clientes con ese criterio de búsqueda'
                          : 'No hay clientes registrados aún'}
                      </td>
                    </tr>
                  );
                }

                return filteredClientes.map(client => (
                  <tr
                    key={client.id}
                    className="border-b border-dark-800/50 hover:bg-dark-800/30"
                  >
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {client.nombre
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .slice(0, 2)}
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
                    <td className="py-4 text-success-400 font-semibold">
                      {client.puntos} pts
                    </td>
                    <td className="py-4 text-dark-300">
                      {new Date(client.registeredAt).toLocaleDateString(
                        'es-ES'
                      )}
                    </td>
                    <td className="py-4">
                      {client.tarjetaLealtad ? (
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium ${client.tarjetaLealtad.activa ? 'text-success-400' : 'text-red-400'}`}
                          >
                            {client.tarjetaLealtad.nivel}
                          </span>
                          <span className="text-xs text-dark-400">
                            {client.tarjetaLealtad.asignacionManual
                              ? 'Manual'
                              : 'Auto'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-dark-400">
                          Sin tarjeta
                        </span>
                      )}
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
  const [activeTab, setActiveTab] = useState<
    'categorias' | 'productos' | 'preview'
  >('preview');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para notificaciones elegantes
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    show: boolean;
  }>({
    type: 'success',
    message: '',
    show: false,
  });

  // Estados para modales
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(
    null
  );
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);

  // Función para mostrar notificaciones elegantes
  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Estado para modal de confirmación
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    type: 'danger' | 'warning';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    type: 'danger',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch(
          `/api/admin/menu?businessId=${BUSINESS_ID}`
        );
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.menu || []);
        }

        // Fetch products
        const productsResponse = await fetch(
          `/api/admin/menu/productos?businessId=${BUSINESS_ID}`
        );
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
    const category = categories.find((c: MenuCategory) => c.id === categoryId);
    if (!category) return;

    try {
      const response = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: categoryId,
          activo: !category.activo,
        }),
      });

      if (response.ok) {
        setCategories(prev =>
          prev.map((c: MenuCategory) =>
            c.id === categoryId ? { ...c, activo: !c.activo } : c
          )
        );
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const toggleProductStatus = async (productId: string) => {
    const product = products.find((p: MenuItem) => p.id === productId);
    if (!product) return;

    try {
      const response = await fetch('/api/admin/menu/productos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          disponible: !product.disponible,
        }),
      });

      if (response.ok) {
        setProducts(prev =>
          prev.map((p: MenuItem) =>
            p.id === productId ? { ...p, disponible: !p.disponible } : p
          )
        );
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  // Función para eliminar categoría
  // Helper para filtrar productos después de eliminar categoría
  const filterProductsAfterCategoryDelete = (
    products: MenuItem[],
    categoryIdToDelete: string
  ) => {
    return products.filter((p: MenuItem) => {
      const category = categories.find(c => c.id === p.categoryId);
      const isFromDeletedCategory = category?.id === categoryIdToDelete;
      const isFromDeletedSubcategory =
        category?.parentId === categoryIdToDelete;
      return !isFromDeletedCategory && !isFromDeletedSubcategory;
    });
  };

  // Función separada para ejecutar eliminación de categoría
  const executeDeleteCategory = async (categoryId: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/admin/menu?id=${encodeURIComponent(categoryId)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        setCategories(prev =>
          prev.filter((c: MenuCategory) => c.id !== categoryId)
        );
        // También eliminar productos de esta categoría y subcategorías
        setProducts(prev =>
          filterProductsAfterCategoryDelete(prev, categoryId)
        );
        showNotification('success', 'Categoría eliminada exitosamente');
      } else {
        const errorData = await response.json();
        showNotification(
          'error',
          `Error eliminando categoría: ${errorData.error || 'Error desconocido'}`
        );
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showNotification('error', 'Error de conexión al eliminar categoría');
    } finally {
      setIsLoading(false);
      setConfirmModal(prev => ({ ...prev, show: false }));
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!categoryId) {
      showNotification('error', 'ID de la categoría no válido');
      return;
    }

    setConfirmModal({
      show: true,
      title: 'Eliminar Categoría',
      message:
        '¿Estás seguro de que quieres eliminar esta categoría? Esta acción eliminará también todos los productos y subcategorías asociados y no se puede deshacer.',
      confirmText: 'Eliminar',
      type: 'danger',
      onConfirm: () => {
        executeDeleteCategory(categoryId);
      },
    });
  };

  // Función separada para ejecutar eliminación de producto
  const executeDeleteProduct = async (productId: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/admin/menu/productos?id=${encodeURIComponent(productId)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        setProducts(prev => prev.filter((p: MenuItem) => p.id !== productId));
        showNotification('success', 'Producto eliminado exitosamente');
      } else {
        const errorData = await response.json();
        showNotification(
          'error',
          `Error eliminando producto: ${errorData.error || 'Error desconocido'}`
        );
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('error', 'Error de conexión al eliminar producto');
    } finally {
      setIsLoading(false);
      setConfirmModal(prev => ({ ...prev, show: false }));
    }
  };

  // Función para eliminar producto
  const deleteProduct = async (productId: string) => {
    if (!productId) {
      showNotification('error', 'ID del producto no válido');
      return;
    }

    setConfirmModal({
      show: true,
      title: 'Eliminar Producto',
      message:
        '¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      type: 'danger',
      onConfirm: () => {
        executeDeleteProduct(productId);
      },
    });
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

  // Helper para obtener estilo de notificación
  const getNotificationClass = (type: string) => {
    if (type === 'success') return 'bg-green-600';
    if (type === 'error') return 'bg-red-600';
    if (type === 'warning') return 'bg-yellow-600';
    return 'bg-blue-600';
  };

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
            <h4 className="text-lg font-semibold text-white">
              Categorías del Menú
            </h4>
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
              {categories
                .filter(cat => !cat.parentId)
                .map((category: MenuCategory) => (
                  <div key={category.id}>
                    {/* Categoría principal */}
                    <div className="bg-dark-800/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="text-lg font-medium text-white">
                            {category.nombre}
                          </h5>
                          <p className="text-dark-300 text-sm mt-1">
                            {category.descripcion}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs ${
                                category.activo
                                  ? 'bg-success-500/20 text-success-400'
                                  : 'bg-dark-600 text-dark-400'
                              }`}
                            >
                              {category.activo ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className="text-xs text-dark-400">
                              Orden: {category.orden}
                            </span>
                            <span className="text-xs text-primary-400">
                              Categoría Principal
                            </span>
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
                            {category.activo ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setShowCategoryModal(true);
                            }}
                            className="text-primary-400 hover:text-primary-300 p-2 rounded-md hover:bg-primary-500/10"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subcategorías */}
                    {categories.filter(
                      subcat => subcat.parentId === category.id
                    ).length > 0 && (
                      <div className="ml-8 mt-2 space-y-2">
                        {categories
                          .filter(subcat => subcat.parentId === category.id)
                          .map((subcategory: MenuCategory) => (
                            <div
                              key={subcategory.id}
                              className="bg-dark-700/30 rounded-lg p-3 border-l-4 border-primary-500"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h6 className="text-md font-medium text-white">
                                    {subcategory.nombre}
                                  </h6>
                                  <p className="text-dark-300 text-sm mt-1">
                                    {subcategory.descripcion}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span
                                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                                        subcategory.activo
                                          ? 'bg-success-500/20 text-success-400'
                                          : 'bg-dark-600 text-dark-400'
                                      }`}
                                    >
                                      {subcategory.activo
                                        ? 'Activo'
                                        : 'Inactivo'}
                                    </span>
                                    <span className="text-xs text-dark-400">
                                      Orden: {subcategory.orden}
                                    </span>
                                    <span className="text-xs text-yellow-400">
                                      Subcategoría
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      toggleCategoryStatus(subcategory.id)
                                    }
                                    className={`p-2 rounded-md ${
                                      subcategory.activo
                                        ? 'text-success-400 hover:text-success-300 hover:bg-success-500/10'
                                        : 'text-dark-400 hover:text-dark-300 hover:bg-dark-600'
                                    }`}
                                  >
                                    {subcategory.activo ? (
                                      <Eye className="w-4 h-4" />
                                    ) : (
                                      <EyeOff className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCategory(subcategory);
                                      setShowCategoryModal(true);
                                    }}
                                    className="text-primary-400 hover:text-primary-300 p-2 rounded-md hover:bg-primary-500/10"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteCategory(subcategory.id)
                                    }
                                    className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-500/10"
                                  >
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
            <h4 className="text-lg font-semibold text-white mb-4">
              Productos del Menú
            </h4>
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
              {products.map((product: MenuItem) => {
                const category = categories.find(
                  (c: MenuCategory) => c.id === product.categoryId
                );
                return (
                  <div
                    key={product.id}
                    className="bg-dark-800/30 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h6 className="font-medium text-white">
                          {product.nombre}
                        </h6>
                        <p className="text-dark-300 text-sm mt-1">
                          {product.descripcion}
                        </p>
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
                          <span className="font-medium text-primary-400">
                            ${product.precioVaso}
                          </span>
                        </div>
                      )}
                      {product.precioBotella && (
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-300">Botella:</span>
                          <span className="font-medium text-primary-400">
                            ${product.precioBotella}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          product.disponible
                            ? 'bg-success-500/20 text-success-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
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
                          {product.disponible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductModal(true);
                          }}
                          className="text-primary-400 hover:bg-primary-500/10 p-1 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-400 hover:bg-red-500/10 p-1 rounded"
                        >
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
            <h4 className="text-lg font-semibold text-white">
              Vista Previa del Menú
            </h4>
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
          onSave={async categoryData => {
            try {
              setIsLoading(true);
              const method = editingCategory ? 'PUT' : 'POST';
              const body = editingCategory
                ? { ...categoryData, id: editingCategory.id }
                : { ...categoryData, businessId: BUSINESS_ID };

              const response = await fetch('/api/admin/menu', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });

              if (response.ok) {
                setShowCategoryModal(false);
                setEditingCategory(null);
                showNotification(
                  'success',
                  editingCategory
                    ? 'Categoría actualizada exitosamente'
                    : 'Categoría creada exitosamente'
                );

                // Refrescar categorías
                const categoriesResponse = await fetch(
                  `/api/admin/menu?businessId=${BUSINESS_ID}`
                );
                if (categoriesResponse.ok) {
                  const categoriesData = await categoriesResponse.json();
                  setCategories(categoriesData.menu || []);
                }
              } else {
                const errorData = await response.json();
                showNotification(
                  'error',
                  `Error guardando categoría: ${errorData.error || 'Error desconocido'}`
                );
              }
            } catch (error) {
              console.error('Error:', error);
              showNotification(
                'error',
                'Error de conexión al guardar categoría'
              );
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
          product={editingProduct ? {
            ...editingProduct,
            categoria: categories.find(c => c.id === editingProduct.categoryId)?.nombre || '',
            descripcion: editingProduct.descripcion || '',
            precio: editingProduct.precio || 0
          } : null}
          categories={categories}
          onSave={async productData => {
            try {
              setIsLoading(true);

              // Validar que no existe un producto con el mismo nombre en la misma categoría
              const existingProduct = products.find(
                p =>
                  p.categoryId === productData.categoryId &&
                  p.nombre.toLowerCase() === productData.nombre.toLowerCase() &&
                  (!editingProduct || p.id !== editingProduct.id)
              );

              if (existingProduct) {
                showNotification(
                  'warning',
                  'Ya existe un producto con ese nombre en esta categoría. Por favor elige otro nombre.'
                );
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
                body: JSON.stringify(body),
              });

              if (response.ok) {
                setShowProductModal(false);
                setEditingProduct(null);
                showNotification(
                  'success',
                  editingProduct
                    ? 'Producto actualizado exitosamente'
                    : 'Producto creado exitosamente'
                );

                // Refrescar productos
                const productsResponse = await fetch(
                  `/api/admin/menu/productos?businessId=${BUSINESS_ID}`
                );
                if (productsResponse.ok) {
                  const productsData = await productsResponse.json();
                  setProducts(productsData.productos || []);
                } else {
                  console.error('Error refrescando productos');
                }
              } else {
                const errorData = await response.json();
                showNotification(
                  'error',
                  `Error guardando producto: ${errorData.error || 'Error desconocido'}`
                );
              }
            } catch (error) {
              console.error('Error:', error);
              showNotification(
                'error',
                'Error de conexión al guardar el producto'
              );
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

      {/* Notificación elegante */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${getNotificationClass(notification.type)}`}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <CheckCircle className="w-5 h-5 text-white" />
              )}
              {notification.type === 'error' && (
                <X className="w-5 h-5 text-white" />
              )}
              {notification.type === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-white" />
              )}
              {notification.type === 'info' && (
                <Info className="w-5 h-5 text-white" />
              )}
            </div>
            <p className="text-white text-sm font-medium">
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Modal de confirmación elegante */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmModal.type === 'danger'
                    ? 'bg-red-600/20'
                    : 'bg-yellow-600/20'
                }`}
              >
                {confirmModal.type === 'danger' ? (
                  <Trash2 className="w-5 h-5 text-red-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() =>
                  setConfirmModal(prev => ({ ...prev, show: false }))
                }
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                  confirmModal.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Vista Previa del Menú
function MenuPreview({
  categories,
  products,
}: {
  readonly categories: MenuCategory[];
  readonly products: MenuItem[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(
    null
  );

  const activeCategories = categories.filter(
    cat => cat.activo && !cat.parentId
  ); // Solo categorías principales activas
  const availableProducts = products.filter(prod => prod.disponible);

  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId && cat.activo);
  };

  const getProductsForCategory = (categoryId: string) => {
    return availableProducts.filter(
      product => product.categoryId === categoryId
    );
  };

  return (
    <div
      className="bg-black rounded-xl p-6 max-w-md mx-auto text-white"
      style={{ minHeight: '600px' }}
    >
      {/* Header del menú */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Nuestro Menú</h1>
        <p className="text-gray-400 text-sm">
          Vista previa del menú del cliente
        </p>
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
            {activeCategories.map((category: MenuCategory) => (
              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory?.id === category.id ? null : category
                  )
                }
                className={`p-4 rounded-lg border transition-all ${
                  selectedCategory?.id === category.id
                    ? 'bg-primary-600 border-primary-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-medium">{category.nombre}</div>
                  <div className="text-xs mt-1 opacity-75">
                    {category.descripcion}
                  </div>
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
                  <h4 className="text-md font-medium text-gray-300 mb-2">
                    Subcategorías:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {getSubcategories(selectedCategory.id).map(
                      (subcategory: MenuCategory) => (
                        <div
                          key={subcategory.id}
                          className="bg-gray-700 rounded-lg p-3"
                        >
                          <h5 className="font-medium text-white mb-2">
                            {subcategory.nombre}
                          </h5>

                          {/* Productos de la subcategoría */}
                          <div className="space-y-2">
                            {getProductsForCategory(subcategory.id).map(
                              (product: MenuItem) => (
                                <div
                                  key={product.id}
                                  className="bg-gray-600 rounded-md p-3"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h6 className="font-medium text-white text-sm">
                                        {product.nombre}
                                      </h6>
                                      {product.descripcion && (
                                        <p className="text-gray-300 text-xs mt-1">
                                          {product.descripcion}
                                        </p>
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
                                          Botella: $
                                          {product.precioBotella.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}

                            {getProductsForCategory(subcategory.id).length ===
                              0 && (
                              <div className="text-center text-gray-400 py-4">
                                <p className="text-xs">
                                  No hay productos en esta subcategoría
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Productos directos de la categoría principal */}
              {getProductsForCategory(selectedCategory.id).map(
                (product: MenuItem) => (
                  <div key={product.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">
                          {product.nombre}
                        </h4>
                        {product.descripcion && (
                          <p className="text-gray-400 text-sm mt-1">
                            {product.descripcion}
                          </p>
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
                )
              )}

              {getProductsForCategory(selectedCategory.id).length === 0 &&
                getSubcategories(selectedCategory.id).length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Coffee className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm">
                      No hay productos ni subcategorías en esta categoría
                    </p>
                  </div>
                )}
            </div>
          )}

          {!selectedCategory && (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">
                Selecciona una categoría para ver los productos
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Modal para crear/editar categorías
function CategoryModal({
  category,
  onSave,
  onClose,
}: Readonly<{
  category: MenuCategory | null;
  onSave: (data: CategoryFormData) => void;
  onClose: () => void;
}>): JSX.Element {
  const [formData, setFormData] = useState<CategoryFormData>({
    nombre: category?.nombre || '',
    orden: category?.orden || 0,
    activo: category?.activo ?? true,
    parentId: category?.parentId || null,
    businessId: category?.businessId || BUSINESS_ID,
  });

  const [categories, setCategories] = useState<MenuCategory[]>([]);

  // Cargar categorías para el selector de categoría padre
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/admin/menu?businessId=${BUSINESS_ID}`);
        if (response.ok) {
          const data = await response.json();
          // Filtrar categorías que no sean subcategorías y que no sea la categoría actual (para evitar auto-referencia)
          const parentCategories = (data.menu || []).filter(
            (cat: MenuCategory) =>
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
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4 relative z-10">
        <h3 className="text-lg font-semibold text-white mb-4">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="category-parent"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Categoría Padre (opcional)
            </label>
            <select
              id="category-parent"
              value={formData.parentId || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  parentId: e.target.value || null,
                }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
            >
              <option value="">Categoría principal</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="category-nombre"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Nombre
            </label>
            <input
              id="category-nombre"
              type="text"
              value={formData.nombre}
              onChange={e =>
                setFormData(prev => ({ ...prev, nombre: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              required
            />
          </div>

          <div>
            <label
              htmlFor="category-orden"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Orden
            </label>
            <input
              id="category-orden"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.orden}
              onChange={e => {
                if (/^\d*$/.test(e.target.value) || e.target.value === '') {
                  setFormData(prev => ({
                    ...prev,
                    orden: e.target.value === '' ? 0 : parseInt(e.target.value),
                  }));
                }
              }}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={e =>
                setFormData(prev => ({ ...prev, activo: e.target.checked }))
              }
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
function ProductModal({
  product,
  categories,
  onSave,
  onClose,
}: Readonly<{
  product: ProductData | null;
  categories: CategoryData[];
  onSave: (data: ProductData) => void;
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
    imagenUrl: product?.imagenUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Agregar la categoria basada en categoryId
    const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
    const submitData = {
      ...formData,
      categoria: selectedCategory?.nombre || formData.categoryId,
      precio: typeof formData.precio === 'string' ? parseFloat(formData.precio) || 0 : formData.precio,
      precioVaso: typeof formData.precioVaso === 'string' ? parseFloat(formData.precioVaso) || undefined : formData.precioVaso,
      precioBotella: typeof formData.precioBotella === 'string' ? parseFloat(formData.precioBotella) || undefined : formData.precioBotella
    };
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto relative z-10">
        <h3 className="text-lg font-semibold text-white mb-4">
          {product ? 'Editar Producto' : 'Nuevo Producto'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="product-categoria"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Categoría
            </label>
            <select
              id="product-categoria"
              value={formData.categoryId}
              onChange={e =>
                setFormData(prev => ({ ...prev, categoryId: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="product-nombre"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Nombre
            </label>
            <input
              id="product-nombre"
              type="text"
              value={formData.nombre}
              onChange={e =>
                setFormData(prev => ({ ...prev, nombre: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              required
            />
          </div>

          <div>
            <label
              htmlFor="product-descripcion"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="product-descripcion"
              value={formData.descripcion}
              onChange={e =>
                setFormData(prev => ({ ...prev, descripcion: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              rows={3}
            />
          </div>

          <div>
            <label
              htmlFor="product-tipo"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Tipo de Producto
            </label>
            <select
              id="product-tipo"
              value={formData.tipoProducto}
              onChange={e =>
                setFormData(prev => ({ ...prev, tipoProducto: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
            >
              <option value="simple">Simple</option>
              <option value="botella">Botella</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          {formData.tipoProducto === 'simple' && (
            <div>
              <label
                htmlFor="product-precio"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                Precio
              </label>
              <input
                id="product-precio"
                type="text"
                inputMode="decimal"
                value={formData.precio}
                onChange={e => {
                  // Permitir números y un punto decimal
                  if (
                    /^(\d*\.?\d*)$/.test(e.target.value) ||
                    e.target.value === ''
                  ) {
                    setFormData(prev => ({ ...prev, precio: e.target.value }));
                  }
                }}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              />
            </div>
          )}

          {formData.tipoProducto === 'botella' && (
            <>
              <div>
                <label
                  htmlFor="product-precio-vaso"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Precio por Vaso
                </label>
                <input
                  id="product-precio-vaso"
                  type="text"
                  inputMode="decimal"
                  value={formData.precioVaso}
                  onChange={e => {
                    // Permitir números y un punto decimal
                    if (
                      /^(\d*\.?\d*)$/.test(e.target.value) ||
                      e.target.value === ''
                    ) {
                      setFormData(prev => ({
                        ...prev,
                        precioVaso: e.target.value,
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="product-precio-botella"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Precio por Botella
                </label>
                <input
                  id="product-precio-botella"
                  type="text"
                  inputMode="decimal"
                  value={formData.precioBotella}
                  onChange={e => {
                    // Permitir números y un punto decimal
                    if (
                      /^(\d*\.?\d*)$/.test(e.target.value) ||
                      e.target.value === ''
                    ) {
                      setFormData(prev => ({
                        ...prev,
                        precioBotella: e.target.value,
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
                />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="product-imagen"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Imagen del Producto
            </label>
            <input
              id="product-imagen"
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = event => {
                    setFormData(prev => ({
                      ...prev,
                      imagenUrl: event.target?.result as string,
                    }));
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
            />
            {formData.imagenUrl && (
              <div className="mt-2">
                <Image
                  src={formData.imagenUrl}
                  alt="Preview"
                  width={80}
                  height={80}
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
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    disponible: e.target.checked,
                  }))
                }
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
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    destacado: e.target.checked,
                  }))
                }
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
function PortalContent({
  showNotification,
}: Readonly<{
  showNotification: (message: string, type: NivelTarjeta) => void;
}>) {
  const [activeTab, setActiveTab] = useState<
    'preview' | 'banners' | 'promociones' | 'recompensas' | 'favorito'
  >('preview');
  const [previewMode, setPreviewMode] = useState<ModoVistaPrevia>('portal'); // Estado para cambiar entre Portal, Login y Tarjetas
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    // Configuración de branding para el login
    businessName: 'Mi Empresa',
    primaryColor: '#3B82F6',
    carouselImages: [
      // Imágenes del carrusel (máximo 6)
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=250&fit=crop',
    ],
  });
  const [config, setConfig] = useState<GeneralConfig>({
    banners: [],
    promociones: [],
    eventos: [],
    recompensas: [],
    tarjetas: [],
    favoritoDelDia: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const response = await fetch(
        '/api/admin/portal-config?businessId=default'
      );
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
            },
          ],
          promociones: [
            {
              id: '1',
              titulo: '2x1 en Cócteles',
              descripcion: 'Válido hasta el domingo',
              descuento: 50,
              activo: true,
            },
          ],
          eventos: [
            {
              id: '1',
              titulo: 'Música en vivo',
              descripcion: 'Todos los viernes a partir de las 8pm',
              fecha: '2025-09-03',
              activo: true,
            },
          ],
          recompensas: [
            {
              id: '1',
              nombre: 'Postre gratis',
              descripcion: 'Elige cualquier postre de nuestra carta',
              puntosRequeridos: 150,
              activo: true,
              stock: 50,
            },
          ],
          tarjetas: [],
        });
      }
    } catch (error) {
      console.error('Error loading portal config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    try {
      console.log('💾 Admin - Guardando config:', config);
      const response = await fetch('/api/admin/portal-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          businessId: 'default',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }

      const result = await response.json();
      console.log('✅ Admin - Config guardada exitosamente:', result);
    } catch (error) {
      console.error('❌ Admin - Error saving portal config:', error);
    }
  }, [config]);

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
  }, [config, handleSave]);

  const handleBrandingChange = async (
    field: string,
    value: string | string[]
  ) => {
    const newConfig = {
      ...brandingConfig,
      [field]: value,
    };

    setBrandingConfig(newConfig);

    try {
      // Guardar en la API (funcionará entre diferentes dominios/puertos)
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      if (response.ok) {
        // Crear una versión reducida para localStorage (sin imágenes base64)
        const lightConfig = {
          ...newConfig,
          carouselImages: newConfig.carouselImages?.length || 0, // Solo guardar la cantidad
        };

        try {
          localStorage.setItem('portalBranding', JSON.stringify(lightConfig));
        } catch (storageError) {
          console.warn(
            'localStorage lleno, limpiando datos antiguos:',
            storageError
          );
          // Limpiar localStorage y guardar solo lo esencial
          localStorage.removeItem('portalBranding');
          localStorage.setItem(
            'portalBranding',
            JSON.stringify({
              businessName: newConfig.businessName,
              primaryColor: newConfig.primaryColor,
              carouselImages: [], // No guardar imágenes en localStorage
            })
          );
        }
      } else {
        console.error('Admin: Error guardando branding en API');
      }
    } catch (error) {
      console.error('Admin: Error conectando con API:', error);
      // En caso de error de API, guardar solo datos básicos en localStorage
      try {
        const basicConfig = {
          businessName: newConfig.businessName,
          primaryColor: newConfig.primaryColor,
          carouselImages: [], // No guardar imágenes pesadas en localStorage
        };
        localStorage.setItem('portalBranding', JSON.stringify(basicConfig));
      } catch (storageError) {
        console.warn(
          'No se pudo guardar en localStorage, espacio insuficiente:',
          storageError
        );
      }
    }
  };

  // Funciones para manejar las imágenes del carrusel
  const handleCarouselImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async e => {
        const imageUrl = e.target?.result as string;
        const currentImages = brandingConfig.carouselImages || [];

        // Verificar que no exceda el límite de 6 imágenes
        if (currentImages.length >= 6) {
          alert('Máximo 6 imágenes permitidas');
          return;
        }

        const newImages = [...currentImages, imageUrl];
        await handleBrandingChange('carouselImages', newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCarouselImage = async (index: number) => {
    const currentImages = brandingConfig.carouselImages || [];
    const newImages = currentImages.filter(
      (_: string, i: number) => i !== index
    );
    await handleBrandingChange('carouselImages', newImages);
  };

  // Cargar branding desde la API al montar el componente
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await fetch('/api/branding');
        if (response.ok) {
          const branding = await response.json();
          setBrandingConfig(branding);
          // Guardar versión ligera en localStorage
          try {
            const lightConfig = {
              ...branding,
              carouselImages: branding.carouselImages?.length || 0, // Solo guardar la cantidad
            };
            localStorage.setItem('portalBranding', JSON.stringify(lightConfig));
          } catch (storageError) {
            console.warn('No se pudo guardar en localStorage:', storageError);
          }
        } else {
          console.error('Admin: Error cargando branding desde API');
          // Fallback a localStorage (datos básicos solamente)
          const savedBranding = localStorage.getItem('portalBranding');
          if (savedBranding) {
            const parsed = JSON.parse(savedBranding);
            // Si localStorage solo tiene datos básicos, usar valores por defecto para imágenes
            setBrandingConfig({
              ...parsed,
              carouselImages: parsed.carouselImages || [],
            });
          }
        }
      } catch (error) {
        console.error('Admin: Error conectando con API:', error);
        // Fallback a localStorage
        const savedBranding = localStorage.getItem('portalBranding');
        if (savedBranding) {
          try {
            const parsed = JSON.parse(savedBranding);
            setBrandingConfig({
              ...parsed,
              carouselImages: parsed.carouselImages || [],
            });
          } catch (parseError) {
            console.error('Admin: Error parsing localStorage:', parseError);
          }
        }
      }
    };

    loadBranding();
  }, []);

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
        <div className="flex items-center">
          <button
            onClick={() =>
              window.open('http://localhost:3001/cliente', '_blank')
            }
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
          { id: 'recompensas', label: 'Recompensas', icon: Gift },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        brandingConfig={brandingConfig}
        setBrandingConfig={setBrandingConfig}
        handleBrandingChange={handleBrandingChange}
        handleCarouselImageUpload={handleCarouselImageUpload}
        handleRemoveCarouselImage={handleRemoveCarouselImage}
        showNotification={showNotification}
      />
    </div>
  );
}

// Componente principal que maneja el contenido del portal según la pestaña activa
function PortalContentManager({
  activeTab,
  config,
  setConfig,
  previewMode,
  setPreviewMode,
  brandingConfig,
  handleBrandingChange,
  handleCarouselImageUpload,
  handleRemoveCarouselImage,
  showNotification,
}: Readonly<{
  activeTab: string;
  config: GeneralConfig;
  setConfig: React.Dispatch<React.SetStateAction<GeneralConfig>>;
  previewMode: ModoVistaPrevia;
  setPreviewMode: React.Dispatch<React.SetStateAction<ModoVistaPrevia>>;
  brandingConfig: BrandingConfig;
  setBrandingConfig: (config: BrandingConfig) => void;
  handleBrandingChange: (
    field: string,
    value: string | string[]
  ) => Promise<void>;
  handleCarouselImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveCarouselImage: (index: number) => void;
  showNotification: (message: string, type: NivelTarjeta) => void;
}>) {
  // Función para sincronización manual
  const handleSyncToClient = async () => {
    try {
      console.log('🔄 Admin - Sincronizando promociones con el cliente:', config.promociones);
      const response = await fetch('/api/admin/portal-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          businessId: 'default',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al sincronizar con el cliente');
      }

      const result = await response.json();
      console.log('✅ Admin - Promociones sincronizadas exitosamente:', result);
      showNotification('✅ Promociones sincronizadas con el portal del cliente', 'success');
    } catch (error) {
      console.error('❌ Admin - Error sincronizando promociones:', error);
      showNotification('❌ Error al sincronizar promociones', 'error');
    }
  };

// Tipos para items de configuración
type ConfigurableItem = Banner | Promocion | Recompensa | {
  id: string;
  dia: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  imagenUrl?: string;
  activo?: boolean;
};

type ConfigurableItemType = 'banners' | 'promociones' | 'recompensas' | 'favoritoDelDia' | 'eventos';

  const addItem = (type: ConfigurableItemType, item: ConfigurableItem) => {
    const newItem = {
      ...item,
      id: item.id || `${type}_${Date.now()}`,
      activo: true,
    };

    setConfig((prev: GeneralConfig): GeneralConfig => {
      // Caso especial para favoritoDelDia
      if (type === 'favoritoDelDia') {
        // Asegurar que favoritoDelDia sea un array
        const currentFavoritos = Array.isArray(prev.favoritoDelDia) 
          ? prev.favoritoDelDia 
          : [];
        
        // Buscar si ya existe un favorito para este día
        const existingIndex = currentFavoritos.findIndex(
          (f: FavoritoDelDia) => isFavoritoWithDia(f) && f.dia === getFavoritoProperty(item, 'dia')
        );

        if (existingIndex >= 0) {
          // Actualizar favorito existente
          const updatedFavoritos = [...currentFavoritos];
          updatedFavoritos[existingIndex] = newItem;
          return {
            ...prev,
            favoritoDelDia: updatedFavoritos,
          };
        } else {
          // Agregar nuevo favorito
          return {
            ...prev,
            favoritoDelDia: [...currentFavoritos, newItem],
          };
        }
      }
      
      // Caso normal para otros tipos
      return {
        ...prev,
        [type]: [...(prev[type] || []), newItem],
      };
    });
  };

  const updateItem = (type: ConfigurableItemType, itemId: string, updates: Partial<ConfigurableItem>) => {
    setConfig((prev: GeneralConfig): GeneralConfig => {
      // Caso especial para favoritoDelDia
      if (type === 'favoritoDelDia') {
        const currentFavoritos = Array.isArray(prev.favoritoDelDia) 
          ? prev.favoritoDelDia 
          : [];
        
        return {
          ...prev,
          favoritoDelDia: currentFavoritos.map((item: FavoritoDelDia) =>
            isFavoritoWithId(item) && item.id === itemId ? { ...item, ...updates } : item
          ),
        };
      }
      
      // Caso normal para otros tipos
      return {
        ...prev,
        [type]: (prev[type] || []).map((item: { id?: string }) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      };
    });
  };

  const deleteItem = (type: ConfigurableItemType, itemId: string) => {
    if (
      window.confirm('¿Estás seguro de que quieres eliminar este elemento?')
    ) {
      setConfig((prev: GeneralConfig): GeneralConfig => {
        // Caso especial para favoritoDelDia
        if (type === 'favoritoDelDia') {
          const currentFavoritos = Array.isArray(prev.favoritoDelDia) 
            ? prev.favoritoDelDia 
            : [];
          
          return {
            ...prev,
            favoritoDelDia: currentFavoritos.filter((item: FavoritoDelDia) => 
              !isFavoritoWithId(item) || item.id !== itemId
            ),
          };
        }
        
        // Caso normal para otros tipos
        return {
          ...prev,
          [type]: (prev[type] || []).filter((item: { id?: string }) => item.id !== itemId),
        };
      });
    }
  };

  const toggleActive = (type: ConfigurableItemType, itemId: string) => {
    setConfig((prev: GeneralConfig): GeneralConfig => {
      // Caso especial para favoritoDelDia
      if (type === 'favoritoDelDia') {
        const currentFavoritos = Array.isArray(prev.favoritoDelDia) 
          ? prev.favoritoDelDia 
          : [];
        
        return {
          ...prev,
          favoritoDelDia: currentFavoritos.map((item: FavoritoDelDia) =>
            item.id === itemId ? { ...item, activo: !item.activo } : item
          ),
        };
      }
      
      // Caso normal para otros tipos
      return {
        ...prev,
        [type]: (prev[type] || []).map((item: { id?: string; activo?: boolean }) =>
          item.id === itemId ? { ...item, activo: !item.activo } : item
        ),
      };
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Vista Previa del Portal */}
      <div className="premium-card">
        <div className="flex items-center justify-center mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center absolute left-6">
            <Smartphone className="w-5 h-5 mr-2" />
          </h4>

          {/* Botones Switch para Portal/Login/Tarjetas */}
          <div className="flex bg-dark-700 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('portal')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                previewMode === 'portal'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Portal Cliente
            </button>
            <button
              onClick={() => setPreviewMode('login')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                previewMode === 'login'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Branding
            </button>
            <button
              onClick={() => setPreviewMode('tarjetas')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                previewMode === 'tarjetas'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Tarjetas
            </button>
          </div>
        </div>
        <div className="bg-dark-950 rounded-xl p-4 border border-dark-700">
          {previewMode === 'portal' ? (
            // Vista Previa del Portal
            <div className="bg-black text-white min-h-96 max-w-xs mx-auto rounded-xl overflow-hidden border border-dark-600">
              {/* Header del móvil */}
              <div className="flex items-center justify-between p-4">
                <h1 className="text-lg">
                  Hola,{' '}
                  <span className="text-pink-500 font-semibold">Cliente</span>
                </h1>
                <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
              </div>

              {/* Balance Card */}
              <div className="mx-4 mb-4">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-4">
                  <div className="text-white/80 text-sm mb-1">
                    Balance de Puntos
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">---</div>
                  <div className="text-white/60 text-xs">Vista previa del cliente</div>
                </div>
              </div>

              {/* Evento del día */}
              {(config.banners || []).filter((b: Banner) => b.activo && b.imagenUrl && b.imagenUrl.trim() !== '')
                .length > 0 && (
                <div className="mx-4 mb-3">
                  <h3 className="text-white font-semibold text-sm mb-2">
                    Evento del día
                  </h3>
                  {(config.banners || [])
                    .filter((b: Banner) => b.activo && b.imagenUrl && b.imagenUrl.trim() !== '')
                    .slice(0, 1)
                    .map((banner: Banner) => (
                      <div
                        key={banner.id}
                        className="relative overflow-hidden rounded-xl"
                      >
                        <img
                          src={banner.imagenUrl}
                          alt="Evento del día"
                          className="w-full h-36 object-cover"
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Promociones */}
              {getPromocionesList(config.promociones).filter((p: Promocion) => p.activo && p.titulo && p.descripcion).length > 0 && (
                <div className="mx-4 mb-3">
                  <h3 className="text-white font-semibold text-sm mb-2">
                    Promociones Especiales
                  </h3>
                  {(getPromocionesList(config.promociones) || [])
                    .filter((p: Promocion) => p.activo && p.titulo && p.descripcion)
                    .slice(0, 2)
                    .map((promo: Promocion) => (
                      <div
                        key={promo.id}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-3 mb-2"
                      >
                        <h4 className="text-white font-medium text-sm">
                          {promo.titulo}
                        </h4>
                        <p className="text-white/80 text-xs">
                          {promo.descripcion}
                        </p>
                      </div>
                    ))}
                </div>
              )}

              {/* Favorito del Día */}
              {(() => {
                // Obtener el día actual
                const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
                const diaActual = diasSemana[new Date().getDay()];
                
                // Buscar favorito para el día actual
                const favoritoHoy = Array.isArray(config.favoritoDelDia) 
                  ? config.favoritoDelDia.find((f: FavoritoDelDia) => 
                      f.dia === diaActual && f.activo && f.imagenUrl && f.imagenUrl.trim() !== ''
                    )
                  : null;

                // Si no hay favorito para hoy, buscar el primer favorito activo
                const favoritoFallback = Array.isArray(config.favoritoDelDia)
                  ? config.favoritoDelDia.find((f: FavoritoDelDia) => 
                      f.activo && f.imagenUrl && f.imagenUrl.trim() !== ''
                    )
                  : null;

                const favoritoMostrar = favoritoHoy || favoritoFallback;

                return favoritoMostrar && (
                  <div className="mx-4 mb-3">
                    <h3 className="text-white font-semibold text-sm mb-2">
                      Favorito del día
                    </h3>
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={getFavoritoProperty(favoritoMostrar, 'imagenUrl') as string}
                        alt="Favorito del día"
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-2 left-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">⭐</span>
                          </div>
                          <span className="text-white font-medium text-xs">
                            Favorito del {favoritoHoy ? 'Día' : `${String(getFavoritoProperty(favoritoMostrar, 'dia')) || 'Día'}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Recompensas */}
              {getRecompensasList(config.recompensas).filter((r: Recompensa) => r.activo && r.nombre && r.puntosRequeridos).length > 0 && (
                <div className="mx-4 mb-3">
                  <h3 className="text-white font-semibold text-sm mb-2">
                    Recompensas
                  </h3>
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Gift className="w-4 h-4 text-white" />
                      <span className="text-white font-medium text-sm">
                        Programa de Puntos
                      </span>
                    </div>
                    <div className="flex overflow-x-auto space-x-2 pb-1">
                      {getRecompensasList(config.recompensas)
                        .filter((r: Recompensa) => r.activo && r.nombre && r.puntosRequeridos)
                        .slice(0, 3)
                        .map((recompensa: Recompensa) => (
                          <div
                            key={recompensa.id}
                            className="bg-white/20 rounded-lg p-2 min-w-[120px]"
                          >
                            <div className="text-white font-medium text-xs">
                              {recompensa.nombre}
                            </div>
                            <div className="text-white font-bold text-xs">
                              {recompensa.puntosRequeridos} pts
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Estado vacío cuando no hay contenido configurado */}
              {(!config.banners?.filter((b: Banner) => b.activo && b.imagenUrl && b.imagenUrl.trim() !== '').length &&
                !isFavoritoActivo(config.favoritoDelDia) &&
                !getPromocionesList(config.promociones).filter((p: Promocion) => p.activo && p.titulo && p.descripcion).length &&
                !getRecompensasList(config.recompensas).filter((r: Recompensa) => r.activo && r.nombre && r.puntosRequeridos).length) && (
                <div className="mx-4 mb-4 text-center py-8">
                  <div className="text-white/50 text-sm mb-2">
                    👆 Configure contenido arriba
                  </div>
                  <div className="text-white/30 text-xs">
                    El portal se mostrará limpio hasta que agregue banners, promociones, recompensas o favoritos del día
                  </div>
                </div>
              )}
            </div>
          ) : (
            (() => {
              if (previewMode === 'login') {
                // Vista Previa del Login del Cliente
                return (
                  <div className="bg-black text-white min-h-96 max-w-xs mx-auto rounded-xl overflow-hidden border border-dark-600">
                    {/* Header del portal del cliente */}
                    <div className="flex items-center justify-center p-4">
                      <span className="text-white font-bold text-lg">
                        {brandingConfig.businessName || 'LEALTA'}
                      </span>
                    </div>

                    {/* Hero Section */}
                    <div className="relative h-40 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
                        <h1 className="text-lg font-bold text-white mb-2">
                          Descubre Nuestro Menú
                        </h1>

                        {/* Carrusel de imágenes - Vista previa (primeros 3) */}
                        {brandingConfig.carouselImages?.length > 0 && (
                          <div className="mb-3">
                            <div className="flex space-x-1 justify-center">
                              {brandingConfig.carouselImages
                                .slice(0, 3)
                                .map((image: string, index: number) => (
                                  <div
                                    key={`carousel-preview-${index}-${image.substring(0, 10)}`}
                                    className="w-16 h-10 relative overflow-hidden rounded"
                                  >
                                    <img
                                      src={image}
                                      alt={`Carrusel ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              {brandingConfig.carouselImages.length > 3 && (
                                <div className="w-16 h-10 bg-black/70 rounded flex items-center justify-center">
                                  <span className="text-white text-xs">
                                    +{brandingConfig.carouselImages.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-white/60 text-xs mt-1 text-center">
                              Carrusel de Imágenes
                            </p>
                          </div>
                        )}

                        <button
                          className="text-white px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1 text-xs"
                          style={{
                            backgroundColor:
                              brandingConfig.primaryColor || '#2563EB',
                          }}
                        >
                          <IdCard className="w-3 h-3" />
                          <span>Acceder con Cédula</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Vista Previa de Tarjetas
                return <TarjetaPreviewComponent config={config} />;
              }
            })()
          )}
        </div>
      </div>

      {/* Panel de Edición */}
      <div className="premium-card">
        {(() => {
          if (activeTab === 'preview' && previewMode === 'login') {
            // Configuración de Branding para Login
            return (
              <div>
                <div className="flex items-center mb-6">
                  <Building className="w-6 h-6 mr-2 text-primary-500" />
                  <h4 className="text-lg font-semibold text-white">
                    Branding del Portal Cliente
                  </h4>
                </div>

                <div className="space-y-6">
                  {/* Nombre del Negocio */}
                  <div>
                    <label
                      htmlFor="business-name"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Nombre del Negocio
                    </label>
                    <input
                      type="text"
                      id="business-name"
                      value={brandingConfig.businessName}
                      onChange={e =>
                        handleBrandingChange('businessName', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="LEALTA"
                    />
                    <p className="text-dark-400 text-xs mt-1">
                      Aparece en la esquina superior izquierda del portal
                    </p>
                  </div>

                  {/* Imágenes del Carrusel */}
                  <div>
                    <div className="block text-sm font-medium text-white mb-2">
                      Imágenes del Carrusel (máx. 6)
                    </div>
                    <div className="space-y-4">
                      {/* Grid de imágenes actuales */}
                      <div className="grid grid-cols-2 gap-3">
                        {brandingConfig.carouselImages?.map(
                          (imageUrl: string, index: number) => (
                            <div
                              key={`carousel-${index}-${imageUrl.substring(0, 20)}`}
                              className="relative group"
                            >
                              <img
                                src={imageUrl}
                                alt={`Carrusel ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-dark-600"
                              />
                              <button
                                onClick={() => handleRemoveCarouselImage(index)}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                                {index + 1}
                              </div>
                            </div>
                          )
                        )}

                        {/* Botón para agregar nueva imagen */}
                        {(!brandingConfig.carouselImages ||
                          brandingConfig.carouselImages.length < 6) && (
                          <div className="relative">
                            <input
                              type="file"
                              id={`carousel-upload`}
                              accept="image/*"
                              onChange={handleCarouselImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="w-full h-24 border-2 border-dashed border-dark-600 rounded-lg flex flex-col items-center justify-center text-dark-400 hover:border-primary-500 hover:text-primary-400 transition-colors cursor-pointer">
                              <svg
                                className="w-6 h-6 mb-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              <span className="text-xs">Agregar</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Información y controles */}
                      <div className="bg-dark-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-sm font-medium">
                            {brandingConfig.carouselImages?.length || 0} / 6
                            imágenes
                          </span>
                          <button
                            onClick={() =>
                              handleBrandingChange('carouselImages', [])
                            }
                            className="text-red-400 hover:text-red-300 text-xs"
                            disabled={!brandingConfig.carouselImages?.length}
                          >
                            Limpiar todo
                          </button>
                        </div>
                        <p className="text-dark-400 text-xs">
                          Las imágenes aparecen en el carrusel del login con
                          rotación automática cada 6 segundos
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Color Primario */}
                  <div>
                    <label
                      htmlFor="primary-color"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Color Primario
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        id="primary-color"
                        value={brandingConfig.primaryColor}
                        onChange={e =>
                          handleBrandingChange('primaryColor', e.target.value)
                        }
                        className="w-12 h-10 rounded-lg border-2 border-dark-600 bg-dark-800"
                      />
                      <input
                        type="text"
                        value={brandingConfig.primaryColor}
                        onChange={e =>
                          handleBrandingChange('primaryColor', e.target.value)
                        }
                        className="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="#2563EB"
                      />
                    </div>
                    <p className="text-dark-400 text-xs mt-1">
                      Color del botón &ldquo;Acceder con Cédula&rdquo; y otros
                      elementos
                    </p>
                  </div>

                  {/* Vista previa de cambios */}
                  <div className="bg-dark-800 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-2">
                      Configuración Actual:
                    </h5>
                    <ul className="space-y-1 text-sm text-dark-300">
                      <li>
                        • Nombre:{' '}
                        {brandingConfig.businessName ||
                          'LEALTA (predeterminado)'}
                      </li>
                      <li>
                        • Carrusel: {brandingConfig.carouselImages?.length || 0}{' '}
                        imágenes configuradas
                      </li>
                      <li>• Color: {brandingConfig.primaryColor}</li>
                    </ul>
                  </div>

                  {/* Botón de Actualizar */}
                  <div className="pt-4 border-t border-dark-700 space-y-3">
                    <button
                      onClick={() => {
                        // Crear versión ligera para localStorage (sin imágenes base64)
                        const lightConfig = {
                          ...brandingConfig,
                          carouselImages:
                            brandingConfig.carouselImages?.length || 0, // Solo guardar la cantidad
                        };

                        try {
                          localStorage.setItem(
                            'portalBranding',
                            JSON.stringify(lightConfig)
                          );
                        } catch (storageError) {
                          console.warn(
                            'localStorage lleno, usando solo datos básicos:',
                            storageError
                          );
                          // Guardar solo datos esenciales
                          const basicConfig = {
                            businessName: brandingConfig.businessName,
                            primaryColor: brandingConfig.primaryColor,
                            carouselImages: [],
                          };
                          try {
                            localStorage.removeItem('portalBranding');
                            localStorage.setItem(
                              'portalBranding',
                              JSON.stringify(basicConfig)
                            );
                          } catch (finalError) {
                            console.error(
                              'No se pudo actualizar localStorage:',
                              finalError
                            );
                          }
                        }

                        // Enviar evento personalizado para notificar a otras pestañas
                        window.dispatchEvent(
                          new CustomEvent('brandingUpdated', {
                            detail: brandingConfig,
                          })
                        );

                        console.log(
                          'Evento brandingUpdated disparado con carrusel:',
                          brandingConfig.carouselImages?.length || 0,
                          'imágenes'
                        );

                        // También usar storage event para otras pestañas
                        localStorage.setItem(
                          'brandingTrigger',
                          Date.now().toString()
                        );

                        // Mostrar feedback visual
                        const btn = document.activeElement as HTMLButtonElement;
                        const originalText = btn?.textContent;
                        if (btn) {
                          btn.textContent =
                            '✅ Actualizado - Recarga el portal cliente';
                          btn.disabled = true;
                          setTimeout(() => {
                            btn.textContent = originalText;
                            btn.disabled = false;
                          }, 3000);
                        }
                      }}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Actualizar Portal Cliente</span>
                    </button>

                    <button
                      onClick={() => {
                        // Guardar versión ligera antes de abrir
                        const lightConfig = {
                          ...brandingConfig,
                          carouselImages:
                            brandingConfig.carouselImages?.length || 0,
                        };

                        try {
                          localStorage.setItem(
                            'portalBranding',
                            JSON.stringify(lightConfig)
                          );
                        } catch (storageError) {
                          console.warn(
                            'localStorage lleno, usando datos básicos para portal:',
                            storageError
                          );
                          const basicConfig = {
                            businessName: brandingConfig.businessName,
                            primaryColor: brandingConfig.primaryColor,
                            carouselImages: [],
                          };
                          try {
                            localStorage.removeItem('portalBranding');
                            localStorage.setItem(
                              'portalBranding',
                              JSON.stringify(basicConfig)
                            );
                          } catch (finalError) {
                            console.error(
                              'No se pudo preparar datos para el portal:',
                              finalError
                            );
                          }
                        }

                        // Abrir portal del cliente en nueva pestaña
                        window.open('/cliente', '_blank');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver Portal Cliente Real</span>
                    </button>

                    <p className="text-dark-400 text-xs text-center">
                      Usa "Actualizar" para sincronizar cambios, luego "Ver
                      Portal" para verificar en una nueva pestaña.
                    </p>
                  </div>
                </div>
              </div>
            );
          } else if (activeTab === 'preview' && previewMode === 'tarjetas') {
            // Configuración de Tarjetas
            return (
              <div className="space-y-6">
                <AsignacionTarjetasComponent
                  showNotification={showNotification}
                />
                <TarjetaEditorComponent
                  config={config}
                  setConfig={setConfig}
                  showNotification={showNotification}
                />
              </div>
            );
          } else if (activeTab === 'preview') {
            // Vista previa normal del portal
            return (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 mx-auto mb-4 text-primary-500" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  Vista Previa en Tiempo Real
                </h4>
                <p className="text-dark-400 mb-4">
                  Esta vista muestra cómo verán los clientes tu portal. Los
                  cambios se reflejan automáticamente.
                </p>
                <div className="bg-dark-800 rounded-lg p-4 text-left">
                  <h5 className="text-white font-medium mb-2">
                    Elementos Activos:
                  </h5>
                  <ul className="space-y-1 text-sm text-dark-300">
                    <li>
                      • {(config.banners || []).filter((b: Banner) => b.activo).length}{' '}
                      Banners activos
                    </li>
                    <li>
                      • {getPromocionesList(config.promociones).filter((p: Promocion) => p.activo).length}{' '}
                      Promociones activas
                    </li>
                    <li>
                      • {isFavoritoActivo(config.favoritoDelDia) ? '1' : '0'} Favorito del
                      día activo
                    </li>
                    <li>
                      • {getRecompensasList(config.recompensas).filter((r: Recompensa) => r.activo).length}{' '}
                      Recompensas activas
                    </li>
                  </ul>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {activeTab === 'banners' && (
          <BannersManager
            banners={config.banners || []}
            onAdd={(banner: Banner) => addItem('banners', banner)}
            onUpdate={(id: string, updates: Partial<Banner>) =>
              updateItem('banners', id, updates)
            }
            onDelete={(id: string) => deleteItem('banners', id)}
            onToggle={(id: string) => toggleActive('banners', id)}
          />
        )}

        {activeTab === 'promociones' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Promociones</h2>
              <button
                onClick={handleSyncToClient}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sincronizar con Cliente
              </button>
            </div>
            <PromocionesManager
              promociones={getPromocionesList(config.promociones)}
              onAdd={(promo: Promocion) => addItem('promociones', promo)}
              onUpdate={(id: string, updates: Partial<Promocion>) =>
                updateItem('promociones', id, updates)
              }
              onDelete={(id: string) => deleteItem('promociones', id)}
              onToggle={(id: string) => toggleActive('promociones', id)}
            />
          </div>
        )}

        {activeTab === 'favorito' && (
          <FavoritoDelDiaManager
            favoritos={getFavoritosList(config.favoritoDelDia)}
            onUpdate={(favorito: FavoritoDelDia) => {
              // Verificar si ya existe un favorito para este día
              const currentFavoritos = Array.isArray(config.favoritoDelDia) 
                ? config.favoritoDelDia 
                : [];
              
              const existingFavorito = currentFavoritos.find(
                (f: FavoritoDelDia) => f.dia === favorito.dia
              );

              if (existingFavorito) {
                // Actualizar favorito existente
                const existingId = getFavoritoProperty(existingFavorito, 'id') as string;
                updateItem('favoritoDelDia', existingId, favorito);
              } else {
                // Crear nuevo favorito
                addItem('favoritoDelDia', favorito);
              }
              showNotification('Favorito del día actualizado correctamente', 'success');
            }}
            onDelete={(favoritoId: string) => {
              deleteItem('favoritoDelDia', favoritoId);
              showNotification('Favorito del día eliminado correctamente', 'success');
            }}
            onToggle={(favoritoId: string) => {
              toggleActive('favoritoDelDia', favoritoId);
              showNotification('Estado del favorito del día actualizado', 'success');
            }}
          />
        )}

        {activeTab === 'recompensas' && (
          <RecompensasManager
            recompensas={getRecompensasList(config.recompensas)}
            onAdd={(recompensa: Recompensa) => addItem('recompensas', recompensa)}
            onUpdate={(id: string, updates: Partial<Recompensa>) =>
              updateItem('recompensas', id, updates)
            }
            onDelete={(id: string) => deleteItem('recompensas', id)}
            onToggle={(id: string) => toggleActive('recompensas', id)}
          />
        )}
      </div>
    </div>
  );
}

// Componentes de gestión para cada sección
function BannersManager({
  banners,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}: Readonly<{
  banners: Banner[];
  onAdd: (banner: Banner) => void;
  onUpdate: (id: string, banner: Partial<Banner>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}>) {
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [publishTime, setPublishTime] = useState('04:00');
  const [formData, setFormData] = useState({
    dia: 'lunes',
    imagenUrl: '',
    horaPublicacion: '04:00',
  });
  const [uploading, setUploading] = useState(false);
  const { selectedFile, handleFileChange, resetFile } =
    useFileUpload(setFormData);

  const diasSemana = [
    { value: 'lunes', label: 'L' },
    { value: 'martes', label: 'M' },
    { value: 'miercoles', label: 'X' },
    { value: 'jueves', label: 'J' },
    { value: 'viernes', label: 'V' },
    { value: 'sabado', label: 'S' },
    { value: 'domingo', label: 'D' },
  ];

  const diasCompletos = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  const bannerPorDia = banners.find((b: Banner) => b.dia === selectedDay);

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
          body: formDataUpload,
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
      activo: true,
    };

    if (bannerPorDia?.id) {
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
          Configura banners para cada día de la semana. Se publicarán
          automáticamente a la hora especificada.
        </p>
      </div>

      {/* Selector de día */}
      <div className="bg-dark-800 rounded-lg p-4 mb-4">
        <h5 className="text-white font-medium mb-3">Seleccionar Día</h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => (
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
            <label
              htmlFor="publishTime"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Hora de Publicación (día siguiente)
            </label>
            <input
              id="publishTime"
              type="time"
              value={publishTime}
              onChange={e => setPublishTime(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white"
              required
            />
            <p className="text-xs text-dark-400 mt-1">
              Se publicará el día siguiente a esta hora (trabajamos de 6pm a
              3am)
            </p>
          </div>

          <div>
            <label
              htmlFor="bannerImage"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
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
            {bannerPorDia?.id && (
              <button
                type="button"
                onClick={() => onDelete(bannerPorDia.id!)}
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
                onClick={() => bannerPorDia.id && onToggle(bannerPorDia.id)}
                disabled={!bannerPorDia.id}
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

function FavoritoDelDiaManager({
  favoritos,
  onUpdate,
  onDelete,
  onToggle,
}: Readonly<{
  favoritos: FavoritoDelDia[];
  onUpdate: (favorito: FavoritoDelDia) => void;
  onDelete: (favoritoId: string) => void;
  onToggle: (favoritoId: string) => void;
}>) {
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [publishTime, setPublishTime] = useState('09:00');
  const [formData, setFormData] = useState({
    imagenUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const { selectedFile, handleFileChange } = useFileUpload(setFormData);

  // Días de la semana
  const diasSemana = [
    { value: 'lunes', label: 'Lun' },
    { value: 'martes', label: 'Mar' },
    { value: 'miercoles', label: 'Mié' },
    { value: 'jueves', label: 'Jue' },
    { value: 'viernes', label: 'Vie' },
    { value: 'sabado', label: 'Sáb' },
    { value: 'domingo', label: 'Dom' },
  ];

  const diasCompletos = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  // Encontrar favorito para el día seleccionado
  const favoritoPorDia = Array.isArray(favoritos) 
    ? favoritos.find(f => f.dia === selectedDay)
    : null;

  // Actualizar formulario cuando cambia el día seleccionado
  useEffect(() => {
    if (favoritoPorDia) {
      setFormData({
        imagenUrl: favoritoPorDia.imagenUrl || '',
      });
      setPublishTime(favoritoPorDia.horaPublicacion || '09:00');
    } else {
      setFormData({
        imagenUrl: '',
      });
      setPublishTime('09:00');
    }
  }, [selectedDay, favoritoPorDia]);

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
          body: formDataUpload,
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
      id: favoritoPorDia?.id,
      dia: selectedDay,
      imagenUrl: imageUrl,
      horaPublicacion: publishTime,
      activo: true,
    };

    onUpdate(dataToSubmit);
    setUploading(false);
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">
          Favorito del Día
        </h4>
        <p className="text-dark-400 text-sm mb-4">
          Configura favoritos destacados para cada día de la semana. Se publicarán
          automáticamente a la hora especificada.
        </p>
      </div>

      {/* Selector de día */}
      <div className="bg-dark-800 rounded-lg p-4 mb-4">
        <h5 className="text-white font-medium mb-3">Seleccionar Día</h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => (
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
          Favorito para {diasCompletos[selectedDay as keyof typeof diasCompletos]}
        </h5>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="publishTime"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Hora de Publicación
            </label>
            <input
              id="publishTime"
              type="time"
              value={publishTime}
              onChange={e => setPublishTime(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white"
              required
            />
            <p className="text-xs text-dark-400 mt-1">
              Hora en la que se destacará el favorito del día
            </p>
          </div>

          <div>
            <label
              htmlFor="favoritoImage"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Imagen del Favorito
            </label>
            <input
              id="favoritoImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
              required={!favoritoPorDia?.imagenUrl}
            />
          </div>

          {(formData.imagenUrl || favoritoPorDia?.imagenUrl) && (
            <div>
              <p className="text-sm text-dark-300 mb-2">Vista previa:</p>
              <img
                src={formData.imagenUrl || favoritoPorDia?.imagenUrl}
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
                return favoritoPorDia ? 'Actualizar' : 'Crear';
              })()}
            </button>
            {favoritoPorDia?.id && (
              <button
                type="button"
                onClick={() => onDelete(favoritoPorDia.id!)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </form>

        {favoritoPorDia && (
          <div className="mt-4 p-3 bg-dark-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-300">
                Configurado para: {favoritoPorDia.horaPublicacion}
              </span>
              <button
                onClick={() => favoritoPorDia.id && onToggle(favoritoPorDia.id)}
                disabled={!favoritoPorDia.id}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  favoritoPorDia.activo
                    ? 'bg-success-600 text-white'
                    : 'bg-dark-600 text-dark-300'
                }`}
              >
                {favoritoPorDia.activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PromocionesManager({
  promociones,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}: Readonly<{
  promociones: Promocion[];
  onAdd: (promocion: Promocion) => void;
  onUpdate: (id: string, promocion: Partial<Promocion>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}>) {
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dia: 'lunes',
    titulo: '',
    descripcion: '',
    descuento: '',
    horaTermino: '04:00',
  });
  const [isAddMode, setIsAddMode] = useState(true);

  const diasSemana = [
    { value: 'lunes', label: 'L' },
    { value: 'martes', label: 'M' },
    { value: 'miercoles', label: 'X' },
    { value: 'jueves', label: 'J' },
    { value: 'viernes', label: 'V' },
    { value: 'sabado', label: 'S' },
    { value: 'domingo', label: 'D' },
  ];

  const diasCompletos = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  const promosPorDia = promociones.filter((p: Promocion) => p.dia === selectedDay);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      dia: selectedDay,
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      descuento: formData.descuento ? parseFloat(formData.descuento) : undefined,
      horaTermino: formData.horaTermino,
      activo: true,
    };

    if (editingPromoId) {
      onUpdate(editingPromoId, dataToSubmit);
    } else {
      onAdd(dataToSubmit);
    }

    // Limpiar formulario y restablecer modo
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      dia: selectedDay,
      titulo: '',
      descripcion: '',
      descuento: '',
      horaTermino: '04:00',
    });
    setEditingPromoId(null);
    setIsAddMode(true);
  };

  const handleEditPromo = (promo: Promocion) => {
    setFormData({
      dia: promo.dia || '',
      titulo: promo.titulo || '',
      descripcion: promo.descripcion || '',
      descuento: promo.descuento?.toString() || '',
      horaTermino: promo.horaTermino || '04:00',
    });
    setEditingPromoId(promo.id || null);
    setIsAddMode(false);
  };

  const handleDaySelect = (dia: string) => {
    setSelectedDay(dia);
    resetForm();
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">
          Promociones por Día
        </h4>
        <p className="text-dark-400 text-sm mb-4">
          Configura promociones específicas para cada día de la semana. Se
          actualizan automáticamente a las 4:00 AM.
        </p>
      </div>

      {/* Selector de día */}
      <div className="bg-dark-800 rounded-lg p-4 mb-4">
        <h5 className="text-white font-medium mb-3">Seleccionar Día</h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const tienePromo = promociones.some(
              (p: Promocion) => p.dia === dia.value
            );
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

      {/* Lista de promociones para el día seleccionado */}
      <div className="bg-dark-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-white font-medium">
            Promociones para{' '}
            {diasCompletos[selectedDay as keyof typeof diasCompletos]}
          </h5>
          <button
            onClick={() => {
              resetForm();
              setIsAddMode(true);
            }}
            className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors"
          >
            Nueva Promoción
          </button>
        </div>

        {promosPorDia.length === 0 ? (
          <div className="text-center py-4 text-dark-400 text-sm">
            No hay promociones configuradas para{' '}
            {diasCompletos[selectedDay as keyof typeof diasCompletos]}
          </div>
        ) : (
          <div className="space-y-2">
            {promosPorDia.map((promo: Promocion) => (
              <div key={promo.id} className="p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <div className="text-white text-sm font-medium">
                      {promo.titulo}
                    </div>
                    <div className="text-dark-300 text-xs mt-1">
                      {promo.descripcion}
                    </div>
                    <div className="text-sm text-dark-300 mt-1">
                      {promo.descuento}% descuento hasta las {promo.horaTermino}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditPromo(promo)}
                      className="p-1.5 rounded bg-dark-600 hover:bg-dark-500 text-dark-300 hover:text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promo.id && onDelete(promo.id)}
                      disabled={!promo.id}
                      className="p-1.5 rounded bg-dark-600 hover:bg-red-600 text-dark-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promo.id && onToggle(promo.id)}
                      disabled={!promo.id}
                      className={`p-1.5 rounded ${
                        promo.activo
                          ? 'bg-success-600 text-white'
                          : 'bg-dark-600 text-dark-300 hover:text-white hover:bg-dark-500'
                      }`}
                    >
                      {promo.activo ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario para añadir/editar promoción */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">
          {isAddMode ? 'Añadir nueva promoción' : 'Editar promoción'}
        </h5>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="promoTitle"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Título de la Promoción
            </label>
            <input
              id="promoTitle"
              type="text"
              placeholder="Ej: 2x1 en Cócteles"
              value={formData.titulo}
              onChange={e =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
              required
            />
          </div>

          <div>
            <label
              htmlFor="promoDescription"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="promoDescription"
              placeholder="Descripción de la promoción..."
              value={formData.descripcion}
              onChange={e =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="promoDiscount"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                Descuento (%)
              </label>
              <input
                id="promoDiscount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="50"
                value={formData.descuento}
                onChange={e => {
                  if (/^\d*$/.test(e.target.value) || e.target.value === '') {
                    const inputValue =
                      e.target.value === '' ? '' : Number(e.target.value);
                    // Limitar valores entre 0 y 100
                    if (
                      inputValue === '' ||
                      (Number(inputValue) >= 0 && Number(inputValue) <= 100)
                    ) {
                      setFormData({
                        ...formData,
                        descuento:
                          inputValue === '' ? '0' : inputValue.toString(),
                      });
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                required
              />
            </div>

            <div>
              <label
                htmlFor="promoEndTime"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                Hora de Término (día siguiente)
              </label>
              <input
                id="promoEndTime"
                type="time"
                value={formData.horaTermino}
                onChange={e =>
                  setFormData({ ...formData, horaTermino: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white"
                required
              />
            </div>
          </div>

          <p className="text-xs text-dark-400">
            Horario de trabajo: 6pm a 3am. La promoción se actualiza
            automáticamente al día siguiente a las 4am.
          </p>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded transition-colors"
            >
              {isAddMode ? 'Crear' : 'Actualizar'} Promoción
            </button>
            {!isAddMode && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Resumen de promociones de la semana */}
      <div className="bg-dark-800 rounded-lg p-4 mt-4">
        <h6 className="text-white font-medium mb-3">Resumen de la Semana</h6>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const promo = promociones.find((p: Promocion) => p.dia === dia.value);
            return (
              <div key={dia.value} className="text-center">
                <div className="text-xs text-dark-400 mb-1">{dia.label}</div>
                <div
                  className={`text-xs p-2 rounded ${
                    promo
                      ? 'bg-success-600 text-white'
                      : 'bg-dark-700 text-dark-400'
                  }`}
                >
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

function RecompensasManager({
  recompensas,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}: Readonly<{
  recompensas: Recompensa[];
  onAdd: (recompensa: Recompensa) => void;
  onUpdate: (id: string, recompensa: Partial<Recompensa>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}>) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    puntosRequeridos: '',
    stock: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      puntosRequeridos: parseInt(formData.puntosRequeridos),
      stock: formData.stock ? parseInt(formData.stock) : undefined,
    };

    if (editingItem) {
      onUpdate(editingItem.id, data);
      setEditingItem(null);
    } else {
      onAdd(data);
    }

    setFormData({
      nombre: '',
      descripcion: '',
      puntosRequeridos: '',
      stock: '',
    });
    setShowForm(false);
  };

  const startEdit = (item: Recompensa) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      puntosRequeridos: item.puntosRequeridos?.toString() || '',
      stock: item.stock?.toString() || '',
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">
          Sistema de Recompensas
        </h4>
        <p className="text-dark-400 text-sm mb-4">
          Crea recompensas que los clientes pueden canjear usando sus puntos de
          lealtad acumulados.
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
              <label
                htmlFor="rewardName"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                Nombre de la Recompensa
              </label>
              <input
                id="rewardName"
                type="text"
                placeholder="Ej: Bebida Gratis"
                value={formData.nombre}
                onChange={e =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                required
              />
            </div>

            <div>
              <label
                htmlFor="rewardDescription"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                Descripción
              </label>
              <textarea
                id="rewardDescription"
                placeholder="Describe los detalles de la recompensa..."
                value={formData.descripcion}
                onChange={e =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rewardPoints"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Puntos Requeridos
                </label>
                <input
                  id="rewardPoints"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="100"
                  value={formData.puntosRequeridos}
                  onChange={e => {
                    if (/^\d*$/.test(e.target.value) || e.target.value === '') {
                      setFormData({
                        ...formData,
                        puntosRequeridos: e.target.value,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="rewardStock"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Stock Disponible (Opcional)
                </label>
                <input
                  id="rewardStock"
                  type="number"
                  placeholder="Dejar vacío para ilimitado"
                  value={formData.stock}
                  onChange={e =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
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
                  setFormData({
                    nombre: '',
                    descripcion: '',
                    puntosRequeridos: '',
                    stock: '',
                  });
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
            <p className="text-dark-500 text-sm">
              Agrega recompensas para incentivar la lealtad de tus clientes
            </p>
          </div>
        ) : (
          recompensas.map((recompensa: Recompensa) => (
            <div key={recompensa.id} className="bg-dark-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="text-white font-medium">
                      {recompensa.nombre}
                    </h5>
                    <span className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium">
                      {recompensa.puntosRequeridos} pts
                    </span>
                    <button
                      onClick={() => recompensa.id && onToggle(recompensa.id)}
                      disabled={!recompensa.id}
                      className={`px-2 py-1 rounded text-xs font-medium disabled:opacity-50 ${
                        recompensa.activo
                          ? 'bg-success-600 text-white'
                          : 'bg-dark-600 text-dark-300'
                      }`}
                    >
                      {recompensa.activo ? 'Activa' : 'Inactiva'}
                    </button>
                  </div>
                  <p className="text-dark-300 text-sm mb-1">
                    {recompensa.descripcion}
                  </p>
                  {recompensa.stock && (
                    <p className="text-dark-400 text-xs">
                      📦 Stock: {recompensa.stock}
                    </p>
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
                    onClick={() => recompensa.id && onDelete(recompensa.id)}
                    disabled={!recompensa.id}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
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
          <h4 className="text-lg font-semibold text-white mb-4">
            Productos Más Vendidos
          </h4>
          <div className="space-y-4">
            <div className="text-center text-dark-400 py-8">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 text-dark-500" />
              <p>Analytics disponible próximamente</p>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">
            Ingresos Mensuales
          </h4>
          <div className="text-center text-dark-400 py-8">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-dark-500" />
            <p>Reportes disponibles próximamente</p>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">
            Clientes Activos
          </h4>
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
      <h3 className="text-xl font-semibold text-white">
        Configuración del Sistema
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">
            Configuración General
          </h4>
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
          <h4 className="text-lg font-semibold text-white mb-4">
            Configuración del Portal
          </h4>
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

function StatsCard({
  title,
  value,
  icon,
  gradient,
  change,
}: Readonly<{
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  change: string;
}>) {
  return (
    <div className="premium-card">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-lg flex items-center justify-center text-white`}
        >
          {icon}
        </div>
        <span
          className={`text-sm font-medium ${
            change.startsWith('+') ? 'text-success-400' : 'text-warning-400'
          }`}
        >
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

// Componente para vista previa de tarjetas
function TarjetaPreviewComponent({
  config,
}: Readonly<{
  config: GeneralConfig;
}>) {
  // Helper function para obtener colores del nivel
  const getLevelColors = (level: string) => {
    const colorMap: { [key: string]: string } = {
      Bronce: '#8B4513',
      Plata: '#808080',
      Oro: '#B8860B',
      Diamante: '#4169E1',
    };
    return colorMap[level] || '#71797E';
  };

  // Helper function para obtener el gradiente del nivel
  const getLevelGradient = (level: string) => {
    const gradientMap: { [key: string]: string } = {
      Bronce: 'linear-gradient(45deg, #DAA520, #B8860B)',
      Plata: 'linear-gradient(45deg, #E5E5E5, #C0C0C0)',
      Oro: 'linear-gradient(45deg, #FFD700, #FFA500)',
      Diamante: 'linear-gradient(45deg, #E0F6FF, #87CEEB)',
    };
    return gradientMap[level] || 'linear-gradient(45deg, #F5F5F5, #D3D3D3)';
  };

  const nivelesConfig = {
    Bronce: {
      colores: { gradiente: ['#CD7F32', '#8B4513'] },
      textoDefault: 'Cliente Inicial',
    },
    Plata: {
      colores: { gradiente: ['#C0C0C0', '#808080'] },
      textoDefault: 'Cliente Frecuente',
    },
    Oro: {
      colores: { gradiente: ['#FFD700', '#FFA500'] },
      textoDefault: 'Cliente VIP',
    },
    Diamante: {
      colores: { gradiente: ['#B9F2FF', '#00CED1'] },
      textoDefault: 'Cliente Elite',
    },
    Platino: {
      colores: { gradiente: ['#E5E4E2', '#C0C0C0'] },
      textoDefault: 'Cliente Exclusivo',
    },
  };

  const [selectedLevel, setSelectedLevel] = useState('Oro');
  const tarjeta = (config.tarjetas || []).find(
    (t: Tarjeta) => t.nivel === selectedLevel
  ) || {
    nivel: selectedLevel,
    nombrePersonalizado: `Tarjeta ${selectedLevel}`,
    textoCalidad:
      nivelesConfig[selectedLevel as keyof typeof nivelesConfig].textoDefault,
    colores: nivelesConfig[selectedLevel as keyof typeof nivelesConfig].colores,
    diseño: { patron: 'clasico', textura: 'mate', bordes: 'redondeados' },
    condiciones: { puntosMinimos: 0, gastosMinimos: 0, visitasMinimas: 0 },
    beneficios: 'Acceso a descuentos especiales',
  };

  // Nombre de empresa editable
  const nombreEmpresa = config.nombreEmpresa || 'LEALTA 2.0';

  return (
    <div className="space-y-4">
      {/* Selector de nivel */}
      <div className="flex justify-center space-x-2">
        {Object.entries(NIVELES_TARJETAS_CONFIG).map(([nivel]) => (
          <button
            key={nivel}
            onClick={() => setSelectedLevel(nivel)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedLevel === nivel
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-dark-300 hover:text-white'
            }`}
          >
            {nivel}
          </button>
        ))}
      </div>

      {/* El botón para mostrar nivel ha sido eliminado */}

      {/* Vista previa de la tarjeta */}
      <div className="flex justify-center">
        <div className="relative w-80 h-48">
          <div
            className="absolute inset-0 rounded-xl shadow-2xl transform transition-all duration-300 border-2"
            style={{
              background: (tarjeta.colores && 'gradiente' in tarjeta.colores && Array.isArray(tarjeta.colores.gradiente) && tarjeta.colores.gradiente.length >= 2)
                ? `linear-gradient(135deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`
                : `linear-gradient(135deg, ${NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].colores.gradiente[0]}, ${NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].colores.gradiente[1]})`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              borderColor: getLevelColors(selectedLevel),
            }}
          >
            {/* Overlay para contraste */}
            <div className="absolute inset-0 rounded-xl bg-black opacity-15" />

            {/* Detalles únicos por nivel */}
            {selectedLevel === 'Bronce' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-amber-200 via-transparent to-amber-800" />
                {/* Partículas de bronce flotantes */}
                <div
                  className="absolute top-6 right-8 w-3 h-3 bg-amber-600 rounded-full opacity-40 animate-bounce"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="absolute top-12 right-12 w-2 h-2 bg-amber-500 rounded-full opacity-50 animate-bounce"
                  style={{ animationDelay: '0.5s' }}
                />
                <div
                  className="absolute bottom-8 left-8 w-2.5 h-2.5 bg-amber-700 rounded-full opacity-45 animate-bounce"
                  style={{ animationDelay: '1s' }}
                />
                <div
                  className="absolute bottom-12 right-6 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-35 animate-bounce"
                  style={{ animationDelay: '1.5s' }}
                />
                {/* Líneas decorativas */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30 animate-pulse" />
              </>
            )}

            {selectedLevel === 'Plata' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-15 bg-gradient-to-r from-gray-200 via-white to-gray-200" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
                {/* Efectos metálicos ondulantes */}
                <div
                  className="absolute top-4 left-4 w-20 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50 animate-pulse"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="absolute top-8 left-8 w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-40 animate-pulse"
                  style={{ animationDelay: '0.7s' }}
                />
                <div
                  className="absolute top-12 left-12 w-12 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60 animate-pulse"
                  style={{ animationDelay: '1.4s' }}
                />
                {/* Reflejos metálicos */}
                <div
                  className="absolute top-6 right-6 w-24 h-24 bg-gradient-to-br from-white via-transparent to-gray-300 rounded-full opacity-10 animate-spin"
                  style={{ animationDuration: '8s' }}
                />
              </>
            )}

            {selectedLevel === 'Oro' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-yellow-200 via-transparent to-yellow-600" />
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-10" />
                <div className="absolute bottom-4 left-4 w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-15" />
                {/* Partículas doradas brillantes */}
                <div
                  className="absolute top-8 right-16 w-2 h-2 bg-yellow-300 rounded-full opacity-70 animate-ping"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="absolute top-16 right-20 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-60 animate-ping"
                  style={{ animationDelay: '0.8s' }}
                />
                <div
                  className="absolute bottom-16 left-16 w-2.5 h-2.5 bg-yellow-200 rounded-full opacity-50 animate-ping"
                  style={{ animationDelay: '1.6s' }}
                />
                <div
                  className="absolute bottom-20 left-20 w-1 h-1 bg-yellow-500 rounded-full opacity-80 animate-ping"
                  style={{ animationDelay: '2.4s' }}
                />
                {/* Rayos dorados */}
                <div className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-20 rotate-45 animate-pulse" />
                <div
                  className="absolute top-1/2 left-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30 -rotate-45 animate-pulse"
                  style={{ animationDelay: '1s' }}
                />
              </>
            )}

            {selectedLevel === 'Diamante' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-blue-200 via-transparent to-cyan-400" />
                {/* Efectos de cristal diamante */}
                <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full opacity-70 animate-pulse" />
                <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse delay-300" />
                <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-pulse delay-700" />
                <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-cyan-200 rounded-full opacity-40 animate-pulse delay-1000" />
                <div className="absolute top-6 left-8 w-1.5 h-1.5 bg-blue-200 rounded-full opacity-55 animate-pulse delay-500" />
                <div className="absolute bottom-8 right-12 w-2 h-2 bg-cyan-300 rounded-full opacity-45 animate-pulse delay-1200" />
                {/* Facetas de diamante */}
                <div
                  className="absolute top-4 left-4 w-16 h-16 border border-cyan-200 opacity-20 rotate-45 animate-spin"
                  style={{ animationDuration: '12s' }}
                />
                <div
                  className="absolute bottom-4 right-4 w-12 h-12 border border-blue-200 opacity-15 -rotate-12 animate-spin"
                  style={{ animationDuration: '15s' }}
                />
              </>
            )}

            {selectedLevel === 'Platino' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-25 bg-gradient-to-br from-gray-100 via-white to-gray-300" />
                <div className="absolute top-0 left-0 w-full h-full border-2 border-white rounded-xl opacity-10" />
                <div className="absolute top-2 left-2 w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-5" />
                {/* Efectos de lujo platino */}
                <div
                  className="absolute top-6 right-10 w-3 h-3 bg-gradient-to-br from-white to-gray-300 rounded-full opacity-60 animate-pulse"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="absolute top-12 right-6 w-2 h-2 bg-gradient-to-br from-gray-100 to-gray-400 rounded-full opacity-50 animate-pulse"
                  style={{ animationDelay: '1s' }}
                />
                <div
                  className="absolute bottom-10 left-10 w-2.5 h-2.5 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-70 animate-pulse"
                  style={{ animationDelay: '2s' }}
                />
                <div
                  className="absolute bottom-6 left-16 w-1.5 h-1.5 bg-white rounded-full opacity-80 animate-pulse"
                  style={{ animationDelay: '0.5s' }}
                />
                {/* Líneas de elegancia */}
                <div
                  className="absolute top-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-25 animate-pulse"
                  style={{ animationDelay: '1.5s' }}
                />
                <div
                  className="absolute bottom-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"
                  style={{ animationDelay: '2.5s' }}
                />
                {/* Corona de lujo */}
                <div
                  className="absolute top-1/2 left-1/2 w-40 h-40 border border-gray-200 rounded-full opacity-5 animate-spin"
                  style={{ animationDuration: '20s' }}
                />
              </>
            )}

            <div className="relative p-6 h-full flex flex-col justify-between text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3
                    className="text-xl font-bold drop-shadow-lg text-white"
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                  >
                    {tarjeta.nombrePersonalizado}
                  </h3>
                </div>
              </div>

              {/* Chip con mejor contraste */}
              <div className="absolute top-16 left-6">
                <div
                  className="w-8 h-6 rounded-sm border"
                  style={{
                    background: getLevelGradient(selectedLevel),
                    borderColor: 'rgba(255,255,255,0.3)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </div>

              <div className="text-center">
                <div
                  className="text-lg font-bold tracking-widest mb-2 text-white"
                  style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}
                >
                  {tarjeta.nivel.toUpperCase()}
                </div>
                <p
                  className="text-sm font-medium text-white"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {tarjeta.textoCalidad}
                </p>
              </div>

              <div
                className="flex justify-between items-end text-xs font-semibold text-white"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
              >
                <span>{nombreEmpresa}</span>
                <span>
                  NIVEL {Object.keys(nivelesConfig).indexOf(tarjeta.nivel) + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Configuración de niveles de tarjetas (constante fuera del componente)
const NIVELES_TARJETAS_CONFIG = {
  Bronce: {
    colores: { gradiente: ['#CD7F32', '#8B4513'] },
    textoDefault: 'Cliente Inicial',
    condicionesDefault: {
      puntosMinimos: 0,
      gastosMinimos: 0,
      visitasMinimas: 0,
    },
    beneficioDefault: 'Acumulación de puntos básica',
  },
  Plata: {
    colores: { gradiente: ['#C0C0C0', '#A8A8A8'] },
    textoDefault: 'Cliente Frecuente',
    condicionesDefault: {
      puntosMinimos: 100,
      gastosMinimos: 500,
      visitasMinimas: 5,
    },
    beneficioDefault: '5% descuento en compras',
  },
  Oro: {
    colores: { gradiente: ['#FFD700', '#FFA500'] },
    textoDefault: 'Cliente Premium',
    condicionesDefault: {
      puntosMinimos: 300,
      gastosMinimos: 1500,
      visitasMinimas: 15,
    },
    beneficioDefault: '10% descuento + invitaciones exclusivas',
  },
  Diamante: {
    colores: { gradiente: ['#B9F2FF', '#87CEEB'] },
    textoDefault: 'Cliente VIP',
    condicionesDefault: {
      puntosMinimos: 500,
      gastosMinimos: 3000,
      visitasMinimas: 25,
    },
    beneficioDefault: '15% descuento + eventos privados',
  },
  Platino: {
    colores: { gradiente: ['#E5E4E2', '#CCCCCC'] },
    textoDefault: 'Cliente Elite',
    condicionesDefault: {
      puntosMinimos: 1000,
      gastosMinimos: 5000,
      visitasMinimas: 50,
    },
    beneficioDefault: '20% descuento + concierge personal',
  },
};

// Componente para edición de tarjetas
function TarjetaEditorComponent({
  config,
  setConfig,
  showNotification,
}: Readonly<{
  config: GeneralConfig;
  setConfig: (config: GeneralConfig) => void;
  showNotification: (message: string, type: NivelTarjeta) => void;
}>) {
  const [selectedLevel, setSelectedLevel] = useState('Oro');
  const [editingCard, setEditingCard] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [empresaChanged, setEmpresaChanged] = useState(false);

  const currentTarjeta = useMemo(() => 
    (config.tarjetas || []).find(
      (t: Tarjeta) => t.nivel === selectedLevel
    ) || {
      nivel: selectedLevel,
      nombrePersonalizado: `Tarjeta ${selectedLevel}`,
      textoCalidad:
        NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].textoDefault,
      colores: NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].colores,
      condiciones:
        NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG]
          .condicionesDefault,
      beneficio:
        NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG]
          .beneficioDefault,
      activo: true,
    }, [config.tarjetas, selectedLevel]
  );

  // Actualizar editingCard cuando cambie selectedLevel (solo si se está editando)
  useEffect(() => {
    if (editingCard) {
      setEditingCard({ ...currentTarjeta });
    }
  }, [selectedLevel, editingCard, currentTarjeta]);

  // Definir jerarquía de niveles
  const nivelesJerarquia = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];

  // Función para obtener límites máximos basados en el nivel superior
  const getLimitesMaximos = (nivelActual: string) => {
    const indexActual = nivelesJerarquia.indexOf(nivelActual);
    if (indexActual >= nivelesJerarquia.length - 1) {
      // Si es el nivel más alto, no hay límites
      return { puntosMinimos: Infinity, gastosMinimos: Infinity, visitasMinimas: Infinity };
    }

    const nivelSuperior = nivelesJerarquia[indexActual + 1];
    const tarjetaSuperior = (config.tarjetas || []).find((t: Tarjeta) => t.nivel === nivelSuperior);
    
    if (tarjetaSuperior?.condiciones) {
      return {
        puntosMinimos: tarjetaSuperior.condiciones.puntosMinimos - 1,
        gastosMinimos: tarjetaSuperior.condiciones.gastosMinimos - 1,
        visitasMinimas: tarjetaSuperior.condiciones.visitasMinimas - 1,
      };
    }

    // Si no hay tarjeta superior configurada, usar valores por defecto
    const configSuperior = NIVELES_TARJETAS_CONFIG[nivelSuperior as keyof typeof NIVELES_TARJETAS_CONFIG];
    return {
      puntosMinimos: configSuperior.condicionesDefault.puntosMinimos - 1,
      gastosMinimos: configSuperior.condicionesDefault.gastosMinimos - 1,
      visitasMinimas: configSuperior.condicionesDefault.visitasMinimas - 1,
    };
  };

  // Función para validar que el valor no exceda el límite jerárquico
  const validarLimiteJerarquico = (valor: number, limite: number, campo: string): boolean => {
    if (valor > limite) {
      showNotification(`${campo} no puede ser mayor a ${limite} (límite del nivel superior)`, 'Oro' as NivelTarjeta);
      return false;
    }
    return true;
  };

  // Función auxiliar para normalizar condiciones de tarjeta
  const normalizeCardConditions = (card: Tarjeta & { id?: string }) => {
    return {
      ...card,
      id: card.id || `tarjeta_${card.nivel}_${Date.now()}`,
      condiciones: {
        ...card.condiciones,
        puntosMinimos: typeof card.condiciones?.puntosMinimos === 'number' ? card.condiciones.puntosMinimos : 0,
        gastosMinimos: typeof card.condiciones?.gastosMinimos === 'number' ? card.condiciones.gastosMinimos : 0,
        visitasMinimas: typeof card.condiciones?.visitasMinimas === 'number' ? card.condiciones.visitasMinimas : 0,
      }
    };
  };

  // Función auxiliar para actualizar tarjetas localmente
  const updateLocalCards = (cardToSave: Tarjeta) => {
    const newTarjetas = [...(config.tarjetas || [])];
    const existingIndex = newTarjetas.findIndex(
      (t: Tarjeta) => t.nivel === cardToSave.nivel
    );

    if (existingIndex >= 0) {
      newTarjetas[existingIndex] = cardToSave;
    } else {
      newTarjetas.push(cardToSave);
    }

    setConfig({ ...config, tarjetas: newTarjetas });
    return newTarjetas;
  };

  // Función auxiliar para persistir cambios
  const persistCardChanges = async (newTarjetas: Tarjeta[]) => {
    const response = await fetch('/api/admin/portal-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...config,
        tarjetas: newTarjetas,
        businessId: 'default',
      }),
    });

    if (!response.ok) {
      throw new Error('Error al guardar en el servidor');
    }
  };

  const handleSave = async () => {
    if (!editingCard) return;

    setSaving(true);
    
    try {
      const cardToSave = normalizeCardConditions(editingCard);
      const newTarjetas = updateLocalCards(cardToSave);
      await persistCardChanges(newTarjetas);
      
      showNotification(`✅ Tarjeta ${cardToSave.nivel} guardada correctamente`, 'success');
      setEditingCard(null);
    } catch (error) {
      console.error('Error guardando tarjeta:', error);
      showNotification('❌ Error al guardar los cambios de la tarjeta', 'error');
      
      // Revertir cambios locales en caso de error
      const originalTarjeta = (config.tarjetas || []).find(
        (t: Tarjeta) => t.nivel === editingCard.nivel
      );
      if (originalTarjeta) {
        setEditingCard(originalTarjeta);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmpresa = async (nombreEmpresa: string) => {
    // Solo actualizar estado local, marcar como cambiado
    setConfig({ ...config, nombreEmpresa });
    setEmpresaChanged(true);
  };

  const handleSaveEmpresaManual = async () => {
    try {
      setSavingEmpresa(true);
      
      // Persistir en la base de datos
      const response = await fetch('/api/admin/portal-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          businessId: 'default',
        }),
      });

      if (response.ok) {
        // Actualizar todas las tarjetas existentes de clientes
        const syncResponse = await fetch('/api/admin/sync-tarjetas-empresa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombreEmpresa: config.nombreEmpresa,
          }),
        });

        if (syncResponse.ok) {
          const result = await syncResponse.json();
          showNotification(`✅ Nombre guardado y ${result.updatedCards || 0} tarjetas de clientes actualizadas`, 'success');
        } else {
          showNotification('✅ Nombre guardado (sin sincronización de tarjetas existentes)', 'success');
        }
        
        setEmpresaChanged(false);
      } else {
        throw new Error('Error al guardar en el servidor');
      }
    } catch (error) {
      console.error('Error guardando nombre empresa:', error);
      showNotification('❌ Error al guardar el nombre de la empresa', 'error');
    } finally {
      setSavingEmpresa(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <CreditCard className="w-6 h-6 mr-2 text-primary-500" />
        <h4 className="text-lg font-semibold text-white">
          Gestión de Tarjetas de Lealtad
        </h4>
      </div>

      {/* Configuración del nombre de empresa */}
      <div className="bg-dark-800 rounded-lg p-4 mb-6">
        <h5 className="text-white font-medium mb-3">
          Nombre de la Empresa en Tarjetas
        </h5>
        <div className="flex space-x-2 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={config.nombreEmpresa || ''}
              onChange={e => handleSaveEmpresa(e.target.value)}
              placeholder="Nombre de tu empresa"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none pr-10"
            />
            {savingEmpresa && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
        
        {empresaChanged && (
          <div className="flex items-center justify-between mt-2 p-2 bg-amber-900/30 border border-amber-600/50 rounded-lg">
            <span className="text-sm text-amber-300">⚠️ Hay cambios sin guardar</span>
            <button
              onClick={handleSaveEmpresaManual}
              disabled={savingEmpresa}
              className="px-3 py-1 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {savingEmpresa ? (
                <>
                  <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                  Guardando...
                </>
              ) : (
                '💾 Guardar'
              )}
            </button>
          </div>
        )}
        <p className="text-dark-400 text-sm mt-2">
          Este nombre aparecerá en la esquina inferior izquierda de todas las
          tarjetas. Los cambios se guardan automáticamente.
        </p>
      </div>

      {/* Selector de nivel */}
      <div className="mb-6">
        <h5 className="text-white font-medium mb-3">Seleccionar Nivel</h5>
        <div className="grid grid-cols-5 gap-2">
          {Object.keys(NIVELES_TARJETAS_CONFIG).map((nivel) => (
            <button
              key={nivel}
              onClick={() => setSelectedLevel(nivel)}
              className={`p-3 rounded-lg text-center transition-colors ${
                selectedLevel === nivel
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <div className="text-sm font-medium">{nivel}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h6 className="text-white font-medium">
            Editando: Tarjeta {selectedLevel}
          </h6>
          {!editingCard && (
            <button
              onClick={() => setEditingCard({ ...currentTarjeta })}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        {editingCard ? (
          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nombre-personalizado"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Nombre Personalizado
                </label>
                <input
                  id="nombre-personalizado"
                  type="text"
                  value={editingCard.nombrePersonalizado}
                  onChange={e =>
                    setEditingCard({
                      ...editingCard,
                      nombrePersonalizado: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="texto-calidad"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Texto de Calidad
                </label>
                <input
                  id="texto-calidad"
                  type="text"
                  value={editingCard.textoCalidad}
                  onChange={e =>
                    setEditingCard({
                      ...editingCard,
                      textoCalidad: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Condiciones para obtener la tarjeta */}
            <div>
              <h6 className="text-white font-medium mb-3">
                Condiciones para Obtener este Nivel
              </h6>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="puntos-minimos"
                    className="block text-sm text-dark-300 mb-1"
                  >
                    Puntos mínimos
                  </label>
                  <input
                    id="puntos-minimos"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editingCard.condiciones?.puntosMinimos ?? ''}
                    onChange={e => {
                      // Validar que solo contenga números
                      if (
                        /^\d*$/.test(e.target.value) ||
                        e.target.value === ''
                      ) {
                        const nuevoValor = e.target.value === '' ? '' : Number(e.target.value);
                        
                        // Validar límites jerárquicos si no está vacío
                        if (nuevoValor !== '' && nuevoValor > 0) {
                          const limites = getLimitesMaximos(editingCard.nivel);
                          if (!validarLimiteJerarquico(nuevoValor, limites.puntosMinimos, 'Puntos mínimos')) {
                            return; // No actualizar si excede el límite
                          }
                        }

                        setEditingCard({
                          ...editingCard,
                          condiciones: {
                            ...editingCard.condiciones,
                            puntosMinimos: nuevoValor,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="gastos-minimos"
                    className="block text-sm text-dark-300 mb-1"
                  >
                    Gastos mínimos ($)
                  </label>
                  <input
                    id="gastos-minimos"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editingCard.condiciones?.gastosMinimos ?? ''}
                    onChange={e => {
                      // Validar que solo contenga números
                      if (
                        /^\d*$/.test(e.target.value) ||
                        e.target.value === ''
                      ) {
                        const nuevoValor = e.target.value === '' ? '' : Number(e.target.value);
                        
                        // Validar límites jerárquicos si no está vacío
                        if (nuevoValor !== '' && nuevoValor > 0) {
                          const limites = getLimitesMaximos(editingCard.nivel);
                          if (!validarLimiteJerarquico(nuevoValor, limites.gastosMinimos, 'Gastos mínimos')) {
                            return; // No actualizar si excede el límite
                          }
                        }

                        setEditingCard({
                          ...editingCard,
                          condiciones: {
                            ...editingCard.condiciones,
                            gastosMinimos: nuevoValor,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="visitas-minimas"
                    className="block text-sm text-dark-300 mb-1"
                  >
                    Visitas mínimas
                  </label>
                  <input
                    id="visitas-minimas"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editingCard.condiciones?.visitasMinimas ?? ''}
                    onChange={e => {
                      // Validar que solo contenga números
                      if (
                        /^\d*$/.test(e.target.value) ||
                        e.target.value === ''
                      ) {
                        const nuevoValor = e.target.value === '' ? '' : Number(e.target.value);
                        
                        // Validar límites jerárquicos si no está vacío
                        if (nuevoValor !== '' && nuevoValor > 0) {
                          const limites = getLimitesMaximos(editingCard.nivel);
                          if (!validarLimiteJerarquico(nuevoValor, limites.visitasMinimas, 'Visitas mínimas')) {
                            return; // No actualizar si excede el límite
                          }
                        }

                        setEditingCard({
                          ...editingCard,
                          condiciones: {
                            ...editingCard.condiciones,
                            visitasMinimas: nuevoValor,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Beneficio del nivel */}
            <div>
              <h6 className="text-white font-medium mb-3">
                Beneficio de este Nivel
              </h6>
              <textarea
                value={editingCard.beneficio || ''}
                onChange={e =>
                  setEditingCard({ ...editingCard, beneficio: e.target.value })
                }
                placeholder="Describe el beneficio principal que obtienen los clientes con este nivel de tarjeta"
                rows={3}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none resize-none"
              />
            </div>

            {/* Estado activo */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activo"
                checked={editingCard.activo}
                onChange={e =>
                  setEditingCard({ ...editingCard, activo: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="activo" className="text-dark-300">
                Tarjeta activa y visible para clientes
              </label>
            </div>

            {/* Botones */}
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:bg-success-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
              <button
                onClick={() => setEditingCard(null)}
                disabled={saving}
                className="px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 disabled:bg-dark-400 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* Vista de información cuando no está editando */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-dark-400">Nombre:</p>
                <p className="text-white font-medium">
                  {currentTarjeta.nombrePersonalizado}
                </p>
              </div>
              <div>
                <p className="text-dark-400">Texto de calidad:</p>
                <p className="text-white font-medium">
                  {currentTarjeta.textoCalidad}
                </p>
              </div>
            </div>

            <div>
              <p className="text-dark-400 text-sm mb-2">Condiciones:</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-dark-400">Puntos</p>
                  <p className="text-white font-medium">
                    {currentTarjeta.condiciones?.puntosMinimos || 0}
                  </p>
                </div>
                <div>
                  <p className="text-dark-400">Gastos</p>
                  <p className="text-white font-medium">
                    ${currentTarjeta.condiciones?.gastosMinimos || 0}
                  </p>
                </div>
                <div>
                  <p className="text-dark-400">Visitas</p>
                  <p className="text-white font-medium">
                    {currentTarjeta.condiciones?.visitasMinimas || 0}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-dark-400 text-sm mb-2">Beneficio:</p>
              <p className="text-white text-sm">
                {('beneficio' in currentTarjeta ? currentTarjeta.beneficio : currentTarjeta.beneficios) || 'Sin beneficio definido'}
              </p>
            </div>

            <div>
              {(() => {
                const isActive = 'activo' in currentTarjeta ? currentTarjeta.activo : true;
                return (
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      isActive
                        ? 'bg-success-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {isActive ? 'Activa' : 'Inactiva'}
                  </span>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para asignación manual de tarjetas a clientes
// Componente para mostrar un cliente individual en la lista de búsqueda
function ClientListItem({
  client,
  selectedClient,
  onSelect,
  calculateClientLevel,
}: Readonly<{
  client: Cliente;
  selectedClient: Cliente | null;
  onSelect: (client: Cliente) => void;
  calculateClientLevel: (client: Cliente) => string;
}>) {
  const nivelAutomatico = calculateClientLevel(client);
  const cumpleCondiciones = nivelAutomatico !== 'Bronce';
  const tieneTarjeta = client.tarjetaLealtad !== null;

  return (
    <button
      onClick={() => onSelect(client)}
      className={`w-full p-3 rounded-lg cursor-pointer transition-colors text-left ${
        selectedClient?.id === client.id
          ? 'bg-primary-600 text-white'
          : 'bg-dark-700 hover:bg-dark-600 text-dark-300'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{client.nombre}</p>
          <p className="text-sm opacity-75">{client.cedula}</p>
          <p className="text-sm opacity-75">{client.correo}</p>
        </div>
        <div className="text-right text-sm">
          <p>Puntos: {client.puntos || 0}</p>
          <p>Gastos: ${client.totalGastado || 0}</p>
          <p>Visitas: {client.totalVisitas || 0}</p>

          {tieneTarjeta && client.tarjetaLealtad ? (
            <div className="mt-1">
              <p
                className={`font-medium ${client.tarjetaLealtad.activa ? 'text-success-400' : 'text-red-400'}`}
              >
                Tarjeta {client.tarjetaLealtad.nivel}{' '}
                {!client.tarjetaLealtad.activa && '(Inactiva)'}
              </p>
              <p className="text-xs opacity-75">
                {client.tarjetaLealtad.asignacionManual
                  ? 'Asignación manual'
                  : 'Asignación automática'}
              </p>
            </div>
          ) : (
            <p
              className={`font-medium ${cumpleCondiciones ? 'text-success-400' : 'text-yellow-400'}`}
            >
              Nivel sugerido: {nivelAutomatico}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// Componente para el formulario de asignación de tarjeta
function CardAssignmentForm({
  selectedClient,
  selectedLevel,
  setSelectedLevel,
  nivelesConfig,
  onAssign,
  onCancel,
}: Readonly<{
  selectedClient: Cliente | null;
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  nivelesConfig: Record<string, any>;
  onAssign: () => void;
  onCancel: () => void;
}>) {
  return (
    <div className="bg-dark-700 rounded-lg p-4">
      <h6 className="text-white font-medium mb-3">
        Asignar Tarjeta a: {selectedClient?.nombre || 'Cliente no seleccionado'}
      </h6>

      {!selectedClient ? (
        <p className="text-red-400">Error: No se ha seleccionado ningún cliente</p>
      ) : (
        <>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-dark-400 text-sm">Puntos Actuales</p>
          <p className="text-white font-medium">{selectedClient.puntos || 0}</p>
        </div>
        <div>
          <p className="text-dark-400 text-sm">Gastos Totales</p>
          <p className="text-white font-medium">
            ${selectedClient.totalGastado || 0}
          </p>
        </div>
        <div>
          <p className="text-dark-400 text-sm">Visitas</p>
          <p className="text-white font-medium">
            {selectedClient.totalVisitas || 0}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor="nivel-select"
          className="block text-sm font-medium text-dark-300 mb-2"
        >
          Seleccionar Nivel de Tarjeta
        </label>
        <select
          id="nivel-select"
          value={selectedLevel}
          onChange={e => setSelectedLevel(e.target.value)}
          className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-primary-500 focus:outline-none"
        >
          {Object.entries(nivelesConfig).map(([nivel, conf]: [string, any]) => {
            const cumple =
              (selectedClient.puntos || 0) >= conf.condiciones.puntosMinimos &&
              (selectedClient.totalGastado || 0) >=
                conf.condiciones.gastosMinimos &&
              (selectedClient.totalVisitas || 0) >= conf.condiciones.visitasMinimas;

            return (
              <option key={nivel} value={nivel}>
                {nivel} {cumple ? '✓' : '⚠️'}
                (Req: {conf.condiciones.puntosMinimos}pts, $
                {conf.condiciones.gastosMinimos},{' '}
                {conf.condiciones.visitasMinimas} visitas)
              </option>
            );
          })}
        </select>
        <p className="text-dark-400 text-xs mt-1">
          ✓ = Cumple condiciones automáticamente | ⚠️ = Asignación manual
        </p>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onAssign}
          className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
        >
          Asignar Tarjeta
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors"
        >
          Cancelar
        </button>
      </div>
        </>
      )}
    </div>
  );
}

function AsignacionTarjetasComponent({
  showNotification,
}: Readonly<{
  showNotification: (message: string, type: NivelTarjeta) => void;
}>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState('Bronce');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Función para refrescar los clientes después de asignar una tarjeta
  const onRefreshClients = useCallback(async () => {
    if (searchTerm.trim().length > 0) {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/clientes/search?q=${encodeURIComponent(searchTerm)}`
        );
        const data = await res.json();
        setClients(data.clientes || []);
      } catch (error) {
        console.error('Error refrescando clientes:', error);
        showNotification('Error al actualizar la lista de clientes', 'error');
      } finally {
        setLoading(false);
      }
    }
  }, [searchTerm, showNotification]);

  const nivelesConfig = {
    Bronce: {
      condiciones: { puntosMinimos: 0, gastosMinimos: 0, visitasMinimas: 0 },
    },
    Plata: {
      condiciones: {
        puntosMinimos: 100,
        gastosMinimos: 500,
        visitasMinimas: 5,
      },
    },
    Oro: {
      condiciones: {
        puntosMinimos: 500,
        gastosMinimos: 1500,
        visitasMinimas: 10,
      },
    },
    Diamante: {
      condiciones: {
        puntosMinimos: 1500,
        gastosMinimos: 3000,
        visitasMinimas: 20,
      },
    },
    Platino: {
      condiciones: {
        puntosMinimos: 3000,
        gastosMinimos: 5000,
        visitasMinimas: 30,
      },
    },
  };

  // Buscar clientes
  const searchClients = useCallback(async () => {
    if (searchTerm.length < 2) {
      setClients([]);
      return;
    }

    setLoading(true);
    try {
      // Utilizamos encodeURIComponent para asegurar que la URL sea válida
      const response = await fetch(
        `/api/clientes/search?q=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          console.error('Formato de respuesta inesperado:', data);
          setClients([]);
        }
      } else {
        console.error('Error en la respuesta:', response.status);
        setClients([]);
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, setClients, setLoading]);

  // Calcular nivel automático basado en historial del cliente
  const calculateClientLevel = (client: Cliente) => {
    const puntos = client.puntos || 0;
    const gastos = client.totalGastado || 0;
    const visitas = client.totalVisitas || 0;

    // Buscar el nivel más alto que cumple
    const niveles = ['Platino', 'Diamante', 'Oro', 'Plata', 'Bronce'];

    for (const nivel of niveles) {
      const condiciones =
        nivelesConfig[nivel as keyof typeof nivelesConfig].condiciones;
      if (
        puntos >= condiciones.puntosMinimos &&
        gastos >= condiciones.gastosMinimos &&
        visitas >= condiciones.visitasMinimas
      ) {
        return nivel;
      }
    }
    return 'Bronce';
  };

  // Asignar tarjeta manualmente
  const assignCard = async () => {
    if (!selectedClient) return;

    // Mostrar notificación inmediatamente para dar retroalimentación al usuario
    showNotification(
      `Asignando tarjeta ${selectedLevel} a ${selectedClient.nombre}...`,
      'info'
    );

    try {
      const response = await fetch('/api/tarjetas/asignar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: selectedClient.id,
          nivel: selectedLevel,
          asignacionManual: true,
          fastUpdate: true, // Indicador para procesamiento rápido
        }),
      });

      if (response.ok) {
        showNotification(
          `Tarjeta ${selectedLevel} asignada exitosamente a ${selectedClient.nombre}`,
          'success'
        );

        // Limpiar la selección y búsqueda inmediatamente para mejor UX
        setSelectedClient(null);
        setSearchTerm('');
        setClients([]);

        // Recargar la lista de clientes para reflejar los cambios
        if (typeof onRefreshClients === 'function') {
          onRefreshClients();
        }

        // Notificar a otros clientes conectados sobre el cambio (simulado)
        try {
          fetch('/api/notificaciones/actualizar-clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'actualizacion_tarjeta' }),
          }).catch(e => console.log('Error enviando notificación:', e));
        } catch (e) {
          console.log('Error en notificación:', e);
        }
      } else {
        const errorData = await response.json();
        showNotification(
          `Error al asignar tarjeta: ${errorData.error || 'Error desconocido'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error asignando tarjeta:', error);
      showNotification('Error de conexión al asignar la tarjeta', 'error');
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchClients();
      } else {
        setClients([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchClients]);

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <div className="flex items-center mb-6">
        <Users className="w-6 h-6 mr-2 text-primary-500" />
        <h4 className="text-lg font-semibold text-white">
          Asignación Manual de Tarjetas
        </h4>
      </div>

      <p className="text-dark-400 text-sm mb-4">
        Busca clientes existentes para asignarles una tarjeta de lealtad
        manualmente, especial para casos donde el negocio considera que el
        cliente merece el nivel.
      </p>

      {/* Buscador de clientes */}
      <div className="mb-6">
        <label
          htmlFor="search-client"
          className="block text-sm font-medium text-dark-300 mb-2"
        >
          Buscar Cliente
        </label>
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${loading ? 'text-primary-500 animate-pulse' : 'text-dark-400'}`}
          />
          <input
            id="search-client"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono o cédula..."
            className="w-full pl-10 pr-10 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-2 text-primary-500 text-sm flex items-center">
            <div className="w-3 h-3 mr-2 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            Buscando clientes...
          </div>
        )}
      </div>

      {/* Lista de clientes encontrados */}
      {searchTerm.length >= 2 && (
        <div className="mb-6">
          <h6 className="text-white font-medium mb-3">
            {(() => {
              if (loading) return 'Buscando...';
              if (clients.length > 0) return 'Clientes Encontrados';
              return 'Sin resultados';
            })()}
          </h6>

          {clients.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {clients.map(client => (
                <ClientListItem
                  key={client.id}
                  client={client}
                  selectedClient={selectedClient}
                  onSelect={setSelectedClient}
                  calculateClientLevel={calculateClientLevel}
                />
              ))}
            </div>
          ) : (
            searchTerm.length >= 2 &&
            !loading && (
              <div className="py-3 text-center text-dark-400 bg-dark-800/50 rounded-lg">
                No se encontraron clientes con ese criterio de búsqueda
              </div>
            )
          )}
        </div>
      )}

      {/* Selección de nivel y asignación */}
      {selectedClient && (
        <CardAssignmentForm
          selectedClient={selectedClient}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          nivelesConfig={nivelesConfig}
          onAssign={assignCard}
          onCancel={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
