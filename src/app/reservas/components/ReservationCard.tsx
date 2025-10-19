import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, Clock, Users, CheckCircle, Eye, Edit, Pencil } from "lucide-react";
import { Reserva } from "../types/reservation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { DateChangeModal } from "./DateChangeModal";
import { PersonasAjusteModal } from "./PersonasAjusteModal";
import { EditNameModal } from "./EditNameModal";

interface ReservationCardProps {
  reserva: Reserva;
  onView: () => void;
  onEdit?: () => void; // ✅ Nueva prop para editar
  onDateChange?: (reservaId: string, newDate: Date) => Promise<void>; // ✅ Nueva prop para cambiar fecha
  onPersonasChange?: (reservaId: string, newPersonas: number) => Promise<void>; // ✅ Nueva prop para cambiar personas
  onNameChange?: (reservaId: string, clienteId: string, newName: string) => Promise<void>; // ✅ Nueva prop para cambiar nombre
  reservedDates?: string[]; // Fechas que ya tienen reservas
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

export const ReservationCard = ({ reserva, onView, onEdit, onDateChange, onPersonasChange, onNameChange, reservedDates = [] }: ReservationCardProps) => {
  const [renderKey, setRenderKey] = useState(0);
  const [showDateChangeModal, setShowDateChangeModal] = useState(false);
  const [showPersonasModal, setShowPersonasModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  
  // 🔄 Monitorear cambios en las props de reserva
  useEffect(() => {
    // Logs removidos para producción
  }, [reserva]);
  
  // 🔄 Monitorear cambios específicos en el nombre del cliente
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [reserva.cliente.nombre]);
  
  // 🔄 Listener para re-renders forzados desde actualizaciones móviles
  useEffect(() => {
    const handleForceRefresh = (event: CustomEvent) => {
      if (event.detail.reservaId === reserva.id) {
        setRenderKey(prev => prev + 1);
        // Logs removidos para producción
      }
    };
    
    globalThis.addEventListener('force-card-refresh', handleForceRefresh as EventListener);
    
    return () => {
      globalThis.removeEventListener('force-card-refresh', handleForceRefresh as EventListener);
    };
  }, [reserva.id]);

  // Verificar si tiene comprobante de pago
  const tieneComprobante = Boolean(reserva.comprobanteUrl || reserva.comprobanteSubido);

  // Manejar cambio de fecha
  const handleDateChange = async (newDate: Date) => {
    if (onDateChange) {
      await onDateChange(reserva.id, newDate);
    }
  };

  // Manejar cambio de personas
  const handlePersonasChange = async (newPersonas: number) => {
    if (onPersonasChange) {
      await onPersonasChange(reserva.id, newPersonas);
    }
  };

  // Manejar cambio de nombre
  const handleNameChange = async (newName: string) => {
    if (onNameChange) {
      await onNameChange(reserva.id, reserva.cliente.id, newName);
    }
  };

  return (
    <>
      <DateChangeModal
        isOpen={showDateChangeModal}
        onClose={() => setShowDateChangeModal(false)}
        onDateChange={handleDateChange}
        currentDate={new Date(reserva.fecha + 'T00:00:00')}
        clienteName={reserva.cliente.nombre}
        reservedDates={reservedDates}
      />
      
      <PersonasAjusteModal
        isOpen={showPersonasModal}
        onClose={() => setShowPersonasModal(false)}
        onConfirm={handlePersonasChange}
        currentPersonas={reserva.numeroPersonas}
        clienteName={reserva.cliente.nombre}
      />

      <EditNameModal
        isOpen={showEditNameModal}
        onClose={() => setShowEditNameModal(false)}
        onConfirm={handleNameChange}
        currentName={reserva.cliente.nombre}
      />
    <Card className={`mb-3 border-l-4 ${getEstadoColor(reserva.estado)} hover:shadow-md transition-shadow ${
      tieneComprobante ? 'bg-fuchsia-50/30' : ''
    }`} key={renderKey}>
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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base truncate">{reserva.cliente.nombre}</h3>
              {onNameChange && (
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(true)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Editar nombre del cliente"
                  aria-label="Editar nombre del cliente"
                >
                  <Pencil className="h-3.5 w-3.5 text-gray-500 hover:text-blue-600" />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{reserva.cliente.telefono}</p>
          </div>
        </div>

        {/* Información principal */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          {onDateChange ? (
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors border-0 bg-transparent text-left w-full"
              onClick={() => setShowDateChangeModal(true)}
              aria-label={`Cambiar fecha de reserva. Fecha actual: ${format(new Date(reserva.fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}`}
              title="Click para cambiar fecha"
            >
              <Calendar className="h-4 w-4 flex-shrink-0 text-blue-600" />
              <span className="truncate text-blue-600 font-medium">
                {format(new Date(reserva.fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="truncate">
                {format(new Date(reserva.fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{reserva.hora}</span>
          </div>
          {onPersonasChange ? (
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors border-0 bg-transparent text-left w-full"
              onClick={() => setShowPersonasModal(true)}
              aria-label={`Ajustar número de personas. Actual: ${reserva.numeroPersonas}`}
              title="Click para ajustar personas"
            >
              <Users className="h-4 w-4 flex-shrink-0 text-purple-600" />
              <span className="truncate font-medium text-purple-600">
                {reserva.asistenciaActual}/{reserva.numeroPersonas} personas
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate font-medium">
                {reserva.asistenciaActual}/{reserva.numeroPersonas} personas
              </span>
            </div>
          )}
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
    </>
  );
};
