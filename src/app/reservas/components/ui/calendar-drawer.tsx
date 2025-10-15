import { useState, useEffect } from "react";
import { Button } from "./button";
import { CustomCalendar } from "./custom-calendar";
import { X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CalendarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const CalendarDrawer = ({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect
}: CalendarDrawerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevenir scroll del body cuando el drawer está abierto
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />
      
      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          maxHeight: '70vh',
          backgroundColor: 'white'
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 pb-4 border-b border-gray-200 bg-white"
          style={{ backgroundColor: 'white' }}
        >
          <div>
            <h3 className="text-lg font-semibold !text-gray-900 dark:!text-gray-900">
              Seleccionar fecha
            </h3>
            <p className="text-sm !text-gray-500 dark:!text-gray-500">
              Fecha actual: {format(selectedDate, "dd/MM/yyyy", { locale: es })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50"
          >
            <X className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
        
        {/* Calendar Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 100px)' }}>
          <div className="flex justify-center">
            <CustomCalendar
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
              locale={es}
              className="mobile-calendar"
            />
          </div>
        </div>
      </div>
    </>
  );
};
