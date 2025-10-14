'use client';

import React, { useState } from 'react';
import { Users, TrendingUp, Calendar, ChevronDown, ChevronUp, User, DollarSign } from 'lucide-react';

interface ReservaConInvitadosPanelProps {
  clienteCedula: string;
  businessId: string;
}

interface InvitadoConsumo {
  guestName: string | null;
  guestCedula: string | null;
  consumoId: string;
  consumoTotal: number;
  consumoPuntos: number;
  consumoFecha: string;
  productos: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
}

interface ReservaCompleta {
  id: string;
  reservationNumber: string;
  reservationDate: string;
  tableNumber: string | null;
  guestCount: number;
  anfitrion: {
    nombre: string;
    cedula: string;
  };
  invitados: InvitadoConsumo[];
  stats: {
    totalConsumo: number;
    totalPuntos: number;
    totalInvitados: number;
    consumosRegistrados: number;
    topProductos: Array<{
      nombre: string;
      cantidad: number;
      totalVendido: number;
    }>;
  };
}

export default function ReservaConInvitadosPanel({ clienteCedula, businessId }: ReservaConInvitadosPanelProps) {
  const [reservas, setReservas] = useState<ReservaCompleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedReservaId, setExpandedReservaId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchReservasConInvitados = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/reservas-con-invitados?businessId=${businessId}&anfitrionCedula=${clienteCedula}`
      );
      const data = await response.json();

      if (data.success) {
        setReservas(data.data);
      }
    } catch (error) {
      console.error('Error fetching reservas con invitados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, clienteCedula]);

  React.useEffect(() => {
    if (isExpanded) {
      fetchReservasConInvitados();
    }
  }, [isExpanded, fetchReservasConInvitados]);

  const toggleReservaDetails = (reservaId: string) => {
    setExpandedReservaId(expandedReservaId === reservaId ? null : reservaId);
  };

  const totalStats = reservas.reduce(
    (acc, reserva) => ({
      reservas: acc.reservas + 1,
      invitados: acc.invitados + reserva.stats.totalInvitados,
      consumoTotal: acc.consumoTotal + reserva.stats.totalConsumo,
      puntosGenerados: acc.puntosGenerados + reserva.stats.totalPuntos,
    }),
    { reservas: 0, invitados: 0, consumoTotal: 0, puntosGenerados: 0 }
  );

  return (
    <div className="mt-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/30 overflow-hidden">
      {/* Header Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-500/10 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold text-lg">
              🎯 Reservas como Anfitrión
            </h3>
            <p className="text-gray-400 text-sm">
              Reservas con invitados • Consumos vinculados
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {reservas.length > 0 && (
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
              {reservas.length} reserva{reservas.length !== 1 ? 's' : ''}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Contenido Expandido */}
      {isExpanded && (
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Cargando reservas...</p>
            </div>
          ) : reservas.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                Este cliente no tiene reservas con invitados vinculados
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Las reservas se vinculan cuando el staff registra consumos de invitados
              </p>
            </div>
          ) : (
            <>
              {/* Estadísticas Totales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-500/10 rounded-lg p-4 text-center border border-purple-500/20">
                  <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Reservas</p>
                  <p className="text-white font-bold text-xl">{totalStats.reservas}</p>
                </div>
                <div className="bg-pink-500/10 rounded-lg p-4 text-center border border-pink-500/20">
                  <Users className="w-5 h-5 text-pink-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Invitados</p>
                  <p className="text-white font-bold text-xl">{totalStats.invitados}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/20">
                  <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Consumo Total</p>
                  <p className="text-white font-bold text-xl">${totalStats.consumoTotal.toFixed(2)}</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 text-center border border-yellow-500/20">
                  <TrendingUp className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Puntos</p>
                  <p className="text-white font-bold text-xl">{totalStats.puntosGenerados}</p>
                </div>
              </div>

              {/* Lista de Reservas */}
              <div className="space-y-4">
                {reservas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="bg-gray-800/50 rounded-lg border border-purple-500/20 overflow-hidden"
                  >
                    {/* Header de la Reserva */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {reserva.tableNumber && (
                              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                {reserva.tableNumber}
                              </span>
                            )}
                            <span className="text-white font-bold">
                              {reserva.anfitrion.nombre}
                            </span>
                            <span className="text-gray-400 text-sm">
                              (Anfitrión)
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>📅 {new Date(reserva.reservationDate).toLocaleDateString('es-ES')}</span>
                            <span>👥 {reserva.guestCount} invitados en reserva</span>
                            <span>🎫 #{reserva.reservationNumber}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleReservaDetails(reserva.id)}
                          className="ml-4 p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
                        >
                          {expandedReservaId === reserva.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Stats de la Reserva */}
                      <div className="grid grid-cols-3 gap-3 p-3 bg-gray-900/50 rounded-lg">
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Consumos Registrados</p>
                          <p className="text-white font-bold">{reserva.stats.consumosRegistrados}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Total Consumido</p>
                          <p className="text-green-400 font-bold">${reserva.stats.totalConsumo.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Puntos Generados</p>
                          <p className="text-yellow-400 font-bold">+{reserva.stats.totalPuntos}</p>
                        </div>
                      </div>

                      {/* Top 3 Productos */}
                      {reserva.stats.topProductos.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-blue-400 text-xs font-semibold mb-2">🏆 Top 3 Productos Consumidos</p>
                          <div className="flex flex-wrap gap-2">
                            {reserva.stats.topProductos.slice(0, 3).map((producto, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                              >
                                {idx + 1}. {producto.nombre} ({producto.cantidad}x) - ${producto.totalVendido.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detalles de Invitados (Expandible) */}
                    {expandedReservaId === reserva.id && (
                      <div className="border-t border-purple-500/20 p-4 bg-gray-900/30">
                        <h5 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Consumos de Invitados ({reserva.invitados.length})
                        </h5>
                        {reserva.invitados.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-4">
                            No hay consumos vinculados a esta reserva
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {reserva.invitados.map((invitado, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-gray-400" />
                                      <p className="text-white font-medium">
                                        {invitado.guestName || 'Invitado sin nombre'}
                                      </p>
                                    </div>
                                    {invitado.guestCedula && (
                                      <p className="text-gray-500 text-xs ml-6">
                                        CC: {invitado.guestCedula}
                                      </p>
                                    )}
                                    <p className="text-gray-400 text-xs ml-6 mt-1">
                                      🕐 {new Date(invitado.consumoFecha).toLocaleString('es-ES')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-green-400 font-bold">
                                      ${invitado.consumoTotal.toFixed(2)}
                                    </p>
                                    <p className="text-yellow-400 text-xs">
                                      +{invitado.consumoPuntos} pts
                                    </p>
                                  </div>
                                </div>

                                {/* Productos del Invitado */}
                                {invitado.productos && invitado.productos.length > 0 && (
                                  <div className="mt-2 pl-6 border-l-2 border-purple-500/30">
                                    <p className="text-gray-400 text-xs mb-1">Productos:</p>
                                    <div className="space-y-1">
                                      {invitado.productos.map((producto, pIdx) => (
                                        <div key={pIdx} className="flex items-center justify-between text-xs">
                                          <span className="text-gray-300">
                                            {producto.cantidad}x {producto.nombre}
                                          </span>
                                          <span className="text-gray-400">
                                            ${producto.precio.toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
