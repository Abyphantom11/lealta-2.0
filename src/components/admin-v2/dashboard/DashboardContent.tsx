'use client';

import React from 'react';
import { 
  Users, 
  Receipt, 
  DollarSign, 
  TrendingUp,
  Plus,
  UtensilsCrossed,
  Smartphone,
  BarChart3
} from 'lucide-react';

// Tipos
interface StatsData {
  totalClients: number;
  totalConsumos: number;
  totalRevenue: number;
  unpaidCount: number;
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  change: string;
}

interface DashboardContentProps {
  stats: StatsData;
}

// Actividad reciente mock data
const RECENT_ACTIVITIES = [
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
];

/**
 * Componente de tarjeta de estadísticas
 */
function StatsCard({ title, value, icon, gradient, change }: StatsCardProps) {
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

/**
 * Obtener color de actividad según tipo
 */
const getActivityColor = (type: string) => {
  switch (type) {
    case 'cliente':
      return 'bg-primary-500';
    case 'consumo':
      return 'bg-success-500';
    case 'pago':
      return 'bg-green-500';
    default:
      return 'bg-purple-500';
  }
};

/**
 * Componente principal del Dashboard
 */
const DashboardContent: React.FC<DashboardContentProps> = ({ stats }) => {
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
        {/* Actividad Reciente */}
        <div className="premium-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-3">
            {RECENT_ACTIVITIES.map(activity => (
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
            ))}
          </div>
        </div>

        {/* Acciones Rápidas */}
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
};

export default DashboardContent;
