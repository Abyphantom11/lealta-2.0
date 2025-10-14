'use client';

import { motion } from 'framer-motion';
import { FileText, Award, TrendingUp, Clock, DollarSign } from 'lucide-react';
import type { TodayStats } from '../types/staff.types';

interface StatsDisplayProps {
  stats: TodayStats;
  isLoading?: boolean;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  format = 'number',
  subtitle 
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  format?: 'number' | 'currency';
  subtitle?: string;
}) => {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return `$${val.toFixed(2)}`;
    }
    return val.toLocaleString();
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-400',
      border: 'border-blue-500/20',
      glow: 'shadow-blue-500/10'
    },
    yellow: {
      bg: 'bg-yellow-500/10', 
      icon: 'text-yellow-400',
      border: 'border-yellow-500/20',
      glow: 'shadow-yellow-500/10'
    },
    purple: {
      bg: 'bg-purple-500/10',
      icon: 'text-purple-400', 
      border: 'border-purple-500/20',
      glow: 'shadow-purple-500/10'
    },
    green: {
      bg: 'bg-green-500/10',
      icon: 'text-green-400',
      border: 'border-green-500/20', 
      glow: 'shadow-green-500/10'
    }
  }[color] || {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-dark-800/50 backdrop-blur-sm border ${colorClasses.border} rounded-xl p-6 ${colorClasses.glow} shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-dark-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="text-dark-500 text-xs">{subtitle}</p>
          )}
        </div>
        <div className={`${colorClasses.bg} p-4 rounded-xl`}>
          <Icon className={`w-8 h-8 ${colorClasses.icon}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default function StatsDisplay({ stats, isLoading = false }: StatsDisplayProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`loading-card-${i + 1}`} className="bg-dark-800/50 border border-dark-700 rounded-xl p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-dark-600 rounded mb-2"></div>
                <div className="h-8 bg-dark-600 rounded mb-1"></div>
                <div className="h-3 bg-dark-600 rounded w-2/3"></div>
              </div>
              <div className="w-16 h-16 bg-dark-600 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const getGreeting = (hour: number) => {
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };
  const greeting = getGreeting(currentHour);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          {greeting} 👋
        </h2>
        <p className="text-dark-400">
          Resumen del día • {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tickets Procesados"
          value={stats.ticketsProcessed}
          icon={FileText}
          color="blue"
          subtitle="Tickets hoy"
        />
        
        <StatCard
          title="Puntos Otorgados"
          value={stats.totalPoints}
          icon={Award}
          color="yellow"
          subtitle="Total de puntos"
        />
        
        <StatCard
          title="Ventas del Día"
          value={stats.totalAmount}
          icon={TrendingUp}
          color="purple"
          format="currency"
          subtitle="Ingresos generados"
        />
        
        <StatCard
          title="Promedio por Ticket"
          value={stats.ticketsProcessed > 0 ? stats.totalAmount / stats.ticketsProcessed : 0}
          icon={DollarSign}
          color="green"
          format="currency"
          subtitle="Ticket promedio"
        />
      </div>

      {/* Quick Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-dark-800/30 backdrop-blur-sm border border-dark-700 rounded-xl p-4"
      >
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-medium">Insights Rápidos</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-dark-700/50 rounded-lg">
            <p className="text-dark-400">Puntos por peso</p>
            <p className="text-white font-medium">
              {stats.totalAmount > 0 ? (stats.totalPoints / stats.totalAmount).toFixed(1) : '0.0'} pts/$
            </p>
          </div>
          
          <div className="text-center p-3 bg-dark-700/50 rounded-lg">
            <p className="text-dark-400">Eficiencia</p>
            <p className="text-green-400 font-medium">
              {stats.ticketsProcessed > 0 ? '100%' : '0%'}
            </p>
          </div>
          
          <div className="text-center p-3 bg-dark-700/50 rounded-lg">
            <p className="text-dark-400">Estado</p>
            <p className={`font-medium ${stats.ticketsProcessed > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
              {stats.ticketsProcessed > 0 ? 'Activo' : 'Esperando'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
