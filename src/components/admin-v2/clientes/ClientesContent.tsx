'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus,
  Search,
  Filter,
  X,
  MoreVertical
} from 'lucide-react';
import { Cliente } from '@/types/admin';

interface ClientesContentProps {
  className?: string;
}

/**
 * Componente principal de gestión de clientes
 */
const ClientesContent: React.FC<ClientesContentProps> = ({ className = '' }) => {
  // Estados principales
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Cargar clientes al montar el componente
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch('/api/cliente/lista');
        const data = await response.json();
        if (data.success) {
          setClientes(data.clientes);
          setFilteredClientes(data.clientes);
        }
      } catch (error) {
        console.error('Error cargando clientes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientes();
  }, []);

  // Función para filtrar clientes localmente
  const filterClientsLocally = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredClientes(clientes);
        return;
      }

      const searchLower = query.toLowerCase();
      const filtered = clientes.filter(
        client =>
          client.nombre.toLowerCase().includes(searchLower) ||
          client.cedula?.toLowerCase().includes(searchLower) ||
          client.telefono?.toLowerCase().includes(searchLower) ||
          client.correo?.toLowerCase().includes(searchLower)
      );

      setFilteredClientes(filtered);
    },
    [clientes]
  );

  // Función para buscar clientes en el servidor
  const searchClientesAPI = useCallback(async (query: string) => {
    if (!query || query.length < 2) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/clientes/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        // Si tenemos resultados de la API, actualizar la lista filtrada
        setFilteredClientes(data);
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
      // En caso de error, volver a la búsqueda local
      filterClientsLocally(query);
    } finally {
      setIsSearching(false);
    }
  }, [filterClientsLocally]);

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= 3) {
        // Para búsquedas más específicas, usar la API
        searchClientesAPI(searchTerm);
      } else {
        // Para búsquedas cortas o vacías, filtrar localmente
        filterClientsLocally(searchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filterClientsLocally, searchClientesAPI]);

  // Función para obtener iniciales del cliente
  const getClientInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          Gestión de Clientes
        </h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white">Nuevo Cliente</span>
        </button>
      </div>

      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Barra de búsqueda */}
            <div className="relative">
              <Search
                className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isSearching ? 'text-primary-500 animate-pulse' : 'text-dark-400'
                }`}
              />
              <input
                type="text"
                placeholder="Buscar clientes..."
                className="pl-10 pr-10 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Botón de filtros */}
            <button className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors">
              <Filter className="w-4 h-4 text-dark-400" />
            </button>
          </div>
          
          {/* Contador */}
          <div className="text-dark-400 text-sm">
            {(() => {
              if (isLoading) return 'Cargando...';
              return `${filteredClientes.length} cliente${
                filteredClientes.length !== 1 ? 's' : ''
              }`;
            })()}
          </div>
        </div>

        {/* Tabla de clientes */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 text-dark-300 font-medium">
                  Cliente
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Cédula
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Contacto
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Puntos
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Registro
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Tarjeta
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Estado
                </th>
                <th className="text-left py-3 text-dark-300 font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Loading state
                if (isLoading) {
                  return (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-dark-400"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                          <span>Cargando clientes...</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Empty state
                if (filteredClientes.length === 0) {
                  return (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-dark-400"
                      >
                        {clientes.length > 0
                          ? 'No se encontraron clientes con ese criterio de búsqueda'
                          : 'No hay clientes registrados aún'}
                      </td>
                    </tr>
                  );
                }

                // Clientes data
                return filteredClientes.map(client => (
                  <tr
                    key={client.id}
                    className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors"
                  >
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {getClientInitials(client.nombre)}
                          </span>
                        </div>
                        <span className="text-white">{client.nombre}</span>
                      </div>
                    </td>
                    <td className="py-4 text-dark-300">{client.cedula}</td>
                    <td className="py-4">
                      <div className="text-dark-300 text-sm">
                        <div>{client.telefono}</div>
                        <div className="text-dark-500">{client.correo}</div>
                      </div>
                    </td>
                    <td className="py-4 text-success-400 font-semibold">
                      {client.puntos} pts
                    </td>
                    <td className="py-4 text-dark-300">
                      {new Date(client.registeredAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-4">
                      {client.tarjetaLealtad ? (
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium ${
                              client.tarjetaLealtad.activa
                                ? 'text-success-400'
                                : 'text-red-400'
                            }`}
                          >
                            {client.tarjetaLealtad.nivel}
                          </span>
                          <span className="text-xs text-dark-400">
                            {client.tarjetaLealtad.asignacionManual
                              ? 'Manual'
                              : 'Auto'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-dark-400">
                          Sin tarjeta
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-success-500/20 text-success-400">
                        Activo
                      </span>
                    </td>
                    <td className="py-4">
                      <button className="p-1 hover:bg-dark-700 rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-dark-400" />
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientesContent;
