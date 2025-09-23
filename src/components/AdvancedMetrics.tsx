'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, Target, Crown, Activity } from 'lucide-react';
import { motion } from './motion';

interface MetricData {
  current: number;
  previous?: number;
  target?: number;
  format: 'currency' | 'number' | 'percentage';
}

interface MetricCardProps {
  title: string;
  icon: React.ElementType;
  data: MetricData;
  color: string;
  subtitle?: string;
  delay?: number;
}

interface AdvancedMetricsProps {
  data?: {
    totalRevenue?: MetricData;
    totalClients?: MetricData;
    avgTicket?: MetricData;
    totalTransactions?: MetricData;
    clientRetention?: MetricData;
    conversionRate?: MetricData;
    topClientValue?: MetricData;
    activeClients?: MetricData;
  };
}

const formatValue = (value: number, format: 'currency' | 'number' | 'percentage'): string => {
  switch (format) {
    case 'currency':
      return `$${value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
      return value.toLocaleString('es-ES');
    default:
      return value.toString();
  }
};

const calculateChange = (current: number, previous?: number): { percentage: number; isPositive: boolean } => {
  if (!previous || previous === 0) return { percentage: 0, isPositive: true };
  
  const change = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(change),
    isPositive: change >= 0
  };
};

const MetricCard = ({ title, icon: Icon, data, color, subtitle, delay = 0 }: MetricCardProps) => {
  const change = calculateChange(data.current, data.previous);
  const targetProgress = data.target ? Math.min((data.current / data.target) * 100, 100) : null;
  const actualProgress = data.target ? (data.current / data.target) * 100 : null;
  const isOverTarget = actualProgress && actualProgress > 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl hover:border-gray-700/50 transition-all group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${color} bg-opacity-20 border border-current border-opacity-30`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">{title}</h3>
            {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
          </div>
        </div>
        
        {/* Change Indicator */}
        {data.previous && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
            change.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {change.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-xs font-medium">{change.percentage.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-white mb-1">
          {formatValue(data.current, data.format)}
        </p>
        {data.previous && (
          <p className="text-gray-400 text-sm">
            vs {formatValue(data.previous, data.format)} anterior
          </p>
        )}
      </div>

      {/* Progress Bar (si hay target) */}
      {targetProgress !== null && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Progreso hacia meta</span>
            <span className={`${color} flex items-center gap-1`}>
              {actualProgress?.toFixed(1)}%
              {isOverTarget && <span className="text-green-400">🎯</span>}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${targetProgress}%` }}
              transition={{ delay: delay + 0.3, duration: 1 }}
              className={`h-1.5 rounded-full ${
                isOverTarget
                  ? 'bg-green-500'
                  : color.replace('text-', 'bg-')
              } opacity-80 ${isOverTarget ? 'animate-pulse' : ''}`}
            />
          </div>
          {data.target && (
            <p className="text-gray-500 text-xs flex justify-between">
              <span>Meta: {formatValue(data.target, data.format)}</span>
              {isOverTarget && (
                <span className="text-green-400 text-xs">¡Meta superada!</span>
              )}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default function AdvancedMetrics({ data }: Readonly<AdvancedMetricsProps>) {
  // ✅ Logs removidos para reducir spam en consola

  // Si no hay datos de la API, usar datos simulados basados en los logs del terminal
  const simulatedData = data ?? {
    totalRevenue: { 
      current: 138.77, 
      previous: 120.50, 
      target: 200, 
      format: 'currency' as const 
    },
    totalClients: { 
      current: 3, 
      previous: 2, 
      target: 5, 
      format: 'number' as const 
    },
    avgTicket: { 
      current: 27.75, 
      previous: 25.00, 
      target: 35, 
      format: 'currency' as const 
    },
    totalTransactions: { 
      current: 5, 
      previous: 4, 
      target: 8, 
      format: 'number' as const 
    },
    clientRetention: { 
      current: 66.7, 
      previous: 60.0, 
      target: 80, 
      format: 'percentage' as const 
    },
    conversionRate: { 
      current: 75.0, 
      previous: 65.0, 
      target: 85, 
      format: 'percentage' as const 
    },
    topClientValue: { 
      current: 46.52, 
      previous: 35.20, 
      target: 60, 
      format: 'currency' as const 
    },
    activeClients: { 
      current: 3, 
      previous: 2, 
      target: 5, 
      format: 'number' as const 
    }
  };
  
  // Usar datos reales si están disponibles, sino usar simulados
  const actualData = data || simulatedData;

  // ✅ OPTIMIZACIÓN: Memoizar el cálculo de métricas para evitar recálculos innecesarios
  const metrics = useMemo(() => {
    // Valores por defecto si data es undefined - con targets para mostrar barras de progreso
    const defaultMetricValue: MetricData = {
      current: 0,
      previous: 0,
      target: 100, // Target por defecto para mostrar progreso
      format: 'number'
    };

    return [
    {
      title: 'Ingresos Totales',
      subtitle: 'Período seleccionado',
      icon: DollarSign,
      data: actualData?.totalRevenue || defaultMetricValue,
      color: 'text-green-400',
      delay: 0
    },
    {
      title: 'Total Clientes',
      subtitle: 'Base de datos',
      icon: Users,
      data: actualData?.totalClients || defaultMetricValue,
      color: 'text-blue-400',
      delay: 0.1
    },
    {
      title: 'Ticket Promedio',
      subtitle: 'Por transacción',
      icon: Target,
      data: actualData?.avgTicket || defaultMetricValue,
      color: 'text-purple-400',
      delay: 0.2
    },
    {
      title: 'Transacciones',
      subtitle: 'Período actual',
      icon: ShoppingCart,
      data: actualData?.totalTransactions || defaultMetricValue,
      color: 'text-cyan-400',
      delay: 0.3
    },
    {
      title: 'Retención Clientes',
      subtitle: 'Clientes recurrentes',
      icon: Activity,
      data: actualData?.clientRetention || defaultMetricValue,
      color: 'text-orange-400',
      delay: 0.4
    },
    {
      title: 'Tasa Conversión',
      subtitle: 'Visitas vs compras',
      icon: TrendingUp,
      data: actualData?.conversionRate || defaultMetricValue,
      color: 'text-yellow-400',
      delay: 0.5
    },
    {
      title: 'Cliente Top',
      subtitle: 'Mayor gastador',
      icon: Crown,
      data: actualData?.topClientValue || defaultMetricValue,
      color: 'text-pink-400',
      delay: 0.6
    },
    {
      title: 'Clientes Activos',
      subtitle: 'Últimos 30 días',
      icon: Users,
      data: actualData?.activeClients || defaultMetricValue,
      color: 'text-indigo-400',
      delay: 0.7
    }
    ]; // ✅ Fin del array de retorno
  }, [actualData]); // ✅ Dependencias del useMemo

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          subtitle={metric.subtitle}
          icon={metric.icon}
          data={metric.data}
          color={metric.color}
          delay={metric.delay}
        />
      ))}
    </div>
  );
}
