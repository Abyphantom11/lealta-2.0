import { DashboardStats as StatsType } from "../types/reservation";

interface DashboardStatsProps {
  readonly stats: StatsType;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Reservas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-sm font-medium text-gray-600 mb-1">Total Reservas</div>
        <div className="text-3xl font-bold text-gray-900">{stats.totalReservas}</div>
      </div>

      {/* Total Asistentes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-sm font-medium text-gray-600 mb-1">Total Asistentes</div>
        <div className="text-3xl font-bold text-gray-900">{stats.totalAsistentes}</div>
      </div>

      {/* % Asistencia */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-sm font-medium text-gray-600 mb-1">% Asistencia</div>
        <div className="text-3xl font-bold text-gray-900">{stats.promedioAsistencia}%</div>
      </div>

      {/* Reservas Hoy */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-sm font-medium text-gray-600 mb-1">Reservas Hoy</div>
        <div className="text-3xl font-bold text-gray-900">{stats.reservasHoy}</div>
      </div>
    </div>
  );
}
