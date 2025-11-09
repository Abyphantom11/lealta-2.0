import React from 'react';
import { DashboardStats as StatsType } from "../types/reservation";

interface DashboardStatsProps {
  readonly stats: StatsType;
}

// ⚡ OPTIMIZACIÓN: React.memo evita recalcular estadísticas si no cambiaron
const DashboardStatsComponent = ({ stats }: DashboardStatsProps) => {
  // Obtener mes actual para mostrar en el título
  const mesActual = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  
  return (
    <div className="mb-6 sm:mb-8">
      {/* Título con mes actual */}
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Estadísticas de {mesActual.charAt(0).toUpperCase() + mesActual.slice(1)}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">Resumen del mes en curso</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Reservas */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Reservas</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalReservas}</div>
          <div className="text-xs text-gray-500 mt-1">Este mes</div>
        </div>

        {/* Total Asistentes */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Asistentes</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalAsistentes}</div>
          <div className="text-xs text-gray-500 mt-1">Este mes</div>
        </div>

        {/* Total Sin Reserva */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Sin Reserva</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalSinReserva}</div>
          <div className="text-xs text-gray-500 mt-1">Este mes</div>
        </div>

        {/* Reservas Hoy */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Reservas Hoy</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.reservasHoy}</div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ⚡ OPTIMIZACIÓN: Exportar con React.memo
// Solo re-renderiza si alguna estadística cambia
export const DashboardStats = React.memo(
  DashboardStatsComponent,
  (prevProps, nextProps) => {
    // Comparación superficial de todas las estadísticas
    return (
      prevProps.stats.totalReservas === nextProps.stats.totalReservas &&
      prevProps.stats.totalAsistentes === nextProps.stats.totalAsistentes &&
      prevProps.stats.totalSinReserva === nextProps.stats.totalSinReserva &&
      prevProps.stats.reservasHoy === nextProps.stats.reservasHoy
    );
  }
);
