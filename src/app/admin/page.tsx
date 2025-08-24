'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  Settings,
  Search,
  Filter,
  MoreVertical,
  Eye
} from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalConsumos: 0,
    totalRevenue: 0,
    unpaidCount: 0
  });

  useEffect(() => {
    // In a real app, fetch data from APIs
    // Placeholder data
    setStats({
      totalClients: 156,
      totalConsumos: 423,
      totalRevenue: 15678.50,
      unpaidCount: 12
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Dashboard <span className="gradient-primary bg-clip-text text-transparent">Admin</span>
              </h1>
              <p className="text-dark-400">
                Panel de gestión y control
              </p>
            </div>
            <button className="p-3 bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-600 transition-colors">
              <Settings className="w-6 h-6 text-dark-300" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Clients Table */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Clientes Recientes</h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
                  <Search className="w-4 h-4 text-dark-400" />
                </button>
                <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-dark-400" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Sample client data */}
              {[
                { id: 1, nombre: 'Juan Pérez', cedula: '12345678', puntos: 150, lastVisit: '2024-08-23' },
                { id: 2, nombre: 'María García', cedula: '23456789', puntos: 300, lastVisit: '2024-08-22' },
                { id: 3, nombre: 'Carlos López', cedula: '34567890', puntos: 75, lastVisit: '2024-08-21' },
                { id: 4, nombre: 'Ana Martínez', cedula: '45678901', puntos: 220, lastVisit: '2024-08-20' },
              ].map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {client.nombre.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{client.nombre}</p>
                      <p className="text-dark-400 text-sm">{client.cedula}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-success-400 font-semibold">{client.puntos} pts</p>
                    <p className="text-dark-400 text-sm">{client.lastVisit}</p>
                  </div>
                  <button className="p-1 hover:bg-dark-700 rounded">
                    <MoreVertical className="w-4 h-4 text-dark-400" />
                  </button>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 text-primary-400 hover:text-primary-300 transition-colors">
              Ver todos los clientes
            </button>
          </div>

          {/* Consumos Table */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Consumos Recientes</h2>
              <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
                <Eye className="w-4 h-4 text-dark-400" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Sample consumo data */}
              {[
                { id: 1, cliente: 'Juan Pérez', total: 45.50, estado: 'Pagado', fecha: '2024-08-23 14:30' },
                { id: 2, cliente: 'María García', total: 78.00, estado: 'Pendiente', fecha: '2024-08-23 13:15' },
                { id: 3, cliente: 'Carlos López', total: 32.25, estado: 'Pagado', fecha: '2024-08-23 12:45' },
                { id: 4, cliente: 'Ana Martínez', total: 65.75, estado: 'Pagado', fecha: '2024-08-23 11:20' },
              ].map((consumo) => (
                <div key={consumo.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                  <div>
                    <p className="text-white font-medium">{consumo.cliente}</p>
                    <p className="text-dark-400 text-sm">{consumo.fecha}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">${consumo.total}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      consumo.estado === 'Pagado' 
                        ? 'bg-success-500/20 text-success-400' 
                        : 'bg-warning-500/20 text-warning-400'
                    }`}>
                      {consumo.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 text-primary-400 hover:text-primary-300 transition-colors">
              Ver todos los consumos
            </button>
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
