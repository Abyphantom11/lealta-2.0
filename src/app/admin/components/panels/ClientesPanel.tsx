'use client';

import React from 'react';
import {
  ClientesContextType,
  ClienteSearchParams,
} from '../../../../types/admin/clients';
import { Cliente } from '../../../../types/admin';

interface ClientesPanelProps {
  clientesContext: ClientesContextType;
}

export const ClientesPanel: React.FC<Readonly<ClientesPanelProps>> = ({
  clientesContext,
}) => {
  const {
    clientes,
    loading,
    error,
    totalCount,
    fetchClientes,
    getClienteById,
    saveCliente,
  } = clientesContext;

  // Estado local para búsqueda y filtros
  const [searchParams, setSearchParams] = React.useState<ClienteSearchParams>({
    query: '',
    nivel: '',
    page: 1,
    limit: 10,
  });

  // Función para manejar la búsqueda
  const handleBuscar = React.useCallback(() => {
    fetchClientes({
      ...searchParams,
      page: 1, // Resetear a la primera página cuando se busca
    });
  }, [searchParams, fetchClientes]);

  // Función para cambiar el nivel de filtro
  const handleFiltroNivel = React.useCallback((nivel: string) => {
    setSearchParams(prev => ({ ...prev, nivel, page: 1 }));
  }, []);

  // Función para manejar paginación
  const handlePageChange = React.useCallback((newPage: number) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  }, []);

  // Aplicar cambios en los parámetros de búsqueda
  React.useEffect(() => {
    fetchClientes(searchParams);
  }, [searchParams.page, searchParams.limit, fetchClientes, searchParams]);

  // Función para determinar la clase CSS del nivel
  const getNivelClass = (nivel?: string): string => {
    switch (nivel) {
      case 'Bronce':
        return 'bg-amber-100 text-amber-800';
      case 'Plata':
        return 'bg-gray-100 text-gray-800';
      case 'Oro':
        return 'bg-yellow-100 text-yellow-800';
      case 'Diamante':
        return 'bg-blue-100 text-blue-800';
      case 'Platino':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Gestión de Clientes</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Búsqueda y Filtros */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-2/3 flex gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o correo..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchParams.query || ''}
            onChange={e =>
              setSearchParams(prev => ({ ...prev, query: e.target.value }))
            }
            onKeyDown={e => e.key === 'Enter' && handleBuscar()}
          />
          <button
            onClick={handleBuscar}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Buscar
          </button>
        </div>

        <div className="w-full md:w-1/3 flex justify-end gap-2">
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchParams.nivel || ''}
            onChange={e => handleFiltroNivel(e.target.value)}
          >
            <option value="">Todos los niveles</option>
            <option value="Bronce">Bronce</option>
            <option value="Plata">Plata</option>
            <option value="Oro">Oro</option>
            <option value="Diamante">Diamante</option>
            <option value="Platino">Platino</option>
          </select>

          <button
            onClick={() => saveCliente({ cedula: '', nombre: '' })}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cédula
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Puntos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nivel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Gastado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visitas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientes.map((cliente: Cliente) => (
              <tr key={cliente.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cliente.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cliente.cedula}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cliente.puntos}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getNivelClass(cliente.nivel)}`}
                  >
                    {cliente.nivel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${cliente.totalGastado.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cliente.totalVisitas}
                </td>
                <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                  <button
                    onClick={() => getClienteById(cliente.cedula)}
                    className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() =>
                      saveCliente({
                        cedula: cliente.cedula,
                        nombre: cliente.nombre,
                        correo: cliente.correo,
                        telefono: cliente.telefono,
                        puntos: cliente.puntos,
                        nivel: cliente.nivel,
                      })
                    }
                    className="bg-yellow-500 hover:bg-yellow-700 text-white p-2 rounded"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex justify-between items-center">
        <div>
          Mostrando {clientes.length} de {totalCount} clientes
        </div>
        <div className="flex gap-2">
          <button
            disabled={searchParams.page <= 1}
            onClick={() => handlePageChange(searchParams.page - 1)}
            className={`px-4 py-2 rounded ${searchParams.page <= 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'}`}
          >
            Anterior
          </button>
          <span className="px-4 py-2">Página {searchParams.page}</span>
          <button
            disabled={clientes.length < searchParams.limit}
            onClick={() => handlePageChange(searchParams.page + 1)}
            className={`px-4 py-2 rounded ${clientes.length < searchParams.limit ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'}`}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};
