import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { CustomCalendar } from "./ui/custom-calendar";
import { Search, Calendar, X } from "lucide-react";
import { es } from "date-fns/locale";
import { format } from "date-fns";

interface DesktopFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
}

export const DesktopFilters = ({
  searchTerm,
  setSearchTerm,
  selectedDate,
  onDateSelect,
  showDatePicker,
  setShowDatePicker
}: DesktopFiltersProps) => {
  const clearFilters = () => {
    setSearchTerm("");
  };

  const hasActiveFilters = searchTerm;

  return (
    <div className="hidden lg:flex lg:items-center lg:gap-4 p-4 pb-2 border-b">
      {/* Buscador */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por cliente, promotor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selector de fecha - siempre activo */}
      <div className="flex items-center gap-2">
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[140px] justify-start"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {format(selectedDate, "dd/MM/yyyy", { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CustomCalendar
              selectedDate={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onDateSelect(date);
                  setShowDatePicker(false);
                }
              }}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
};
