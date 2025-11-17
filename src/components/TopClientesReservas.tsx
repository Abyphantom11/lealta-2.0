'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, Award } from 'lucide-react';

interface TopClienteReserva {
  id: string;
  nombre: string;
  cedula: string;
  totalReservas: number;
  totalAsistentes: number;
  reservasConAsistencia: number;
  ultimaReserva: string;
}

interface TopClientesReservasProps {
  businessId?: string;
}

export default function TopClientesReservas({ businessId }: TopClientesReservasProps) {
  const [topClientes, setTopClientes] = useState<TopClienteReserva[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopClientes = useCallback(async () => {
    try {
      setLoading(true);
      // Siempre ordenar por total de asistentes
      const url = businessId 
        ? `/api/superadmin/top-clientes-reservas?businessId=${businessId}&sortBy=invitados`
        : `/api/superadmin/top-clientes-reservas?sortBy=invitados`;
      
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
  }, [businessId]);

  useEffect(() => {
    fetchTopClientes();
  }, [fetchTopClientes]);

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

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
          Top Clientes Reservas
        </h3>
      </div>

      {/* Lista de clientes */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : topClientes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay reservas registradas</p>
          </div>
        ) : (
          topClientes.slice(0, 8).map((cliente, index) => (
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
                <div>
                  <p className="text-purple-400 font-bold text-lg">
                    {cliente.totalAsistentes}
                  </p>
                  <p className="text-gray-500 text-xs">asistentes</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
