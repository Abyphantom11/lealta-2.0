import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CalendarFullscreenModal } from "./ui/calendar-fullscreen-modal";
import { Search, Filter, Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MobileFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const MobileFilters = ({
  searchTerm,
  setSearchTerm,
  selectedDate,
  onDateSelect
}: MobileFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const clearFilters = () => {
    setSearchTerm("");
  };

  const hasActiveFilters = searchTerm;

  return (
    <div className="lg:hidden mb-4">
      {/* Botón para mostrar filtros adicionales */}
      <div className="flex gap-2 mb-3">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex-1 min-h-[44px] text-sm font-medium justify-center"
        >
          <Filter className="mr-2 h-4 w-4" />
          Búsqueda {showFilters ? '▲' : '▼'}
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              1
            </span>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="min-h-[44px] px-3"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Selector de fecha siempre visible en móvil */}
      <div className="space-y-3 p-4 bg-muted/50 rounded-lg mb-4 border">
        {/* Selector de fecha */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Fecha de reservas</label>
          <Button
            variant="outline"
            className="w-full min-h-[44px] justify-start"
            onClick={() => setShowDatePicker(true)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {format(selectedDate, "dd/MM/yyyy", { locale: es })}
          </Button>
          <p className="text-xs text-muted-foreground">
            Mostrando reservas del {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
          </p>
        </div>

        {/* Filtros collapsibles */}
        {showFilters && (
          <div className="space-y-3 pt-3 border-t">
            {/* Buscador */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por cliente, promotor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-h-[44px] pl-10"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Calendar Fullscreen Modal */}
      <CalendarFullscreenModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
      />
    </div>
  );
};
