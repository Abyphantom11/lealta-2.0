'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Award,
  ChevronDown,
  ChevronUp,
  Search,
  Filter
} from 'lucide-react';

interface GuestConsumo {
  guestName: string;
  guestCedula: string;
  consumoId: string;
  consumoTotal: number;
  consumoPuntos: number;
  consumoFecha: string;
  productos: {
    nombre: string;
    cantidad: number;
    precio: number;
  }[];
}

interface ReservaConInvitados {
  id: string;
  reservationNumber: number;
  reservationDate: string;
  tableNumber: number;
  guestCount: number;
  anfitrion: {
    cedula: string;
    nombre: string;
  };
  invitados: GuestConsumo[];
  stats: {
    totalConsumo: number;
    totalPuntos: number;
    totalInvitados: number;
    consumosRegistrados: number;
    topProductos: {
      nombre: string;
      cantidad: number;
      totalVendido: number;
    }[];
  };
}

interface AnfitrionesAnalysisPanelProps {
  businessId?: string;
}

export default function AnfitrionesAnalysisPanel({ businessId }: AnfitrionesAnalysisPanelProps) {
  const [reservas, setReservas] = useState<ReservaConInvitados[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedReserva, setExpandedReserva] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'fecha' | 'invitados' | 'consumo'>('fecha');

  const fetchReservas = useCallback(async () => {
    if (!businessId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/reservas-con-invitados?businessId=${businessId}`
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar reservas');
      }

      const result = await response.json();
      setReservas(result.data || []);
    } catch (error) {
      console.error('Error fetching reservas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  // Filtrar y ordenar reservas
  const reservasFiltradas = reservas
    .filter(r => 
      r.anfitrion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.anfitrion.cedula.includes(searchTerm) ||
      r.tableNumber.toString().includes(searchTerm)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'invitados':
          return b.stats.totalInvitados - a.stats.totalInvitados;
        case 'consumo':
          return b.stats.totalConsumo - a.stats.totalConsumo;
        case 'fecha':
        default:
          return new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime();
      }
    });

  // Calcular estadísticas globales
  const stats = {
    totalReservas: reservas.length,
    totalInvitados: reservas.reduce((sum, r) => sum + r.stats.totalInvitados, 0),
    consumoTotal: reservas.reduce((sum, r) => sum + r.stats.totalConsumo, 0),
    promedioInvitados: reservas.length > 0 
      ? (reservas.reduce((sum, r) => sum + r.stats.totalInvitados, 0) / reservas.length).toFixed(1)
      : 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm">Total Reservas</p>
              <p className="text-3xl font-bold text-white">{stats.totalReservas}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm">Total Invitados</p>
              <p className="text-3xl font-bold text-white">{stats.totalInvitados}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-xl border border-green-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm">Consumo Total</p>
              <p className="text-3xl font-bold text-white">${stats.consumoTotal.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-300 text-sm">Promedio Invitados</p>
              <p className="text-3xl font-bold text-white">{stats.promedioInvitados}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o mesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="fecha">Más recientes</option>
            <option value="invitados">Más invitados</option>
            <option value="consumo">Mayor consumo</option>
          </select>
        </div>
      </div>

      {/* Lista de Reservas */}
      <div className="space-y-4">
        <AnimatePresence>
          {reservasFiltradas.map((reserva, index) => (
            <motion.div
              key={reserva.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
            >
              {/* Cabecera de la Reserva */}
              <div
                onClick={() => setExpandedReserva(expandedReserva === reserva.id ? null : reserva.id)}
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {reserva.anfitrion.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{reserva.anfitrion.nombre}</h3>
                        <p className="text-sm text-gray-400">Mesa {reserva.tableNumber} • {new Date(reserva.reservationDate).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Invitados</p>
                      <p className="text-xl font-bold text-blue-400">{reserva.stats.totalInvitados}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Consumo Total</p>
                      <p className="text-xl font-bold text-green-400">${reserva.stats.totalConsumo.toLocaleString()}</p>
                    </div>
                    {expandedReserva === reserva.id ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Detalles Expandidos */}
              <AnimatePresence>
                {expandedReserva === reserva.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-6 space-y-6">
                      {/* Top 3 Productos Más Consumidos */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Award className="w-5 h-5 text-yellow-400" />
                          <h4 className="text-lg font-bold text-white">Top 3 Productos Más Consumidos</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {reserva.stats.topProductos.slice(0, 3).map((producto, idx) => (
                            <div
                              key={producto.nombre}
                              className={`p-4 rounded-lg ${
                                idx === 0 
                                  ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30'
                                  : idx === 1
                                  ? 'bg-gradient-to-br from-gray-400/20 to-gray-500/10 border border-gray-400/30'
                                  : 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl font-bold">#{idx + 1}</span>
                                <span className="text-sm font-bold text-white">{producto.cantidad}x</span>
                              </div>
                              <p className="font-semibold text-white mb-1">{producto.nombre}</p>
                              <p className="text-sm text-gray-300">${producto.totalVendido.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tarjetas de Invitados */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Detalle por Invitado</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {reserva.invitados.map((invitado) => (
                            <div
                              key={invitado.consumoId}
                              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h5 className="font-semibold text-white">{invitado.guestName}</h5>
                                  <p className="text-sm text-gray-400">{invitado.guestCedula}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-400">
                                    ${invitado.consumoTotal.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                {invitado.productos.map((producto, idx) => (
                                  <div key={`${invitado.consumoId}-${idx}`} className="flex justify-between text-sm">
                                    <span className="text-gray-300">{producto.nombre} x{producto.cantidad}</span>
                                    <span className="text-gray-400">${(producto.precio * producto.cantidad).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total General de la Reserva */}
                      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-300 mb-1">Total de la Reserva</p>
                            <p className="text-sm text-gray-400">{reserva.stats.totalInvitados} invitados registrados</p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-white">${reserva.stats.totalConsumo.toLocaleString()}</p>
                            <p className="text-sm text-gray-400">Consumo total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {reservasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'No se encontraron reservas con ese criterio' : 'No hay reservas con invitados registradas'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
