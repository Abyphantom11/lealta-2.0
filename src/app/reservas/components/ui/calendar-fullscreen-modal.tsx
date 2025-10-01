import { useState, useEffect } from "react";
import { Button } from "./button";
import { CustomCalendar } from "./custom-calendar";
import { X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CalendarFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const CalendarFullscreenModal = ({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect
}: CalendarFullscreenModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = 'unset';
      // Pequeño delay para la animación de salida
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-white dark:bg-gray-900 z-50 transition-transform duration-300 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Seleccionar fecha
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fecha actual: {format(selectedDate, "dd/MM/yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-10 w-10 p-0"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Calendar Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-center items-start min-h-full pt-8">
          <CustomCalendar
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
            locale={es}
            className="mobile-calendar-fullscreen"
          />
        </div>
      </div>
      
      {/* Footer con botón de confirmación opcional */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleDateSelect(selectedDate)}
            className="flex-1 h-12"
          >
            Confirmar fecha
          </Button>
        </div>
      </div>
    </div>
  );
};
