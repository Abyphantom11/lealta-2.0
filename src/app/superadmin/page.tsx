'use client';

import { useState, useEffect } from 'react';
import { motion } from '../../components/motion';
import { 
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  DollarSign,
  Target
} from 'lucide-react';

// Helper functions
const getActivityColor = (type: string) => {
  switch (type) {
    case 'success': return 'bg-success-400';
    case 'warning': return 'bg-warning-400';
    default: return 'bg-blue-400';
  }
};

const getChangeColor = (change: string) => {
  if (change.startsWith('+')) return 'text-success-400';
  if (change.startsWith('-')) return 'text-warning-400';
  return 'text-blue-400';
};

export default function SuperAdminPage() {
  const [analytics, setAnalytics] = useState({
    totalClients: 0,
    totalConsumos: 0,
    totalRevenue: 0,
    defaultRate: 0,
    topProducts: [] as Array<{ name: string; sales: number; revenue: number }>,
    monthlyGrowth: 0,
    riskClients: 0
  });

  useEffect(() => {
    // In a real app, fetch analytics from API
    setAnalytics({
      totalClients: 1247,
      totalConsumos: 3856,
      totalRevenue: 87654.32,
      defaultRate: 3.2,
      topProducts: [
        { name: 'Cerveza Premium', sales: 456, revenue: 12354.50 },
        { name: 'Cocktail Especial', sales: 234, revenue: 8976.25 },
        { name: 'Vino Tinto', sales: 189, revenue: 7534.80 },
      ],
      monthlyGrowth: 18.5,
      riskClients: 23
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                <span className="gradient-primary bg-clip-text text-transparent">Super</span> Admin
              </h1>
              <p className="text-dark-400">
                Analytics & Control Center
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-success-500/20 text-success-400 rounded-lg border border-success-500/30">
                <span className="text-sm font-medium">Sistema Operativo</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <MetricCard
            title="Total Clientes"
            value={analytics.totalClients.toLocaleString()}
            icon={<Users className="w-6 h-6" />}
            gradient="from-blue-600 to-cyan-600"
            change={`+${analytics.monthlyGrowth}%`}
            subtitle="vs mes anterior"
          />
          <MetricCard
            title="Ingresos Totales"
            value={`$${analytics.totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            gradient="from-green-600 to-emerald-600"
            change="+24.3%"
            subtitle="este mes"
          />
          <MetricCard
            title="Tasa de Impago"
            value={`${analytics.defaultRate}%`}
            icon={<AlertTriangle className="w-6 h-6" />}
            gradient="from-orange-600 to-red-600"
            change="-0.8%"
            subtitle="mejora continua"
          />
          <MetricCard
            title="Clientes de Riesgo"
            value={analytics.riskClients.toString()}
            icon={<Target className="w-6 h-6" />}
            gradient="from-purple-600 to-pink-600"
            change="-12%"
            subtitle="seguimiento activo"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 premium-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary-400" />
                Ingresos por Mes
              </h2>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm">
                  2024
                </button>
                <button className="px-3 py-1 bg-dark-700 text-dark-300 rounded-md text-sm">
                  2023
                </button>
              </div>
            </div>

            {/* Simple chart placeholder */}
            <div className="h-64 bg-dark-800/50 rounded-lg flex items-center justify-center border border-dark-700">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-dark-600 mx-auto mb-2" />
                <p className="text-dark-500">Gráfico de ingresos</p>
                <p className="text-dark-600 text-sm">Integración con Chart.js pendiente</p>
              </div>
            </div>
          </motion.div>

          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="premium-card"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-success-400" />
              Top Productos
            </h2>

            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={`${product.name}-${product.sales}`} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{product.name}</p>
                      <p className="text-dark-400 text-xs">{product.sales} ventas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-success-400 font-semibold text-sm">${product.revenue.toLocaleString()}</p>
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
          className="mt-8 premium-card"
        >
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Actividad Reciente del Sistema
          </h2>

          <div className="space-y-3">
            {[
              { time: '14:32', action: 'Nuevo cliente registrado', detail: 'Juan Pérez - Portal', type: 'success' },
              { time: '14:15', action: 'Consumo procesado', detail: '$45.50 - María García', type: 'info' },
              { time: '13:45', action: 'Cliente de riesgo detectado', detail: 'Carlos López - 3 impagos', type: 'warning' },
              { time: '13:30', action: 'Staff login', detail: 'Ana Staff - Terminal 2', type: 'info' },
              { time: '12:55', action: 'Backup completado', detail: 'Base de datos - Success', type: 'success' },
            ].map((activity, index) => (
              <div key={`${activity.action}-${activity.time}`} className="flex items-center space-x-4 p-3 bg-dark-800/30 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${getActivityColor(activity.type)}`}></div>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{activity.action}</p>
                  <p className="text-dark-400 text-xs">{activity.detail}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-dark-500 text-xs">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
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
    <div className="premium-card">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className={`text-sm font-medium ${getChangeColor(change)}`}>
          {change}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-dark-400 text-sm">{title}</p>
        <p className="text-dark-500 text-xs mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
