import { useState, useCallback, useEffect } from 'react';
import { StatsData } from '../../../types/admin';
import {
  StatsFilters,
  RevenueChartData,
  ClientsChartData,
} from '../../../types/admin/stats';
import logger from '../../../lib/logger';

export function useStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [revenueCharts, setRevenueCharts] = useState<RevenueChartData | null>(
    null
  );
  const [clientsCharts, setClientsCharts] = useState<ClientsChartData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fecha actual y hace un mes como rango inicial
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  // Inicialización de los filtros
  const initialFilters: StatsFilters = {
    dateRange: { startDate, endDate },
  };

  // Estado para los filtros
  const [filters, setFiltersInternal] = useState<StatsFilters>(initialFilters);

  // Función para establecer los filtros
  const setFilters = useCallback((newFilters: Partial<StatsFilters>) => {
    setFiltersInternal(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Función para obtener las estadísticas generales
  const fetchStats = useCallback(
    async (customFilters?: Partial<StatsFilters>) => {
      setLoading(true);
      setError(null);
      try {
        // Aplicar filtros personalizados o usar los del estado
        const appliedFilters = customFilters
          ? { ...filters, ...customFilters }
          : filters;

        // Construir la URL con los parámetros
        const queryParams = new URLSearchParams();
        queryParams.append(
          'startDate',
          appliedFilters.dateRange.startDate.toISOString()
        );
        queryParams.append(
          'endDate',
          appliedFilters.dateRange.endDate.toISOString()
        );
        if (appliedFilters.nivel)
          queryParams.append('nivel', appliedFilters.nivel);
        if (appliedFilters.categoria)
          queryParams.append('categoria', appliedFilters.categoria);

        const response = await fetch(
          `/api/admin/estadisticas?${queryParams.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Error al cargar las estadísticas');
          logger.error('Error al cargar estadísticas:', errorData);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al cargar las estadísticas: ${message}`);
        logger.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Función para obtener los datos de gráficos de ingresos
  const fetchRevenueCharts = useCallback(
    async (customFilters?: Partial<StatsFilters>) => {
      setLoading(true);
      setError(null);
      try {
        // Aplicar filtros personalizados o usar los del estado
        const appliedFilters = customFilters
          ? { ...filters, ...customFilters }
          : filters;

        // Construir la URL con los parámetros
        const queryParams = new URLSearchParams();
        queryParams.append(
          'startDate',
          appliedFilters.dateRange.startDate.toISOString()
        );
        queryParams.append(
          'endDate',
          appliedFilters.dateRange.endDate.toISOString()
        );
        if (appliedFilters.categoria)
          queryParams.append('categoria', appliedFilters.categoria);

        const response = await fetch(
          `/api/admin/grafico-ingresos?${queryParams.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setRevenueCharts(data);
        } else {
          const errorData = await response.json();
          setError(
            errorData.message || 'Error al cargar los gráficos de ingresos'
          );
          logger.error('Error al cargar gráficos de ingresos:', errorData);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al cargar los gráficos de ingresos: ${message}`);
        logger.error('Error al cargar gráficos de ingresos:', error);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Función para obtener los datos de gráficos de clientes
  const fetchClientsCharts = useCallback(
    async (customFilters?: Partial<StatsFilters>) => {
      setLoading(true);
      setError(null);
      try {
        // Aplicar filtros personalizados o usar los del estado
        const appliedFilters = customFilters
          ? { ...filters, ...customFilters }
          : filters;

        // Construir la URL con los parámetros
        const queryParams = new URLSearchParams();
        queryParams.append(
          'startDate',
          appliedFilters.dateRange.startDate.toISOString()
        );
        queryParams.append(
          'endDate',
          appliedFilters.dateRange.endDate.toISOString()
        );
        if (appliedFilters.nivel)
          queryParams.append('nivel', appliedFilters.nivel);

        const response = await fetch(
          `/api/admin/grafico-clientes?${queryParams.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setClientsCharts(data);
        } else {
          const errorData = await response.json();
          setError(
            errorData.message || 'Error al cargar los gráficos de clientes'
          );
          logger.error('Error al cargar gráficos de clientes:', errorData);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al cargar los gráficos de clientes: ${message}`);
        logger.error('Error al cargar gráficos de clientes:', error);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Cargar las estadísticas inicialmente
  useEffect(() => {
    fetchStats();
    fetchRevenueCharts();
    fetchClientsCharts();
  }, [fetchStats, fetchRevenueCharts, fetchClientsCharts]);

  return {
    stats,
    revenueCharts,
    clientsCharts,
    loading,
    error,
    filters,
    fetchStats,
    fetchRevenueCharts,
    fetchClientsCharts,
    setFilters,
  };
}
