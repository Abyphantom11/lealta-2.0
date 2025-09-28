import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Users, Calendar, TrendingUp, Clock } from "lucide-react";
import { DashboardStats as StatsType } from "../types/reservation";

interface DashboardStatsProps {
  readonly stats: StatsType;
}

const getAsistenciaBadgeVariant = (promedio: number) => {
  if (promedio >= 80) return "default";
  if (promedio >= 60) return "secondary";
  return "destructive";
};

const getAsistenciaText = (promedio: number) => {
  if (promedio >= 80) return "Excelente";
  if (promedio >= 60) return "Bueno";
  return "Mejorar";
};

const getReservasHoyText = (cantidad: number) => {
  if (cantidad === 0) return "Sin reservas";
  if (cantidad === 1) return "1 reserva programada";
  return `${cantidad} reservas programadas`;
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.totalReservas}</p>
            <p className="text-xs text-muted-foreground">
              Reservas registradas en el sistema
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Asistentes</CardTitle>
          <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.totalAsistentes}</p>
            <p className="text-xs text-muted-foreground">
              Personas que han asistido
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">% Asistencia</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{(stats.promedioAsistencia || 0).toFixed(1)}%</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(stats.promedioAsistencia || 0, 100)}%` }}
                />
              </div>
              <Badge 
                variant={getAsistenciaBadgeVariant(stats.promedioAsistencia || 0)}
                className="text-xs"
              >
                {getAsistenciaText(stats.promedioAsistencia || 0)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reservas Hoy</CardTitle>
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.reservasHoy}</p>
            <p className="text-xs text-muted-foreground">
              {getReservasHoyText(stats.reservasHoy)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
