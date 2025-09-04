'use client';

import { Crown, TrendingUp, Calendar, DollarSign, ShoppingBag, Star } from 'lucide-react';
import { motion } from './motion';

interface ClientData {
  id: string;
  nombre: string;
  cedula: string;
  totalGastado: number;
  totalVisitas: number;
  ultimaVisita: string;
  promedioPorVisita: number;
  nivel: 'Gold' | 'Silver' | 'Bronze';
  puntos: number;
  tendencia: 'up' | 'down' | 'stable';
  crecimiento: number; // porcentaje
}

interface TopClientsProps {
  clients: ClientData[];
  isLoading?: boolean;
  periodo?: string;
}

const getNivelColor = (nivel: string) => {
  switch (nivel) {
    case 'Gold':
      return 'from-yellow-400 to-orange-500';
    case 'Silver':
      return 'from-gray-300 to-gray-500';
    case 'Bronze':
      return 'from-amber-600 to-amber-800';
    default:
      return 'from-gray-500 to-gray-700';
  }
};

const getNivelIcon = (nivel: string) => {
  switch (nivel) {
    case 'Gold':
      return '👑';
    case 'Silver':
      return '🥈';
    case 'Bronze':
      return '🥉';
    default:
      return '⭐';
  }
};

const formatCurrency = (amount: number | undefined | null) => {
  const value = amount || 0;
  return `$${value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return date.toLocaleDateString('es-ES');
};

const getNivelBadgeClasses = (nivel: string) => {
  if (nivel === 'Gold') return 'bg-yellow-500/20 text-yellow-400';
  if (nivel === 'Silver') return 'bg-gray-500/20 text-gray-400';
  return 'bg-amber-600/20 text-amber-400';
};

const getTendenciaClasses = (tendencia: string) => {
  if (tendencia === 'up') return 'bg-green-500/20 text-green-400';
  if (tendencia === 'down') return 'bg-red-500/20 text-red-400';
  return 'bg-gray-500/20 text-gray-400';
};

export default function TopClients({ clients, isLoading = false, periodo = 'mes' }: Readonly<TopClientsProps>) {
  if (isLoading) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Crown className="w-5 h-5 mr-2 text-yellow-400" />
          Top Clientes
        </h2>
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={`skeleton-${i + 1}`} className="animate-pulse">
              <div className="flex items-center space-x-4 p-4 bg-black/20 rounded-xl">
                <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 bg-gray-700 rounded"></div>
                  <div className="w-1/2 h-3 bg-gray-800 rounded"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="w-20 h-4 bg-gray-700 rounded"></div>
                  <div className="w-16 h-3 bg-gray-800 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Crown className="w-5 h-5 mr-2 text-yellow-400" />
          Top Clientes
        </h2>
        <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium capitalize">{periodo}</span>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-4">
        {clients.map((client, index) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (parseInt(client.id.slice(-1)) || index) }}
            className="group"
          >
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-gray-800/30 hover:border-gray-700/50 hover:bg-black/30 transition-all">
              
              {/* Ranking + Avatar */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {/* Posición */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getNivelColor(client.nivel)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {index + 1}
                  </div>
                  {/* Badge de Nivel */}
                  <div className="absolute -top-1 -right-1 text-sm">
                    {getNivelIcon(client.nivel)}
                  </div>
                </div>

                {/* Info del Cliente */}
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-white font-medium text-sm">{client.nombre}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getNivelBadgeClasses(client.nivel)}`}>
                      {client.nivel}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center space-x-1">
                      <ShoppingBag className="w-3 h-3" />
                      <span>{client.totalVisitas || 0} visitas</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(client.ultimaVisita)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>{(client.puntos || 0).toLocaleString()} pts</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Métricas */}
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-green-400 font-semibold text-lg">
                    {formatCurrency(client.totalGastado || 0)}
                  </p>
                  {/* Tendencia */}
                  <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg ${getTendenciaClasses(client.tendencia || 'up')}`}>
                    <TrendingUp className={`w-3 h-3 ${
                      (client.tendencia || 'up') === 'down' ? 'rotate-180' : ''
                    }`} />
                    <span className="text-xs font-medium">
                      {(client.crecimiento || 0) > 0 ? '+' : ''}{(client.crecimiento || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3" />
                    <span>{formatCurrency(client.promedioPorVisita || 0)} avg</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer con estadística */}
      {clients.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-300">
              💎 Top {clients.length} clientes representan
            </span>
            <span className="text-blue-400 font-bold">
              {formatCurrency(clients.reduce((sum, c) => sum + c.totalGastado, 0))} del total
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
