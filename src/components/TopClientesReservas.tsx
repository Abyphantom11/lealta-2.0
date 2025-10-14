'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, Award } from 'lucide-react';

interface TopClienteReserva {
  id: string;
  nombre: string;
  cedula: string;
  totalReservas: number;
  totalInvitados: number;
  asistencias: number;
  ultimaReserva: string;
}

interface TopClientesReservasProps {
  businessId?: string;
}

export default function TopClientesReservas({ businessId }: TopClientesReservasProps) {
  const [topClientes, setTopClientes] = useState<TopClienteReserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'invitados' | 'asistencias' | 'reservas'>('invitados');

  useEffect(() => {
    fetchTopClientes();
  }, [businessId, sortBy]);

  const fetchTopClientes = async () => {
    try {
      setLoading(true);
      const url = businessId 
        ? `/api/superadmin/top-clientes-reservas?businessId=${businessId}&sortBy=${sortBy}`
        : `/api/superadmin/top-clientes-reservas?sortBy=${sortBy}`;
      
      console.log('🔍 TopClientesReservas - Fetching:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 TopClientesReservas - Response:', {
        success: data.success,
        clientesCount: data.clientes?.length || 0,
        firstCliente: data.clientes?.[0],
      });
      
      if (data.success) {
        setTopClientes(data.clientes);
      } else {
        console.error('❌ TopClientesReservas - Error en response:', data);
      }
    } catch (error) {
      console.error('❌ TopClientesReservas - Error cargando:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return 'text-yellow-400';
      case 1:
        return 'text-gray-400';
      case 2:
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMedalIcon = (index: number) => {
    if (index < 3) {
      return <Award className={`w-5 h-5 ${getMedalColor(index)}`} />;
    }
    return <span className="text-gray-500 font-bold">{index + 1}</span>;
  };

  const sortedClientes = [...topClientes].sort((a, b) => {
    switch (sortBy) {
      case 'invitados':
        return b.totalInvitados - a.totalInvitados;
      case 'asistencias':
        return b.asistencias - a.asistencias;
      case 'reservas':
        return b.totalReservas - a.totalReservas;
      default:
        return 0;
    }
  });

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
          Top Clientes Reservas
        </h3>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSortBy('invitados')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            sortBy === 'invitados'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          Invitados
        </button>
        <button
          onClick={() => setSortBy('asistencias')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            sortBy === 'asistencias'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          Asistencias
        </button>
        <button
          onClick={() => setSortBy('reservas')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            sortBy === 'reservas'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          Reservas
        </button>
      </div>

      {/* Lista de clientes */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : sortedClientes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay reservas registradas</p>
          </div>
        ) : (
          sortedClientes.slice(0, 8).map((cliente, index) => (
            <div
              key={cliente.id}
              className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-purple-500/30 transition-all group"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  {getMedalIcon(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate text-sm">
                    {cliente.nombre}
                  </p>
                  <p className="text-gray-500 text-xs">{cliente.cedula}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-right">
                {sortBy === 'invitados' && (
                  <div>
                    <p className="text-purple-400 font-bold text-lg">
                      {cliente.totalInvitados}
                    </p>
                    <p className="text-gray-500 text-xs">invitados</p>
                  </div>
                )}
                {sortBy === 'asistencias' && (
                  <div>
                    <p className="text-green-400 font-bold text-lg">
                      {cliente.asistencias}
                    </p>
                    <p className="text-gray-500 text-xs">asistencias</p>
                  </div>
                )}
                {sortBy === 'reservas' && (
                  <div>
                    <p className="text-blue-400 font-bold text-lg">
                      {cliente.totalReservas}
                    </p>
                    <p className="text-gray-500 text-xs">reservas</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resumen */}
      {!loading && sortedClientes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-800/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {sortedClientes.reduce((sum, c) => sum + c.totalInvitados, 0)}
              </p>
              <p className="text-gray-500 text-xs">Total Invitados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">
                {sortedClientes.reduce((sum, c) => sum + c.asistencias, 0)}
              </p>
              <p className="text-gray-500 text-xs">Asistencias</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {sortedClientes.reduce((sum, c) => sum + c.totalReservas, 0)}
              </p>
              <p className="text-gray-500 text-xs">Reservas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
