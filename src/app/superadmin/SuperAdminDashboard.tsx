'use client';

import { useState, useEffect } from 'react';
import { motion } from '../../components/motion';
import { useRequireAuth } from '../../hooks/useAuth';
import RoleSwitch from '../../components/RoleSwitch';
import { 
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  DollarSign,
  UserPlus,
  Shield,
  Server,
  LogOut,
  Trash2,
  Eye
} from 'lucide-react';

// Helper functions
const getActivityColor = (type: string) => {
  switch (type) {
    case 'success': return 'bg-green-500 shadow-green-500/50';
    case 'warning': return 'bg-yellow-500 shadow-yellow-500/50';
    case 'error': return 'bg-red-500 shadow-red-500/50';
    case 'info': return 'bg-blue-500 shadow-blue-500/50';
    default: return 'bg-gray-500 shadow-gray-500/50';
  }
};

const getChangeColor = (change: string) => {
  if (change.startsWith('+')) return 'text-green-400';
  if (change.startsWith('-')) return 'text-yellow-400';
  return 'text-cyan-400';
};

// Format numbers consistently to avoid hydration issues
const formatNumber = (num: number): string => {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatCurrency = (num: number): string => {
  return `$${formatNumber(num)}`;
};

interface SuperAdminAnalytics {
  totalClients: number;
  totalConsumos: number;
  totalRevenue: number;
  monthlyGrowth: number;
  defaultRate: number;
  riskClients: number;
  dailyTransactions: number;
  topProducts: Array<{ name: string; sales: number; revenue: number; trend: string }>;
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

export default function SuperAdminPage() {
  const { user, loading, logout, isAuthenticated } = useRequireAuth('SUPERADMIN');
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'risk' | 'system'>('overview');
  
  // Estados para el gestor de usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    role: 'STAFF'
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Cargar usuarios cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === 'users' && isAuthenticated) {
      fetchUsers();
    }
  }, [activeTab, isAuthenticated]);

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
    if (!confirm('¿Estás seguro de que quieres desactivar este usuario?')) return;
    
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
            {users.map((userData) => (
              <tr key={userData.id} className="hover:bg-black/20 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                      {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
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
                    : 'Nunca'
                  }
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
  
  const analytics: SuperAdminAnalytics = {
    totalClients: 1247,
    totalConsumos: 3856,
    totalRevenue: 87654.32,
    monthlyGrowth: 18.5,
    defaultRate: 3.2,
    riskClients: 23,
    dailyTransactions: 156,
    topProducts: [
      { name: 'Cerveza Premium', sales: 456, revenue: 12354.50, trend: '+12%' },
      { name: 'Cocktail Especial', sales: 234, revenue: 8976.25, trend: '+8%' },
      { name: 'Vino Tinto', sales: 189, revenue: 7534.80, trend: '+15%' },
      { name: 'Entrada Mixta', sales: 167, revenue: 5845.30, trend: '+3%' },
      { name: 'Postre Premium', sales: 123, revenue: 4567.80, trend: '+22%' },
    ],
  };

  const recentActivity = [
    { time: '14:32', action: 'Nuevo cliente registrado', detail: 'Juan Pérez - Portal Centro', type: 'success', user: 'System' },
    { time: '14:30', action: 'Usuario Admin creado', detail: 'María García - Sucursal Norte', type: 'info', user: 'SuperAdmin' },
    { time: '14:28', action: 'Consumo procesado', detail: '$45.50 - Carlos López', type: 'success', user: 'Staff Ana' },
    { time: '14:25', action: 'Cliente de riesgo detectado', detail: 'Luis Martín - 3 impagos consecutivos', type: 'warning', user: 'System' },
    { time: '14:20', action: 'Backup automático', detail: 'Base de datos - Completado', type: 'success', user: 'System' },
    { time: '14:15', action: 'Staff login', detail: 'Ana Rodríguez - Terminal Centro', type: 'info', user: 'Staff Ana' },
  ];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'risk', label: 'Riesgo', icon: AlertTriangle },
    { id: 'system', label: 'Sistema', icon: Server },
  ];

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
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Super</span> 
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
            {tabs.map((tab) => {
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <MetricCard
                title="Total Clientes"
                value={formatNumber(analytics.totalClients)}
                icon={<Users className="w-6 h-6" />}
                gradient="from-blue-600 to-cyan-600"
                change={`+${analytics.monthlyGrowth}%`}
                subtitle="crecimiento mensual"
              />
              <MetricCard
                title="Ingresos Totales"
                value={formatCurrency(analytics.totalRevenue)}
                icon={<DollarSign className="w-6 h-6" />}
                gradient="from-green-600 to-emerald-600"
                change="+24.3%"
                subtitle="este mes"
              />
              <MetricCard
                title="Transacciones"
                value={formatNumber(analytics.dailyTransactions)}
                icon={<Activity className="w-6 h-6" />}
                gradient="from-purple-600 to-blue-600"
                change="+18.2%"
                subtitle="hoy"
              />
              <MetricCard
                title="Tasa de Riesgo"
                value={`${analytics.defaultRate}%`}
                icon={<AlertTriangle className="w-6 h-6" />}
                gradient="from-orange-600 to-red-600"
                change="-0.8%"
                subtitle="mejora continua"
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
                    Ingresos por Mes
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm shadow-lg">
                      2024
                    </button>
                    <button className="px-4 py-2 bg-gray-800/50 text-gray-400 rounded-lg text-sm hover:bg-gray-700/50 transition-colors">
                      2023
                    </button>
                  </div>
                </div>

                {/* Chart placeholder */}
                <div className="h-64 bg-black/30 rounded-xl flex items-center justify-center border border-gray-800/30">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">Gráfico de ingresos</p>
                    <p className="text-gray-600 text-sm">Integración con Chart.js pendiente</p>
                  </div>
                </div>
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
                  Top Productos
                </h2>

                <div className="space-y-4">
                  {analytics.topProducts.map((product, index) => (
                    <div key={`${product.name}-${product.sales}`} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-gray-800/30 hover:border-gray-700/50 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{product.name}</p>
                          <p className="text-gray-400 text-xs">{product.sales} ventas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold text-sm">{formatCurrency(product.revenue)}</p>
                        <p className="text-blue-400 text-xs">{product.trend}</p>
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
                  <div key={`${activity.action}-${activity.time}-${index}`} className="flex items-center space-x-4 p-4 bg-black/20 rounded-xl border border-gray-800/30 hover:border-gray-700/50 transition-all">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${getActivityColor(activity.type)} shadow-lg`}></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{activity.action}</p>
                      <p className="text-gray-400 text-xs">{activity.detail}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-gray-500 text-xs">{activity.time}</span>
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
                <p className="text-gray-400 mt-1">Administra usuarios del sistema Lealta</p>
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
                onClick={(e) => e.target === e.currentTarget && setShowCreateUser(false)}
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
                      <label htmlFor="create-user-name" className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre Completo
                      </label>
                      <input
                        id="create-user-name"
                        type="text"
                        value={createUserData.name}
                        onChange={(e) => setCreateUserData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="create-user-email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        id="create-user-email"
                        type="email"
                        value={createUserData.email}
                        onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="create-user-password" className="block text-sm font-medium text-gray-300 mb-2">
                        Contraseña
                      </label>
                      <input
                        id="create-user-password"
                        type="password"
                        value={createUserData.password}
                        onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={6}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="create-user-role" className="block text-sm font-medium text-gray-300 mb-2">
                        Rol
                      </label>
                      <select
                        id="create-user-role"
                        value={createUserData.role}
                        onChange={(e) => setCreateUserData(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'STAFF' }))}
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

        {/* Other Tabs Placeholder */}
        {activeTab !== 'overview' && activeTab !== 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50 shadow-2xl"
          >
            <div className="text-center py-16">
              {activeTab === 'analytics' && <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />}
              {activeTab === 'risk' && <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />}
              {activeTab === 'system' && <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />}
              
              <h3 className="text-2xl font-semibold text-white mb-3 capitalize">{activeTab}</h3>
              <p className="text-gray-400 mb-8 text-lg">Esta sección está en desarrollo</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-500 max-w-lg mx-auto">
                {activeTab === 'analytics' && (
                  <>
                    <div className="p-3 bg-black/20 rounded-lg border border-gray-800/30">
                      <p>• Gráficos detallados</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-gray-800/30">
                      <p>• Métricas avanzadas</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-gray-800/30">
                      <p>• Exportar reportes</p>
                    </div>
                  </>
                )}
                {activeTab === 'risk' && (
                  <>
                    <div className="p-3 bg-black/20 rounded-lg border border-gray-800/30">
                      <p>• Análisis de riesgo</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-gray-800/30">
                      <p>• Alertas automáticas</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-gray-800/30">
                      <p>• Configurar límites</p>
                    </div>
                  </>
                )}
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
    </div>
  );
}

function MetricCard({ title, value, icon, gradient, change, subtitle }: Readonly<{
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
        <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <span className={`text-sm font-medium px-2 py-1 rounded-lg ${getChangeColor(change)} bg-black/20`}>
          {change}
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold text-white mb-2 drop-shadow-sm">{value}</p>
        <p className="text-gray-300 text-sm font-medium">{title}</p>
        <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
      </div>
    </div>
  );
}