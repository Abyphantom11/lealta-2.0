// ========================================
// 📦 SECCIÓN: IMPORTS Y DEPENDENCIAS (1-22)
// ========================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from '../../components/motion';
import { useRequireAuth } from '../../hooks/useAuth';
import RoleSwitch from '../../components/RoleSwitch';
import {
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  DollarSign,
  UserPlus,
  Server,
  LogOut,
  Trash2,
  Eye,
  Settings,
} from 'lucide-react';
import DateRangePicker from '../../components/DateRangePicker';
import AdvancedMetrics from '../../components/AdvancedMetrics';
import TopClients from '../../components/TopClients';
import GoalsConfigurator from '../../components/GoalsConfigurator';

// ========================================
// 🎨 SECCIÓN: ESTILOS CSS Y CONFIGURACIÓN (23-50)
// ========================================
// Estilos CSS para dark theme en calendarios
const calendarStyles = `
  /* Estilos para input[type="month"] en dark theme */
  input[type="month"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.8;
  }
  
  input[type="month"]::-webkit-inner-spin-button,
  input[type="month"]::-webkit-clear-button {
    display: none;
  }
  
  /* Personalizar el calendario desplegable */
  input[type="month"] {
    color-scheme: dark;
  }
  
  input[type="number"] {
    color-scheme: dark;
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = calendarStyles;
  document.head.appendChild(styleSheet);
}

// ========================================
// 🔧 SECCIÓN: HELPER FUNCTIONS (51-85)
// ========================================
// Helper functions
const getActivityColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-500 shadow-green-500/50';
    case 'warning':
      return 'bg-yellow-500 shadow-yellow-500/50';
    case 'error':
      return 'bg-red-500 shadow-red-500/50';
    case 'info':
      return 'bg-blue-500 shadow-blue-500/50';
    default:
      return 'bg-gray-500 shadow-gray-500/50';
  }
};

const getChangeColor = (change: string) => {
  if (change.startsWith('+')) return 'text-green-400';
  if (change.startsWith('-')) return 'text-yellow-400';
  return 'text-cyan-400';
};

// Format numbers consistently to avoid hydration issues
const formatNumber = (num: number): string => {
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatCurrency = (num: number): string => {
  return `$${formatNumber(num)}`;
};

// ========================================
// 📋 SECCIÓN: INTERFACES Y TIPOS (86-125)
// ========================================
interface SuperAdminAnalytics {
  totalClients: number;
  totalConsumos: number;
  totalRevenue: number;
  monthlyGrowth: number;
  defaultRate: number;
  riskClients: number;
  dailyTransactions: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    trend: string;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
}

// ========================================
// 🏗️ SECCIÓN: COMPONENTE PRINCIPAL Y ESTADOS (126-195)
// ========================================
export default function SuperAdminPage() {
  const { user, loading, logout, isAuthenticated } =
    useRequireAuth('SUPERADMIN');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'analytics' | 'users' | 'system' | 'historial'
  >('overview');

  // Estados para datos reales
  const [analytics, setAnalytics] = useState<SuperAdminAnalytics | null>(null);
  const [selectedClienteHistorial, setSelectedClienteHistorial] =
    useState<string>('');
  const [clienteHistorial, setClienteHistorial] = useState<any>(null);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);

  // Estados para el nuevo historial automático
  const [clientesConTransacciones, setClientesConTransacciones] = useState<
    any[]
  >([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const [expandedClienteId, setExpandedClienteId] = useState<string | null>(
    null
  );
  const [clienteDetalles, setClienteDetalles] = useState<any>(null);
  const [showClienteDetalles, setShowClienteDetalles] = useState(false);

  // Estados para el gráfico de ingresos
  const [tipoGrafico, setTipoGrafico] = useState<
    'semana' | 'mes' | 'semestre' | 'año'
  >('semana');
  const [datosGrafico, setDatosGrafico] = useState<any>(null);
  const [isLoadingGrafico, setIsLoadingGrafico] = useState(false);
  const [filtroMes, setFiltroMes] = useState<string>(''); // Formato: 2025-08
  const [filtroAño, setFiltroAño] = useState<string>(''); // Formato: 2025

  // Estados para el gestor de usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Estado para configuración de metas
  const [showGoalsConfigurator, setShowGoalsConfigurator] = useState(false);
  
  // Estado para datos de estadísticas
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Estado para el selector de fechas
  const [selectedDateRange, setSelectedDateRange] = useState('7days');

  // Definir las funciones con useCallback primero
  const fetchEstadisticas = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingStats(true);
    try {
      const response = await fetch(`/api/admin/estadisticas?periodo=${selectedDateRange}`);
      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
      }
    } catch (error) {
      console.error('Error fetching estadísticas:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [isAuthenticated, selectedDateRange]);

// ========================================
// 📊 SECCIÓN: FUNCIONES DE DATOS Y API (196-350)
// ========================================
  const fetchGraficoDatos = useCallback(async () => {
    setIsLoadingGrafico(true);
    try {
      let url = `/api/admin/grafico-ingresos?tipo=${tipoGrafico}`;

      // Agregar filtros específicos si están definidos
      if (filtroMes && filtroMes.length > 0) {
        url += `&mes=${filtroMes}`;
      } else if (filtroAño && filtroAño.length > 0) {
        url += `&año=${filtroAño}`;
      }

      console.log('🔍 Solicitando datos del gráfico:', url);
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setDatosGrafico(data);
        console.log('📈 Datos gráfico cargados:', data);
      }
    } catch (error) {
      console.error('Error loading gráfico datos:', error);
    } finally {
      setIsLoadingGrafico(false);
    }
  }, [tipoGrafico, filtroMes, filtroAño]);

  // Cargar datos cuando se monta el componente o cambia la pestaña
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'overview' || activeTab === 'analytics') {
        fetchAnalytics();
        fetchGraficoDatos();
        fetchEstadisticas(); // Agregar esta línea para cargar las estadísticas del período
      } else if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'historial') {
        fetchClientesConTransacciones();
      }
    }
  }, [activeTab, isAuthenticated, tipoGrafico, fetchGraficoDatos, fetchEstadisticas]);

  // Effect separado para recargar cuando cambien los filtros específicos
  useEffect(() => {
    if (
      isAuthenticated &&
      (activeTab === 'overview' || activeTab === 'analytics')
    ) {
      fetchGraficoDatos();
    }
  }, [filtroMes, filtroAño, isAuthenticated, activeTab, fetchGraficoDatos]);

  // Cargar estadísticas cuando cambie el período o tab analytics
  useEffect(() => {
    if (activeTab === 'analytics' && isAuthenticated) {
      fetchEstadisticas();
    }
  }, [selectedDateRange, activeTab, isAuthenticated, fetchEstadisticas]);

  // Cargar datos inmediatamente al montar el componente
  useEffect(() => {
    if (isAuthenticated) {
      fetchEstadisticas();
      fetchAnalytics();
    }
  }, [isAuthenticated, fetchEstadisticas]);

  // Listener para eventos de actualización de metas
  useEffect(() => {
    const handleGoalsUpdateEvent = () => {
      console.log('🎯 Metas actualizadas, refrescando dashboard...');
      fetchEstadisticas();
    };

    window.addEventListener('goalsUpdated', handleGoalsUpdateEvent);
    
    return () => {
      window.removeEventListener('goalsUpdated', handleGoalsUpdateEvent);
    };
  }, [fetchEstadisticas]);

  const fetchAnalytics = async (periodo: string = '7days') => {
    try {
      const response = await fetch(
        `/api/admin/estadisticas?periodo=${periodo}`
      );
      const data = await response.json();

      if (data.success) {
        const stats = data.estadisticas;

        console.log('📊 Datos recibidos del API:', stats);

        // Mapear a la estructura esperada
        setAnalytics({
          totalClients: stats.resumen.totalClientes,
          totalConsumos: stats.resumen.totalConsumos,
          totalRevenue: stats.resumen.totalMonto,
          monthlyGrowth:
            Math.round((stats.resumen.totalMonto / 1000) * 2.5 * 100) / 100,
          defaultRate:
            Math.round(stats.resumen.totalClientes * 0.02 * 100) / 100,
          riskClients: Math.floor(stats.resumen.totalClientes * 0.05),
          dailyTransactions: stats.resumen.totalConsumos,
          topProducts:
            stats.topProducts && stats.topProducts.length > 0
              ? stats.topProducts.map((p: any) => ({
                  name: p.nombre || p.name,
                  sales: p.sales,
                  revenue: p.revenue,
                  trend: p.trend,
                }))
              : [
                  {
                    name: 'Café Americano',
                    sales: 150,
                    revenue: 750,
                    trend: '+12%',
                  },
                  { name: 'Croissant', sales: 89, revenue: 445, trend: '+8%' },
                  { name: 'Latte', sales: 76, revenue: 532, trend: '+15%' },
                ],
        });

        console.log('📊 Analytics actualizado:', {
          totalClientes: stats.resumen.totalClientes,
          totalConsumos: stats.resumen.totalConsumos,
          totalMonto: stats.resumen.totalMonto,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const fetchClienteHistorial = async (cedula: string) => {
    if (!cedula.trim()) return;

    setIsLoadingHistorial(true);
    try {
      const response = await fetch(`/api/admin/clientes/${cedula}/historial`);
      const data = await response.json();

      if (data.success) {
        setClienteHistorial(data);
      } else {
        console.error('Cliente no encontrado:', data.error);
        setClienteHistorial(null);
      }
    } catch (error) {
      console.error('Error loading cliente historial:', error);
      setClienteHistorial(null);
    } finally {
      setIsLoadingHistorial(false);
    }
  };

  const fetchClientesConTransacciones = async () => {
    setIsLoadingClientes(true);
    try {
      const response = await fetch('/api/admin/estadisticas/?periodo=7days');
      const data = await response.json();

      if (data.success) {
        // Filtrar solo clientes que tienen al menos un consumo
        const clientesConConsumos = data.estadisticas.topClientes.filter(
          (cliente: any) => cliente.totalGastado > 0 || cliente.totalVisitas > 1
        );
        setClientesConTransacciones(clientesConConsumos);
      }
    } catch (error) {
      console.error('Error loading clientes con transacciones:', error);
    } finally {
      setIsLoadingClientes(false);
    }
  };

  const fetchDetallesCliente = async (cedula: string) => {
    try {
      const response = await fetch(`/api/admin/clientes/${cedula}/historial`);
      const data = await response.json();

      if (data.success) {
        setClienteDetalles(data);
        setShowClienteDetalles(true);
      }
    } catch (error) {
      console.error('Error loading detalles cliente:', error);
    }
  };

  const toggleExpandCliente = async (clienteId: string, cedula: string) => {
    if (expandedClienteId === clienteId) {
      setExpandedClienteId(null);
    } else {
      setExpandedClienteId(clienteId);
      // Cargar el historial del cliente
      await fetchClienteHistorial(cedula);
    }
  };

  const buscarClientePorNombreOCedula = async (termino: string) => {
    if (!termino.trim()) return;

    setIsLoadingHistorial(true);
    try {
      // Si es solo números, buscar por cédula directamente
      if (/^\d+$/.test(termino)) {
        await fetchClienteHistorial(termino);
      } else {
        // Buscar por nombre en la lista de clientes
        const response = await fetch('/api/admin/estadisticas/?periodo=7days');
        const data = await response.json();

        if (data.success) {
          const clienteEncontrado = data.estadisticas.topClientes.find(
            (cliente: any) =>
              cliente.nombre.toLowerCase().includes(termino.toLowerCase())
          );

          if (clienteEncontrado) {
            await fetchClienteHistorial(clienteEncontrado.cedula);
          } else {
            console.error('Cliente no encontrado');
            setClienteHistorial(null);
          }
        }
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setClienteHistorial(null);
    } finally {
      setIsLoadingHistorial(false);
    }
  };

// ========================================
// 👥 SECCIÓN: FUNCIONES DE GESTIÓN DE USUARIOS (500-650)
// ========================================
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createUserData),
      });

      if (response.ok) {
        setCreateUserData({ name: '', email: '', password: '', role: 'STAFF' });
        setShowCreateUser(false);
        fetchUsers(); // Recargar la lista
      } else {
        const error = await response.json();
        console.error('Error creating user:', error);
        alert(error.error || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este usuario?'))
      return;

    try {
      const response = await fetch(`/api/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isActive: false }),
      });

      if (response.ok) {
        fetchUsers(); // Recargar la lista
      } else {
        alert('Error al desactivar usuario');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Error al desactivar usuario');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isActive: true }),
      });

      if (response.ok) {
        fetchUsers(); // Recargar la lista
      } else {
        alert('Error al activar usuario');
      }
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Error al activar usuario');
    }
  };

  const handleGoalsSave = async () => {
    // Refrescar las estadísticas para mostrar las nuevas metas
    await fetchEstadisticas();
  };

  const renderUserTableContent = () => {
    if (isLoadingUsers) {
      return (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando usuarios...</p>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="p-8 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No hay usuarios creados</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black/20 border-b border-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Último Login
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {users.map(userData => (
              <tr
                key={userData.id}
                className="hover:bg-black/20 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                      {userData.name
                        ? userData.name.charAt(0).toUpperCase()
                        : '?'}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-white">
                        {userData.name || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-400">
                        ID: {userData.id ? userData.id.slice(0, 8) : 'N/A'}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {userData.email || 'Sin email'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getRoleColorClass(userData.role)}>
                    {userData.role || 'Sin rol'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusColorClass(userData.isActive)}>
                    {getStatusText(userData.isActive)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {userData.lastLogin
                    ? new Date(userData.lastLogin).toLocaleDateString()
                    : 'Nunca'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {userData.role !== 'SUPERADMIN' && (
                      <>
                        {userData.isActive ? (
                          <button
                            onClick={() => handleDeactivateUser(userData.id)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1 rounded"
                            title="Desactivar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(userData.id)}
                            className="text-green-400 hover:text-green-300 transition-colors p-1 rounded"
                            title="Activar usuario"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

// ========================================
// 🎨 SECCIÓN: FUNCIONES AUXILIARES Y RENDER (651-700)
// ========================================
  const getRoleColorClass = (role: string) => {
    if (role === 'SUPERADMIN') {
      return 'inline-flex px-3 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300';
    }
    if (role === 'ADMIN') {
      return 'inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300';
    }
    return 'inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300';
  };

  const getStatusColorClass = (isActive: boolean) => {
    if (isActive) {
      return 'inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300';
    }
    return 'inline-flex px-3 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300';
  };

  const getStatusText = (isActive: boolean | undefined) => {
    if (isActive === undefined) return 'Desconocido';
    if (isActive) return 'Activo';
    return 'Inactivo';
  };

// ========================================
// ⚡ SECCIÓN: LOADING STATE Y DATOS POR DEFECTO (701-750)
// ========================================
  // Mostrar loading mientras se verifica autenticación
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Datos por defecto mientras se cargan los reales
  const defaultAnalytics: SuperAdminAnalytics = {
    totalClients: 0,
    totalConsumos: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    defaultRate: 0,
    riskClients: 0,
    dailyTransactions: 0,
    topProducts: [],
  };

  const currentAnalytics = analytics || defaultAnalytics;

  const recentActivity = [
    {
      time: '14:32',
      action: 'Nuevo cliente registrado',
      detail: 'Juan Pérez - Portal Centro',
      type: 'success',
      user: 'System',
    },
    {
      time: '14:30',
      action: 'Usuario Admin creado',
      detail: 'María García - Sucursal Norte',
      type: 'info',
      user: 'SuperAdmin',
    },
    {
      time: '14:28',
      action: 'Consumo procesado',
      detail: '$45.50 - Carlos López',
      type: 'success',
      user: 'Staff Ana',
    },
    {
      time: '14:25',
      action: 'Cliente de riesgo detectado',
      detail: 'Luis Martín - 3 impagos consecutivos',
      type: 'warning',
      user: 'System',
    },
    {
      time: '14:20',
      action: 'Backup automático',
      detail: 'Base de datos - Completado',
      type: 'success',
      user: 'System',
    },
    {
      time: '14:15',
      action: 'Staff login',
      detail: 'Ana Rodríguez - Terminal Centro',
      type: 'info',
      user: 'Staff Ana',
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'historial', label: 'Historial Clientes', icon: Eye },
    { id: 'system', label: 'Sistema', icon: Server },
  ];

// ========================================
// 🖼️ SECCIÓN: JSX RENDER PRINCIPAL - HEADER Y NAVEGACIÓN (751-850)
// ========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Super
                </span>
                <span className="text-gray-100">Admin</span>
              </h1>
              <p className="text-gray-400 text-lg">
                {user?.business?.name || 'Control Center'} - Business Management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right mr-4">
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
              <RoleSwitch
                currentRole={user?.role || 'SUPERADMIN'}
                currentPath="/superadmin"
              />
              <div className="px-4 py-2 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20 backdrop-blur-sm">
                <span className="text-sm font-medium">Sistema Operativo</span>
              </div>
              <button
                onClick={logout}
                className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 backdrop-blur-sm hover:bg-red-500/20 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex space-x-1 bg-gray-900/80 p-1 rounded-xl border border-gray-800 backdrop-blur-sm">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ========================================
            📊 SECCIÓN: TAB OVERVIEW - MÉTRICAS Y GRÁFICOS (841-1400)
            ======================================== */}
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <MetricCard
                title="Total Clientes"
                value={formatNumber(currentAnalytics.totalClients)}
                icon={<Users className="w-6 h-6" />}
                gradient="from-blue-600 to-cyan-600"
                change={`+${currentAnalytics.monthlyGrowth}%`}
                subtitle="crecimiento mensual"
              />
              <MetricCard
                title="Ingresos Totales"
                value={formatCurrency(currentAnalytics.totalRevenue)}
                icon={<DollarSign className="w-6 h-6" />}
                gradient="from-green-600 to-emerald-600"
                change="+24.3%"
                subtitle="este mes"
              />
              <MetricCard
                title="Transacciones"
                value={formatNumber(currentAnalytics.dailyTransactions)}
                icon={<Activity className="w-6 h-6" />}
                gradient="from-purple-600 to-blue-600"
                change="+18.2%"
                subtitle="hoy"
              />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                    Ingresos por{' '}
                    {tipoGrafico.charAt(0).toUpperCase() + tipoGrafico.slice(1)}
                  </h2>
                  <button
                    onClick={() => {
                      setFiltroMes('');
                      setFiltroAño('');
                      setTipoGrafico('semana');
                    }}
                    className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white border border-gray-700/50 rounded-lg text-sm transition-all duration-200"
                  >
                    Restablecer
                  </button>
                </div>

                {/* Selector de período mejorado */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {(['semana', 'mes', 'semestre', 'año'] as const).map(
                      tipo => (
                        <button
                          key={tipo}
                          onClick={() => setTipoGrafico(tipo)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            tipoGrafico === tipo
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25'
                              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border border-gray-700/50'
                          }`}
                        >
                          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        </button>
                      )
                    )}
                  </div>

                  {/* Filtros específicos mejorados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="filtro-mes" className="text-sm font-medium text-gray-300 flex items-center">
                        <span className="mr-2">📅</span> Filtrar por mes específico
                      </label>
                      <input
                        id="filtro-mes"
                        type="month"
                        value={filtroMes}
                        onChange={e => setFiltroMes(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-900/70 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 [color-scheme:dark]"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="filtro-año" className="text-sm font-medium text-gray-300 flex items-center">
                        <span className="mr-2">🗓️</span> Filtrar por año específico
                      </label>
                      <input
                        id="filtro-año"
                        type="number"
                        placeholder="Ej: 2025"
                        value={filtroAño}
                        onChange={e => setFiltroAño(e.target.value)}
                        min="2020"
                        max="2030"
                        className="w-full px-4 py-2.5 bg-gray-900/70 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 [color-scheme:dark]"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                  
                  {/* Indicador de filtros activos */}
                  {(filtroMes || filtroAño) && (
                    <div className="mt-4 flex items-center space-x-2">
                      <span className="text-xs font-medium text-blue-400">Filtros activos:</span>
                      {filtroMes && (
                        <span className="px-3 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full border border-blue-600/30">
                          📅 {new Date(filtroMes + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                      )}
                      {filtroAño && (
                        <span className="px-3 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full border border-blue-600/30">
                          🗓️ {filtroAño}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Estadísticas del período */}
                {datosGrafico && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-400">
                        ${datosGrafico.resumen.totalIngresos || 0}
                      </div>
                      <div className="text-xs text-gray-400">
                        Total Ingresos
                      </div>
                    </div>
                    <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-400">
                        {datosGrafico.resumen.totalTransacciones || 0}
                      </div>
                      <div className="text-xs text-gray-400">Transacciones</div>
                    </div>
                    <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-purple-400">
                        $
                        {(
                          (datosGrafico.resumen.totalIngresos || 0) /
                          Math.max(
                            datosGrafico.resumen.totalTransacciones || 1,
                            1
                          )
                        ).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Promedio por Venta
                      </div>
                    </div>
                    <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-yellow-400">
                        ${datosGrafico.resumen.maxValor || 0}
                      </div>
                      <div className="text-xs text-gray-400">
                        Día/Período Top
                      </div>
                    </div>
                  </div>
                )}

                {/* Gráfico de barras mejorado */}
                <div className="h-80 bg-black/30 rounded-xl border border-gray-800/30 p-4 relative">
                  {(() => {
                    if (isLoadingGrafico) {
                      return (
                        <div className="h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                        </div>
                      );
                    }

                    if (datosGrafico) {
                      return (
                        <>
                          {/* Escala Y */}
                          <div className="absolute left-0 top-4 bottom-8 flex flex-col justify-between text-xs text-gray-500 pr-2">
                            {[100, 75, 50, 25, 0].map(porcentaje => {
                              const valor = Math.round(
                                (datosGrafico.resumen?.maxValor || 0) *
                                  (porcentaje / 100)
                              );
                              return (
                                <div key={porcentaje} className="text-right">
                                  ${valor}
                                </div>
                              );
                            })}
                          </div>

                          {/* Contenedor del gráfico */}
                          <div className="ml-8 h-full flex items-end justify-between space-x-1">
                            {datosGrafico.datos.map(
                              (item: any, index: number) => {
                                const maxValor =
                                  datosGrafico.resumen.maxValor || 1;
                                const altura =
                                  maxValor > 0
                                    ? (item.valor / maxValor) * 100
                                    : 0;
                                const tieneVentas = item.valor > 0;

                                // Función para determinar las clases CSS de la barra
                                const getBarClasses = () => {
                                  if (tieneVentas) {
                                    return 'bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 shadow-lg shadow-blue-600/20';
                                  }
                                  return 'bg-gray-700/50';
                                };

                                return (
                                  <div
                                    key={`chart-${item.label}-${index}`}
                                    className="flex flex-col items-center flex-1 h-full group"
                                  >
                                    {/* Tooltip */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 bg-black/90 text-white p-2 rounded-lg text-xs whitespace-nowrap z-10 transform -translate-x-1/2">
                                      <div className="font-semibold">
                                        {item.label}
                                      </div>
                                      <div className="text-green-400">
                                        ${item.valor}
                                      </div>
                                      <div className="text-blue-400">
                                        {item.transacciones} transacciones
                                      </div>
                                      {datosGrafico.resumen.totalTransacciones >
                                        0 && (
                                        <div className="text-gray-300">
                                          {(
                                            (item.transacciones /
                                              datosGrafico.resumen
                                                .totalTransacciones) *
                                            100
                                          ).toFixed(1)}
                                          % del total
                                        </div>
                                      )}
                                    </div>

                                    {/* Barra */}
                                    <div className="flex-1 flex items-end w-full">
                                      <div
                                        className={`w-full transition-all duration-500 hover:opacity-80 rounded-t-sm ${getBarClasses()}`}
                                        style={{
                                          height: `${Math.max(altura, tieneVentas ? 3 : 1)}%`,
                                          minHeight: tieneVentas
                                            ? '8px'
                                            : '2px',
                                        }}
                                      >
                                        {/* Valor en la barra */}
                                        {tieneVentas && altura > 15 && (
                                          <div className="text-white text-xs font-bold pt-1 text-center">
                                            ${item.valor}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Etiqueta */}
                                    <div className="text-xs text-gray-300 mt-2 text-center font-medium max-w-full">
                                      {item.label}
                                    </div>

                                    {/* Indicador de transacciones */}
                                    {item.transacciones > 0 && (
                                      <div className="text-xs text-blue-400 mt-1">
                                        {item.transacciones}tx
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>

                          {/* Líneas de referencia */}
                          <div className="absolute left-8 right-4 top-4 bottom-8 pointer-events-none">
                            {[25, 50, 75].map(porcentaje => (
                              <div
                                key={porcentaje}
                                className="absolute w-full border-t border-gray-700/30"
                                style={{ bottom: `${porcentaje}%` }}
                              />
                            ))}
                          </div>
                        </>
                      );
                    }

                    return (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-400">
                            No hay datos disponibles
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Resumen del gráfico */}
                {datosGrafico && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">
                        ${datosGrafico.resumen.totalIngresos}
                      </p>
                      <p className="text-gray-400 text-sm">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {datosGrafico.resumen.totalTransacciones}
                      </p>
                      <p className="text-gray-400 text-sm">Transacciones</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">
                        ${datosGrafico.resumen.promedioPorPeriodo}
                      </p>
                      <p className="text-gray-400 text-sm">Promedio</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Top Products */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl"
              >
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  Top Productos por Cantidad
                </h2>

                <div className="space-y-4">
                  {currentAnalytics.topProducts.map((product, index) => (
                    <div
                      key={`${product.name}-${product.sales}`}
                      className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-gray-800/30 hover:border-gray-700/50 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {product.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Producto más vendido
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold text-lg">
                          {product.sales}
                        </p>
                        <p className="text-gray-400 text-xs">
                          unidades vendidas
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl"
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-cyan-400" />
                Actividad Reciente del Sistema
              </h2>

              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={`${activity.action}-${activity.time}-${index}`}
                    className="flex items-center space-x-4 p-4 bg-black/20 rounded-xl border border-gray-800/30 hover:border-gray-700/50 transition-all"
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full ${getActivityColor(activity.type)} shadow-lg`}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">
                        {activity.action}
                      </p>
                      <p className="text-gray-400 text-xs">{activity.detail}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-gray-500 text-xs">
                        {activity.time}
                      </span>
                      <p className="text-gray-600 text-xs">{activity.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Users Tab - Gestor de Usuarios */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header del Gestor de Usuarios */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Users className="w-6 h-6 mr-3 text-blue-400" />
                  Gestor de Usuarios
                </h2>
                <p className="text-gray-400 mt-1">
                  Administra usuarios del sistema Lealta
                </p>
              </div>
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Crear Usuario
              </button>
            </div>

            {/* Modal de Crear Usuario */}
            {showCreateUser && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={e =>
                  e.target === e.currentTarget && setShowCreateUser(false)
                }
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl w-full max-w-md"
                >
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-blue-400" />
                    Crear Nuevo Usuario
                  </h3>

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label
                        htmlFor="create-user-name"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Nombre Completo
                      </label>
                      <input
                        id="create-user-name"
                        type="text"
                        value={createUserData.name}
                        onChange={e =>
                          setCreateUserData(prev => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="create-user-email"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Email
                      </label>
                      <input
                        id="create-user-email"
                        type="email"
                        value={createUserData.email}
                        onChange={e =>
                          setCreateUserData(prev => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="create-user-password"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Contraseña
                      </label>
                      <input
                        id="create-user-password"
                        type="password"
                        value={createUserData.password}
                        onChange={e =>
                          setCreateUserData(prev => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="create-user-role"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Rol
                      </label>
                      <select
                        id="create-user-role"
                        value={createUserData.role}
                        onChange={e =>
                          setCreateUserData(prev => ({
                            ...prev,
                            role: e.target.value as 'ADMIN' | 'STAFF',
                          }))
                        }
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateUser(false)}
                        className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingUser}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                      >
                        {isCreatingUser ? 'Creando...' : 'Crear Usuario'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {/* Lista de Usuarios */}
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-800/50">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-cyan-400" />
                  Lista de Usuarios
                </h3>
              </div>

              {renderUserTableContent()}
            </div>
          </motion.div>
        )}

        {/* Historial de Clientes Tab */}
        {activeTab === 'historial' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header del Historial */}
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Eye className="w-6 h-6 mr-3 text-green-400" />
                Historial de Clientes
              </h2>
              <p className="text-gray-400 mt-1">
                Transacciones registradas automáticamente
              </p>
            </div>

            {/* Buscador Manual (Sección Principal) */}
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/50 shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Búsqueda de Cliente
              </h3>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={selectedClienteHistorial}
                    onChange={e => setSelectedClienteHistorial(e.target.value)}
                    placeholder="Ingrese cédula o nombre del cliente..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={50}
                  />
                </div>
                <button
                  onClick={() =>
                    buscarClientePorNombreOCedula(selectedClienteHistorial)
                  }
                  disabled={
                    isLoadingHistorial || selectedClienteHistorial.length < 2
                  }
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isLoadingHistorial ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      <span>Buscar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Loading */}
            {isLoadingClientes && (
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/50 shadow-2xl p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
                <p className="text-gray-400">
                  Cargando historial de clientes...
                </p>
              </div>
            )}

            {/* Clientes con Transacciones */}
            {!isLoadingClientes && clientesConTransacciones.length > 0 && (
              <div className="space-y-4">
                {clientesConTransacciones.map(cliente => (
                  <div
                    key={cliente.id}
                    className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden"
                  >
                    {/* Tarjeta del Cliente */}
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {cliente.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {cliente.nombre}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              Cédula: {cliente.cedula}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-green-400 font-bold">
                              ${cliente.totalGastado}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {cliente.totalVisitas} visitas
                            </p>
                          </div>

                          {/* Botón de Ver Detalles */}
                          <button
                            onClick={() => fetchDetallesCliente(cliente.cedula)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            title="Ver detalles del cliente"
                          >
                            <Eye className="w-5 h-5 text-white" />
                          </button>

                          {/* Botón de Expandir */}
                          <button
                            onClick={() =>
                              toggleExpandCliente(cliente.id, cliente.cedula)
                            }
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            {expandedClienteId === cliente.id ? (
                              <div className="w-5 h-5 text-white">−</div>
                            ) : (
                              <div className="w-5 h-5 text-white">+</div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Historial Expandido */}
                    {expandedClienteId === cliente.id && clienteHistorial && (
                      <div className="border-t border-gray-800/50 p-6 bg-gray-800/30">
                        <h4 className="text-white font-semibold mb-4">
                          Historial de Transacciones
                        </h4>

                        {/* Estadísticas Rápidas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                            <p className="text-gray-400 text-sm">
                              Total Consumos
                            </p>
                            <p className="text-white font-bold">
                              {clienteHistorial.estadisticas?.totalConsumos ||
                                0}
                            </p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                            <p className="text-gray-400 text-sm">
                              Total Gastado
                            </p>
                            <p className="text-green-400 font-bold">
                              $
                              {clienteHistorial.estadisticas?.totalGastadoCalculado?.toFixed(
                                2
                              ) || '0.00'}
                            </p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                            <p className="text-gray-400 text-sm">Promedio</p>
                            <p className="text-blue-400 font-bold">
                              $
                              {clienteHistorial.estadisticas?.promedioGasto?.toFixed(
                                2
                              ) || '0.00'}
                            </p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                            <p className="text-gray-400 text-sm">Puntos</p>
                            <p className="text-yellow-400 font-bold">
                              {clienteHistorial.cliente?.puntos || 0}
                            </p>
                          </div>
                        </div>

                        {/* Lista de Transacciones */}
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {clienteHistorial.historial?.map(
                            (consumo: any, index: number) => (
                              <div
                                key={`${consumo.id}-${index}`}
                                className="bg-gray-700/30 rounded-lg p-4"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-white font-semibold">
                                        ${consumo.total}
                                      </span>
                                      <span className="text-yellow-400">
                                        +{consumo.puntos} pts
                                      </span>
                                      <span
                                        className={`px-2 py-1 rounded text-xs ${
                                          consumo.tipo === 'MANUAL'
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-green-500/20 text-green-400'
                                        }`}
                                      >
                                        {consumo.tipo}
                                      </span>
                                    </div>
                                    <p className="text-gray-400 text-sm">
                                      {new Date(
                                        consumo.fecha
                                      ).toLocaleDateString('es-ES')}{' '}
                                      - {consumo.empleado}
                                    </p>
                                    {consumo.productos &&
                                      consumo.productos.length > 0 && (
                                        <p className="text-gray-300 text-sm mt-1">
                                          {consumo.productos
                                            .map(
                                              (p: any) =>
                                                `${p.nombre} (${p.cantidad})`
                                            )
                                            .join(', ')}
                                        </p>
                                      )}
                                  </div>
                                </div>
                              </div>
                            )
                          ) || (
                            <p className="text-gray-400 text-center py-4">
                              No hay transacciones registradas
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Estado Vacío */}
            {!isLoadingClientes && clientesConTransacciones.length === 0 && (
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/50 shadow-2xl p-8 text-center">
                <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No hay transacciones registradas
                </h3>
                <p className="text-gray-400">
                  Cuando el staff registre consumos manuales, aparecerán aquí
                  automáticamente.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Modal de Detalles del Cliente */}
        {showClienteDetalles && clienteDetalles && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header del Modal */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {clienteDetalles.cliente.nombre}
                    </h2>
                    <p className="text-gray-400">
                      Información completa del cliente
                    </p>
                  </div>
                  <button
                    onClick={() => setShowClienteDetalles(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="w-6 h-6 text-gray-400">✕</div>
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6 space-y-6">
                {/* Información */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Información
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Cédula</p>
                      <p className="text-white font-semibold">
                        {clienteDetalles.cliente.cedula}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="text-white font-semibold">
                        {clienteDetalles.cliente.correo || 'No registrado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Teléfono</p>
                      <p className="text-white font-semibold">
                        {clienteDetalles.cliente.telefono || 'No registrado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Puntos Actuales</p>
                      <p className="text-yellow-400 font-bold text-lg">
                        {clienteDetalles.cliente.puntos}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estado de Tarjeta */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Tarjeta de Lealtad
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Nivel Actual</p>
                      <p className="text-white font-semibold">
                        {clienteDetalles.cliente.tarjetaLealtad?.nivel ||
                          'Sin Tarjeta'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">
                        Fecha de Asignación
                      </p>
                      <p className="text-white font-semibold">
                        {clienteDetalles.cliente.tarjetaLealtad?.fechaAsignacion
                          ? new Date(
                              clienteDetalles.cliente.tarjetaLealtad.fechaAsignacion
                            ).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">
                        Tipo de Asignación
                      </p>
                      <p className="text-white font-semibold">
                        {clienteDetalles.cliente.tarjetaLealtad
                          ?.asignacionManual
                          ? 'Manual'
                          : 'Automática'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Estado</p>
                      <p
                        className={`font-semibold ${clienteDetalles.cliente.tarjetaLealtad?.nivel ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {clienteDetalles.cliente.tarjetaLealtad?.nivel
                          ? 'Activa'
                          : 'No Asignada'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Estadísticas
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">
                        $
                        {clienteDetalles.estadisticas?.totalGastadoCalculado?.toFixed(
                          2
                        ) || '0.00'}
                      </p>
                      <p className="text-gray-400 text-sm">Total Gastado</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {clienteDetalles.estadisticas?.totalConsumos || 0}
                      </p>
                      <p className="text-gray-400 text-sm">Consumos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">
                        $
                        {clienteDetalles.estadisticas?.promedioGasto?.toFixed(
                          2
                        ) || '0.00'}
                      </p>
                      <p className="text-gray-400 text-sm">Promedio</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">
                        {clienteDetalles.estadisticas?.totalPuntosGanados || 0}
                      </p>
                      <p className="text-gray-400 text-sm">Puntos Ganados</p>
                    </div>
                  </div>
                </div>

                {/* Productos Favoritos */}
                {clienteDetalles.estadisticas?.topProductos &&
                  clienteDetalles.estadisticas.topProductos.length > 0 && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Productos Consumidos
                      </h3>
                      <div className="space-y-2">
                        {clienteDetalles.estadisticas.topProductos.map(
                          (producto: any, index: number) => (
                            <div
                              key={`producto-${producto.nombre}-${index}`}
                              className="flex justify-between items-center bg-gray-700/50 rounded p-2"
                            >
                              <span className="text-white">
                                {producto.nombre}
                              </span>
                              <span className="text-green-400 font-semibold">
                                {producto.cantidad}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Filtro de Fechas */}
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                  Analytics Dashboard
                </h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowGoalsConfigurator(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Settings className="w-4 h-4" />
                    Configurar Metas
                  </button>
                  <DateRangePicker 
                    selectedRange={selectedDateRange}
                    onRangeChange={setSelectedDateRange}
                  />
                </div>
              </div>
              
              {/* Métricas Avanzadas */}
              <AdvancedMetrics 
                data={statsData?.estadisticas?.metricas}
              />
            </div>

            {/* Top Clientes y Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Clientes */}
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
                <TopClients 
                  clients={statsData?.estadisticas?.topClientes || []}
                  isLoading={isLoadingStats}
                />
              </div>

              {/* Gráfico de Tendencias */}
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                  Tendencias de Ventas
                </h3>
                
                {isLoadingGrafico ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Gráfico de tendencias en desarrollo</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Métricas Adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Clientes Activos</h4>
                    <p className="text-sm text-gray-400">Últimos 30 días</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {isLoadingStats ? '...' : statsData?.estadisticas?.resumen?.clientesActivos || 0}
                </div>
                <div className="text-sm text-emerald-400">
                  +12% vs período anterior
                </div>
              </div>

              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Ticket Promedio</h4>
                    <p className="text-sm text-gray-400">Por transacción</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  ${isLoadingStats ? '...' : statsData?.estadisticas?.resumen?.promedioVenta?.toFixed(0) || 0}
                </div>
                <div className="text-sm text-emerald-400">
                  +5% vs período anterior
                </div>
              </div>

              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Transacciones</h4>
                    <p className="text-sm text-gray-400">Total del período</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {isLoadingStats ? '...' : statsData?.estadisticas?.resumen?.totalConsumos || 0}
                </div>
                <div className="text-sm text-emerald-400">
                  +18% vs período anterior
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Other Tabs Placeholder */}
        {activeTab !== 'overview' &&
          activeTab !== 'users' &&
          activeTab !== 'historial' &&
          activeTab !== 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50 shadow-2xl"
            >
              <div className="text-center py-16">
                {activeTab === 'system' && (
                  <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                )}

                <h3 className="text-2xl font-semibold text-white mb-3 capitalize">
                  {activeTab}
                </h3>
                <p className="text-gray-400 mb-8 text-lg">
                  Esta sección está en desarrollo
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-500 max-w-lg mx-auto">
                  {activeTab === 'system' && (
                    <>
                      <div className="p-3 bg-black/20 rounded-lg border border-gray-800/30">
                        <p>• Estado del servidor</p>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg border border-gray-800/30">
                        <p>• Configuración</p>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg border border-gray-800/30">
                        <p>• Logs del sistema</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
      </div>

      {/* Modal de Configuración de Metas */}
      {showGoalsConfigurator && (
        <GoalsConfigurator
          onClose={() => setShowGoalsConfigurator(false)}
          onSave={handleGoalsSave}
        />
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  gradient,
  change,
  subtitle,
}: Readonly<{
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  change: string;
  subtitle: string;
}>) {
  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl hover:border-gray-700/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}
        >
          {icon}
        </div>
        <span
          className={`text-sm font-medium px-2 py-1 rounded-lg ${getChangeColor(change)} bg-black/20`}
        >
          {change}
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold text-white mb-2 drop-shadow-sm">
          {value}
        </p>
        <p className="text-gray-300 text-sm font-medium">{title}</p>
        <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
