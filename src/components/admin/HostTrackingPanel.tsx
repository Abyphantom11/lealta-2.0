'use client';

import React, { useState } from 'react';
import { Users, TrendingUp, ShoppingBag, Calendar, ChevronDown, ChevronUp, Eye } from 'lucide-react';

interface HostTrackingPanelProps {
  clienteCedula: string;
  businessId: string;
}

interface HostStats {
  id: string;
  reservationNumber: string;
  reservationDate: string;
  tableNumber: string;
  guestCount: number;
  isActive: boolean;
  stats: {
    consumosVinculados: number;
    totalConsumo: number;
    totalPuntos: number;
    invitadosRegistrados: number;
    promedioConsumo: number;
    topProductos: Array<{ nombre: string; cantidad: number }>;
  };
  invitados: Array<{
    guestName: string | null;
    guestCedula: string | null;
    consumoTotal: number;
    consumoPuntos: number;
    consumoFecha: string;
  }>;
}

export default function HostTrackingPanel({ clienteCedula, businessId }: HostTrackingPanelProps) {
  const [hostData, setHostData] = useState<HostStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchHostTracking = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/host-tracking?businessId=${businessId}`
      );
      const data = await response.json();

      if (data.success) {
        // Filtrar eventos del cliente específico
        const clienteEvents = data.data.filter(
          (event: any) => event.anfitrion.cedula === clienteCedula
        );
        setHostData(clienteEvents);
      }
    } catch (error) {
      console.error('Error fetching host tracking:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, clienteCedula]);

  React.useEffect(() => {
    if (isExpanded) {
      fetchHostTracking();
    }
  }, [isExpanded, fetchHostTracking]);

  const toggleEventDetails = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const totalStats = hostData.reduce(
    (acc, event) => ({
      eventos: acc.eventos + 1,
      invitados: acc.invitados + event.stats.invitadosRegistrados,
      consumoTotal: acc.consumoTotal + event.stats.totalConsumo,
      puntosGenerados: acc.puntosGenerados + event.stats.totalPuntos,
    }),
    { eventos: 0, invitados: 0, consumoTotal: 0, puntosGenerados: 0 }
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
              🎯 Fidelización por Anfitrión
            </h3>
            <p className="text-gray-400 text-sm">
              Eventos con 4+ invitados • Consumos vinculados
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {hostData.length > 0 && (
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
              {hostData.length} evento{hostData.length !== 1 ? 's' : ''}
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
              <p className="text-gray-400 mt-2">Cargando datos...</p>
            </div>
          ) : hostData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                Este cliente no tiene eventos como anfitrión
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Los eventos se registran automáticamente cuando trae 4+ invitados
              </p>
            </div>
          ) : (
            <>
              {/* Estadísticas Totales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-500/10 rounded-lg p-4 text-center border border-purple-500/20">
                  <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Eventos</p>
                  <p className="text-white font-bold text-xl">{totalStats.eventos}</p>
                </div>
                <div className="bg-pink-500/10 rounded-lg p-4 text-center border border-pink-500/20">
                  <Users className="w-5 h-5 text-pink-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Invitados</p>
                  <p className="text-white font-bold text-xl">{totalStats.invitados}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/20">
                  <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Consumo Total</p>
                  <p className="text-green-400 font-bold text-xl">
                    ${totalStats.consumoTotal.toFixed(2)}
                  </p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 text-center border border-yellow-500/20">
                  <ShoppingBag className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Puntos</p>
                  <p className="text-yellow-400 font-bold text-xl">
                    {totalStats.puntosGenerados}
                  </p>
                </div>
              </div>

              {/* Lista de Eventos */}
              <div className="space-y-3">
                <h4 className="text-white font-semibold mb-3">
                  📅 Eventos como Anfitrión
                </h4>
                {hostData.map((event) => (
                  <div
                    key={event.id}
                    className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden"
                  >
                    {/* Header del Evento */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                            Mesa {event.tableNumber}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {new Date(event.reservationDate).toLocaleDateString('es-ES')}
                          </span>
                          {event.isActive && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                              ✓ Activo
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleEventDetails(event.id)}
                          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Stats del Evento */}
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <p className="text-gray-500 text-xs">Invitados</p>
                          <p className="text-white font-semibold">
                            {event.guestCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Consumos</p>
                          <p className="text-white font-semibold">
                            {event.stats.consumosVinculados}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Total</p>
                          <p className="text-green-400 font-semibold">
                            ${event.stats.totalConsumo.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Puntos</p>
                          <p className="text-yellow-400 font-semibold">
                            {event.stats.totalPuntos}
                          </p>
                        </div>
                      </div>

                      {/* Top Productos */}
                      {event.stats.topProductos.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <p className="text-gray-500 text-xs mb-2">
                            Productos más consumidos:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {event.stats.topProductos.map((producto, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-pink-500/10 text-pink-400 rounded text-xs"
                              >
                                {producto.nombre} ({producto.cantidad}×)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detalles Expandidos */}
                    {expandedEventId === event.id && (
                      <div className="border-t border-gray-700/50 bg-gray-900/30 p-4">
                        <h5 className="text-white font-semibold mb-3 text-sm">
                          👥 Consumos de Invitados ({event.invitados.length})
                        </h5>
                        {event.invitados.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-4">
                            No hay consumos vinculados a este evento
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {event.invitados.map((invitado, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between"
                              >
                                <div className="flex-1">
                                  <p className="text-white font-medium text-sm">
                                    {invitado.guestName || 'Invitado sin nombre'}
                                  </p>
                                  {invitado.guestCedula && (
                                    <p className="text-gray-500 text-xs">
                                      CC: {invitado.guestCedula}
                                    </p>
                                  )}
                                  <p className="text-gray-400 text-xs mt-1">
                                    {new Date(invitado.consumoFecha).toLocaleString('es-ES')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-green-400 font-semibold">
                                    ${invitado.consumoTotal.toFixed(2)}
                                  </p>
                                  <p className="text-yellow-400 text-xs">
                                    +{invitado.consumoPuntos} pts
                                  </p>
                                </div>
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
