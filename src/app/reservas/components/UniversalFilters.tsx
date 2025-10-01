'use client';

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CustomCalendar } from "./ui/custom-calendar";
import { Search, Calendar, ChevronDown, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Reserva } from "../types/reservation";

interface UniversalFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  statusFilter: Reserva['estado'] | 'Todos';
  setStatusFilter: (status: Reserva['estado'] | 'Todos') => void;
}

export const UniversalFilters = ({
  searchTerm,
  setSearchTerm,
  selectedDate,
  onDateSelect,
  statusFilter,
  setStatusFilter
}: UniversalFiltersProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statusOptions: Array<{ value: Reserva['estado'] | 'Todos'; label: string }> = [
    { value: 'Todos', label: 'Todos los estados' },
    { value: 'Activa', label: 'Activa' },
    { value: 'En Progreso', label: 'En Progreso' },
    { value: 'Reserva Caída', label: 'Reserva Caída' },
    { value: 'En Camino', label: 'En Camino' }
  ];

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter('Todos');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'Todos';

  return (
    <div className="space-y-4 p-4 border-b">
      {/* Fila superior - Buscador */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por cliente, promotor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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

      {/* Fila inferior - Filtros de estado y fecha */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Selector de estado */}
        <Popover open={showStatusDropdown} onOpenChange={setShowStatusDropdown}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="justify-between min-w-[140px]"
            >
              {statusOptions.find(s => s.value === statusFilter)?.label || 'Todos los estados'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1" align="start">
            <div className="space-y-1">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setStatusFilter(option.value);
                    setShowStatusDropdown(false);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Selector de fecha */}
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="justify-start min-w-[140px]"
              onClick={() => setShowDatePicker(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Filtrar fecha
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
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

        {/* Mostrar fecha seleccionada */}
        <div className="text-sm text-muted-foreground">
          Mostrando: {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
        </div>
      </div>
    </div>
  );
};
