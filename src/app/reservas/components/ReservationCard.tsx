import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, Clock, Users, CheckCircle, Eye, Edit } from "lucide-react";
import { Reserva } from "../types/reservation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";

interface ReservationCardProps {
  reserva: Reserva;
  onView: () => void;
  onEdit?: () => void; // ✅ Nueva prop para editar
}

const getEstadoVariant = (estado: Reserva['estado']) => {
  switch (estado) {
    case 'Activa':
      return 'default';
    case 'En Progreso':
      return 'secondary';
    case 'En Camino':
      return 'default';
    case 'Reserva Caída':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getEstadoColor = (estado: Reserva['estado']) => {
  switch (estado) {
    case 'Activa':
      return 'border-l-green-500';
    case 'En Progreso':
      return 'border-l-yellow-500';
    case 'En Camino':
      return 'border-l-blue-500';
    case 'Reserva Caída':
      return 'border-l-red-500';
    default:
      return 'border-l-gray-300';
  }
};

export const ReservationCard = ({ reserva, onView, onEdit }: ReservationCardProps) => {
  const [renderKey, setRenderKey] = useState(0);
  
  // 🔄 Monitorear cambios en las props de reserva
  useEffect(() => {
    // Logs removidos para producción
  }, [reserva]);
  
  // 🔄 Listener para re-renders forzados desde actualizaciones móviles
  useEffect(() => {
    const handleForceRefresh = (event: CustomEvent) => {
      if (event.detail.reservaId === reserva.id) {
        setRenderKey(prev => prev + 1);
        // Logs removidos para producción
      }
    };
    
    window.addEventListener('force-card-refresh', handleForceRefresh as EventListener);
    
    return () => {
      window.removeEventListener('force-card-refresh', handleForceRefresh as EventListener);
    };
  }, [reserva.id, renderKey]);

  // Verificar si tiene comprobante de pago
  const tieneComprobante = Boolean(reserva.comprobanteUrl || reserva.comprobanteSubido);

  return (
    <Card className={`mb-3 border-l-4 ${getEstadoColor(reserva.estado)} hover:shadow-md transition-shadow ${
      tieneComprobante ? 'bg-fuchsia-50/30' : ''
    }`}>
      <CardContent className="p-4">
        {/* Header de la tarjeta */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {reserva.mesa || "Sin mesa"}
              </span>
              <Badge variant={getEstadoVariant(reserva.estado)} className="flex-shrink-0 text-xs">
                {reserva.estado}
              </Badge>
              {/* Indicador de pago en reserva */}
              {tieneComprobante && (
                <span className="text-xs font-semibold text-fuchsia-600 bg-fuchsia-100 px-2 py-0.5 rounded-full">
                  Pago en reserva
                </span>
              )}
            </div>
            <h3 className="font-semibold text-base truncate">{reserva.cliente.nombre}</h3>
            <p className="text-sm text-muted-foreground truncate">{reserva.cliente.telefono}</p>
          </div>
        </div>

        {/* Información principal */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              {format(new Date(reserva.fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{reserva.hora}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate font-medium">
              {reserva.asistenciaActual}/{reserva.numeroPersonas} personas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">
              Promotor: {reserva.promotor?.nombre || 'Sistema'}
            </span>
          </div>
        </div>

        {/* Botón de acción - optimizado para móvil */}
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onView} 
            className="flex-1 min-h-[44px] text-xs sm:text-sm font-medium"
            title="Ver detalles de la reserva"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </Button>
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit} 
              className="flex-1 min-h-[44px] text-xs sm:text-sm font-medium border-blue-200 text-blue-600 hover:bg-blue-50"
              title="Editar reserva"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
