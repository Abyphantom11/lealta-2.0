'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRequireAuth } from '../../../hooks/useAuth';
import { UserPlus, LogOut } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  creator?: {
    name: string;
    email: string;
  };
}

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
}

export default function SuperAdminDashboard() {
  const {
    user,
    loading: authLoading,
    logout,
    isAuthenticated,
  } = useRequireAuth('SUPERADMIN');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    role: 'STAFF',
  });

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        throw new Error('Error cargando usuarios');
      }
    } catch (error) {
      setError('Error cargando usuarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  // Mostrar loading mientras se verifica autenticación
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Crear usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setSuccess('Usuario creado exitosamente');
        setNewUser({ email: '', password: '', name: '', role: 'STAFF' });
        setShowCreateForm(false);
        loadUsers(); // Recargar lista
      } else {
        const data = await response.json();
        setError(data.error || 'Error creando usuario');
      }
    } catch (error) {
      setError('Error de conexión');
      console.error(error);
    } finally {
      setCreateLoading(false);
    }
  };

  // Desactivar usuario
  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setSuccess('Usuario desactivado correctamente');
        loadUsers(); // Recargar lista
      } else {
        const data = await response.json();
        setError(data.error || 'Error desactivando usuario');
      }
    } catch (error) {
      setError('Error de conexión');
      console.error(error);
    }
  };

  // Logout usando el hook
  const handleLogout = () => {
    logout();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'STAFF':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Dashboard SuperAdmin
              </h1>
              <p className="text-blue-200">
                {user?.business?.name ||
                  'Gestión completa de usuarios y negocio'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right mr-4">
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 bg-red-600 hover:bg-red-700 rounded-lg border border-red-500 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Alertas */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/20 border border-green-500 text-green-100 px-4 py-3 rounded-lg mb-6"
          >
            {success}
          </motion.div>
        )}

        {/* Botón para crear usuario */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            {showCreateForm ? 'Cancelar' : 'Crear Usuario'}
          </button>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-white mb-4">
              Crear Nuevo Usuario
            </h2>
            <form
              onSubmit={handleCreateUser}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label htmlFor="user-name" className="block text-white mb-2">
                  Nombre
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={newUser.name}
                  onChange={e =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:border-white/60 focus:outline-none"
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div>
                <label htmlFor="user-email" className="block text-white mb-2">
                  Email
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={newUser.email}
                  onChange={e =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:border-white/60 focus:outline-none"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="user-password"
                  className="block text-white mb-2"
                >
                  Password
                </label>
                <input
                  id="user-password"
                  type="password"
                  value={newUser.password}
                  onChange={e =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:border-white/60 focus:outline-none"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="user-role" className="block text-white mb-2">
                  Rol
                </label>
                <select
                  id="user-role"
                  value={newUser.role}
                  onChange={e =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as 'ADMIN' | 'STAFF',
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:border-white/60 focus:outline-none"
                  required
                >
                  <option value="STAFF" className="text-black">
                    Staff
                  </option>
                  <option value="ADMIN" className="text-black">
                    Admin
                  </option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-8 py-2 rounded-lg transition-colors"
                >
                  {createLoading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Usuarios del Sistema
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="text-white mt-2">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4">Usuario</th>
                    <th className="text-left py-3 px-4">Rol</th>
                    <th className="text-left py-3 px-4">Último Login</th>
                    <th className="text-left py-3 px-4">Creado</th>
                    <th className="text-left py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr
                      key={user.id}
                      className="border-b border-white/10 hover:bg-white/5"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-white/70">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Nunca'}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        {user.role !== 'SUPERADMIN' && (
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Desactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center py-8 text-white/70">
                  No hay usuarios registrados
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
