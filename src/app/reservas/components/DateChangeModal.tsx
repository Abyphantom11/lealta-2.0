import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { CustomCalendar } from "./ui/custom-calendar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface DateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateChange: (newDate: Date) => Promise<void>;
  currentDate: Date;
  clienteName: string;
  reservaId: string;
  reservedDates?: string[]; // Fechas que ya tienen reservas
}

export function DateChangeModal({
  isOpen,
  onClose,
  onDateChange,
  currentDate,
  clienteName,
  reservedDates = []
}: Readonly<Omit<DateChangeModalProps, 'reservaId'>>) {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = async () => {
    if (!selectedDate || selectedDate.getTime() === currentDate.getTime()) {
      toast.error("Selecciona una fecha diferente");
      return;
    }

    setIsLoading(true);
    try {
      await onDateChange(selectedDate);
      toast.success(`Reserva de ${clienteName} cambiada a ${format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}`);
      onClose();
    } catch (error) {
      console.error("Error al cambiar fecha:", error);
      toast.error("Error al cambiar la fecha de la reserva");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedDate(currentDate); // Reset al cerrar
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col bg-white border border-gray-200 shadow-xl">
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 -m-6 p-6 mb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3 text-gray-900 text-lg font-semibold">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            Cambiar fecha de reserva
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Cambia la fecha de la reserva de <span className="font-medium text-gray-900">{clienteName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-2">
          {/* Información actual */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Fecha actual:</span>
              <span className="font-semibold text-gray-900 bg-white px-3 py-1 rounded-md border border-gray-200">
                {format(currentDate, "dd 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
            {selectedDate.getTime() !== currentDate.getTime() && (
              <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-200">
                <span className="text-gray-600 font-medium">Nueva fecha:</span>
                <span className="font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                  {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
            )}
          </div>

          {/* Calendario */}
          <div className="flex justify-center mb-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <CustomCalendar
                selectedDate={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                locale={es}
                reservedDates={reservedDates}
                className="border-0"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4 border-t border-gray-100">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDateChange}
            disabled={isLoading || selectedDate.getTime() === currentDate.getTime()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Cambiando...
              </>
            ) : (
              'Cambiar fecha'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
