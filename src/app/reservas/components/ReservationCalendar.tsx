import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Reserva } from "../types/reservation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReservationCalendarProps {
  reservas: Reserva[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const getBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'Completada':
      return 'default' as const; // Negro como en Figma
    case 'En Progreso':
      return 'secondary' as const; // Gris como en Figma
    case 'No Show':
      return 'destructive' as const; // Rojo como en Figma
    case 'Confirmada':
      return 'outline' as const; // Borde como en Figma
    default:
      return 'outline' as const;
  }
};

export function ReservationCalendar({ reservas, selectedDate, onDateSelect }: Readonly<ReservationCalendarProps>) {
  console.log("🚀 ReservationCalendar renderizándose - CAMBIOS APLICADOS");
  
  const getReservasForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservas.filter(reserva => reserva.fecha === dateStr);
  };

  const modifiers = {
    hasReservations: (date: Date) => getReservasForDate(date).length > 0
  };

  const modifiersStyles = {
    hasReservations: {
      backgroundColor: '#000000', // NEGRO SÓLIDO como en Figma
      color: '#ffffff',
      borderRadius: '6px',
      fontWeight: '600',
      border: 'none'
    }
  };

  const reservasDelDia = getReservasForDate(selectedDate);

  return (
    <div className="space-y-3 h-full">
      <Card className="h-auto">
        <CardContent className="p-3">
          <h3 className="text-sm font-medium mb-3">Calendario de Reservas</h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date: Date | undefined) => date && onDateSelect(date)}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="w-full"
            showOutsideDays={false}
          />
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold mb-4">
            {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
          </h4>
          
          {reservasDelDia.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground text-center">No hay reservas para este día</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservasDelDia.map((reserva) => (
                <div
                  key={reserva.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{reserva.cliente?.nombre || 'Sin nombre'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reserva.hora} • {reserva.asistenciaActual}/{reserva.numeroPersonas} personas
                    </p>
                  </div>
                  <Badge variant={getBadgeVariant(reserva.estado)} className="ml-3">
                    {reserva.estado}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
