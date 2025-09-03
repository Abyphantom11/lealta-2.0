'use client';

import React from 'react';
import { StatsContextType, DateRange } from '../../../../types/admin/stats';

interface StatsFilters {
  dateRange: DateRange;
  nivel?: string;
  categoria?: string;
}

interface StatsFilterProps {
  dateRange: DateRange;
  nivel?: string;
  categoria?: string;
  onFilterChange: (filters: StatsFilters) => void;
}

const StatsFilter: React.FC<Readonly<StatsFilterProps>> = ({
  dateRange,
  nivel,
  // categoria no se utiliza actualmente
  onFilterChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4">Filtros</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fecha Inicio
          </label>
          <input
            id="startDate"
            type="date"
            className="w-full p-2 border rounded-md"
            value={dateRange.startDate.toISOString().split('T')[0]}
            onChange={e => {
              const newStartDate = new Date(e.target.value);
              onFilterChange({
                dateRange: {
                  ...dateRange,
                  startDate: newStartDate,
                },
                nivel,
                categoria: undefined,
              });
            }}
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fecha Fin
          </label>
          <input
            id="endDate"
            type="date"
            className="w-full p-2 border rounded-md"
            value={dateRange.endDate.toISOString().split('T')[0]}
            onChange={e => {
              const newEndDate = new Date(e.target.value);
              onFilterChange({
                dateRange: {
                  ...dateRange,
                  endDate: newEndDate,
                },
                nivel,
                categoria: undefined,
              });
            }}
          />
        </div>
        <div>
          <label
            htmlFor="nivel"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nivel
          </label>
          <select
            id="nivel"
            className="w-full p-2 border rounded-md"
            value={nivel || ''}
            onChange={e =>
              onFilterChange({ 
                dateRange, 
                nivel: e.target.value || undefined,
                categoria: undefined
              })
            }
          >
            <option value="">Todos</option>
            <option value="Bronce">Bronce</option>
            <option value="Plata">Plata</option>
            <option value="Oro">Oro</option>
            <option value="Diamante">Diamante</option>
            <option value="Platino">Platino</option>
          </select>
        </div>
      </div>
    </div>
  );
};

interface StatsPanelProps {
  statsContext: StatsContextType;
}

export const StatsPanel: React.FC<Readonly<StatsPanelProps>> = ({
  statsContext,
}) => {
  const {
    stats,
    loading,
    error,
    filters,
    setFilters,
    fetchStats,
    fetchRevenueCharts,
    fetchClientsCharts,
  } = statsContext;

  // Función para aplicar filtros
  const handleFilterChange = (newFilters: StatsFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Estadísticas</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <StatsFilter
        dateRange={filters.dateRange}
        nivel={filters.nivel}
        categoria={filters.categoria}
        onFilterChange={handleFilterChange}
      />

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-blue-700">
            Total Clientes
          </h3>
          <p className="text-3xl font-bold">{stats?.totalClients || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-green-700">
            Ingresos Totales
          </h3>
          <p className="text-3xl font-bold">
            ${stats?.totalRevenue?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-yellow-700">Consumos</h3>
          <p className="text-3xl font-bold">{stats?.totalConsumos || 0}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-red-700">
            Pendientes de Pago
          </h3>
          <p className="text-3xl font-bold">{stats?.unpaidCount || 0}</p>
        </div>
      </div>

      {/* Lugar para gráficos */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Gráficos</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h4 className="text-lg font-medium mb-2">Ingresos por Día</h4>
            <div className="h-64 flex items-center justify-center">
              {loading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              ) : (
                <p className="text-gray-500">Gráfico de ingresos aquí</p>
              )}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h4 className="text-lg font-medium mb-2">Clientes por Nivel</h4>
            <div className="h-64 flex items-center justify-center">
              {loading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              ) : (
                <p className="text-gray-500">Gráfico de clientes aquí</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
          onClick={() => {
            fetchStats();
            fetchRevenueCharts();
            fetchClientsCharts();
          }}
        >
          Actualizar
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            // Lógica para exportar
          }}
        >
          Exportar
        </button>
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
