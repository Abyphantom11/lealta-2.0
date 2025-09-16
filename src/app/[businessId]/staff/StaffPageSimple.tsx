'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '../../../hooks/useAuth';
import RoleSwitch from '../../../components/RoleSwitch';
import {
  Users,
  TrendingUp,
  FileText,
  Clock,
} from 'lucide-react';

interface StaffPageProps {
  businessId: string;
}

export default function StaffPageSimple({ businessId }: StaffPageProps) {
  const { loading, isAuthenticated } = useRequireAuth('STAFF');
  const [stats, setStats] = useState({
    totalClients: 0,
    todayVisits: 0,
    pendingTasks: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Cargar estadísticas básicas
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      // Implementar carga de estadísticas básicas
      setStats({
        totalClients: 150,
        todayVisits: 12,
        pendingTasks: 3,
        revenue: 2500,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Panel de Staff</h1>
          <RoleSwitch 
            currentRole="STAFF" 
            currentPath={`/${businessId}/staff`}
            businessId={businessId} 
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Clientes Total</p>
                <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Visitas Hoy</p>
                <p className="text-2xl font-bold text-white">{stats.todayVisits}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Tareas Pendientes</p>
                <p className="text-2xl font-bold text-white">{stats.pendingTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Ingresos</p>
                <p className="text-2xl font-bold text-white">${stats.revenue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              Registrar Cliente
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors">
              Procesar Venta
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
              Ver Reportes
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Actividad Reciente</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span className="text-gray-300">Nuevo cliente registrado</span>
              <span className="text-gray-500 text-sm">Hace 2 horas</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span className="text-gray-300">Venta procesada - $150</span>
              <span className="text-gray-500 text-sm">Hace 4 horas</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span className="text-gray-300">Reporte generado</span>
              <span className="text-gray-500 text-sm">Ayer</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
