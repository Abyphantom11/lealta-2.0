// Tipos para estadísticas y dashboard
import { StatsData } from '../admin';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface RevenueChartData {
  daily: ChartData;
  weekly: ChartData;
  monthly: ChartData;
}

export interface ClientsChartData {
  newClients: ChartData;
  clientsByLevel: ChartData;
  visitsPerDay: ChartData;
}

export interface StatsFilters {
  dateRange: DateRange;
  nivel?: string;
  categoria?: string;
}

// Tipos para los hooks y contextos relacionados con estadísticas
export interface StatsContextType {
  stats: StatsData | null;
  revenueCharts: RevenueChartData | null;
  clientsCharts: ClientsChartData | null;
  loading: boolean;
  error: string | null;
  filters: StatsFilters;
  fetchStats: (filters?: Partial<StatsFilters>) => Promise<void>;
  fetchRevenueCharts: (filters?: Partial<StatsFilters>) => Promise<void>;
  fetchClientsCharts: (filters?: Partial<StatsFilters>) => Promise<void>;
  setFilters: (filters: Partial<StatsFilters>) => void;
}
