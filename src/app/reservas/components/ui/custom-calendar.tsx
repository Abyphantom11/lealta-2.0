"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format, addMonths, subMonths, addYears, subYears, startOfMonth, isSameMonth, isSameDay, addDays } from "date-fns";
import { es, type Locale } from "date-fns/locale";
import { cn } from "./utils";
import { Button } from "./button";

export interface CustomCalendarProps {
  readonly selectedDate?: Date;
  readonly onSelect?: (date: Date) => void;
  readonly className?: string;
  readonly locale?: Locale;
  readonly reservedDates?: string[]; // Array de fechas en formato 'yyyy-MM-dd' que tienen reservas
}

const DAYS_OF_WEEK = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

export function CustomCalendar({
  selectedDate = new Date(),
  onSelect,
  className,
  locale = es,
  reservedDates = []
}: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(selectedDate));
  
  // Generar días del mes actual
  const firstDay = startOfMonth(currentMonth);
  
  // Obtener el día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
  let firstDayOfWeek = firstDay.getDay();
  // Ajustar para que la semana comience en lunes (0 = lunes, 6 = domingo)
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // ✅ GENERAR SIEMPRE 6 SEMANAS COMPLETAS (42 días)
  const calendarStart = addDays(firstDay, -firstDayOfWeek);
  const calendarDays = [];
  
  for (let i = 0; i < 42; i++) {
    calendarDays.push(addDays(calendarStart, i));
  }

  // Agrupar días en semanas de 7 días
  const weeks = [];
  for (let i = 0; i < 42; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Variable para evitar doble disparo de eventos touch + click
  const touchHandledRef = React.useRef<{prev: number, next: number}>({prev: 0, next: 0});

  // Función para ir al mes anterior
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Función para ir al mes siguiente
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Función para ir al año anterior
  const prevYear = () => {
    setCurrentMonth(subYears(currentMonth, 1));
  };

  // Función para ir al año siguiente
  const nextYear = () => {
    setCurrentMonth(addYears(currentMonth, 1));
  };

  return (
    <div className={cn(
      "w-full p-3 bg-white",
      className?.includes('mobile-calendar-fullscreen') ? "min-w-[320px] max-w-[380px]" :
      "min-w-[280px] max-w-[320px]",
      className
    )}>
      {/* Encabezado del calendario - Compacto con navegación de años */}
      <div className="flex items-center justify-between mb-3 gap-1">
        {/* Año anterior */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "shrink-0 hover:bg-gray-100 border-gray-200",
            className?.includes('mobile-calendar-fullscreen') ? "h-9 w-9" :
            className?.includes('mobile-calendar') ? "h-8 w-8" : "h-8 w-8"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            prevYear();
          }}
          title="Año anterior"
        >
          <ChevronsLeft className="h-4 w-4 text-gray-700" />
        </Button>

        {/* Mes anterior */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "shrink-0 hover:bg-gray-100 border-gray-200",
            className?.includes('mobile-calendar-fullscreen') ? "h-9 w-9" :
            className?.includes('mobile-calendar') ? "h-8 w-8" : "h-8 w-8"
          )} 
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            touchHandledRef.current.prev = Date.now();
            prevMonth();
          }}
          onClick={(e) => {
            const timeSinceTouch = Date.now() - touchHandledRef.current.prev;
            
            // Si el touch fue hace menos de 500ms, ignorar el click (es el mismo gesto)
            if (timeSinceTouch < 500) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            prevMonth();
          }}
          title="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4 text-gray-700" />
        </Button>

        {/* Mes y año actual */}
        <div className={cn(
          "font-semibold text-center flex-1 px-2 capitalize text-gray-900",
          className?.includes('mobile-calendar-fullscreen') ? "text-lg" :
          className?.includes('mobile-calendar') ? "text-base" : "text-base"
        )}>
          {format(currentMonth, 'MMMM yyyy', { locale })}
        </div>

        {/* Mes siguiente */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "shrink-0 hover:bg-gray-100 border-gray-200",
            className?.includes('mobile-calendar-fullscreen') ? "h-9 w-9" :
            className?.includes('mobile-calendar') ? "h-8 w-8" : "h-8 w-8"
          )}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            touchHandledRef.current.next = Date.now();
            nextMonth();
          }}
          onClick={(e) => {
            const timeSinceTouch = Date.now() - touchHandledRef.current.next;
            
            // Si el touch fue hace menos de 500ms, ignorar el click (es el mismo gesto)
            if (timeSinceTouch < 500) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            nextMonth();
          }}
          title="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4 text-gray-700" />
        </Button>

        {/* Año siguiente */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "shrink-0 hover:bg-gray-100 border-gray-200",
            className?.includes('mobile-calendar-fullscreen') ? "h-9 w-9" :
            className?.includes('mobile-calendar') ? "h-8 w-8" : "h-8 w-8"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            nextYear();
          }}
          title="Año siguiente"
        >
          <ChevronsRight className="h-4 w-4 text-gray-700" />
        </Button>
      </div>

      {/* Días de la semana - Compacto */}
      <div className="grid grid-cols-7 mb-1.5 text-center">
        {DAYS_OF_WEEK.map((day) => (
          <div 
            key={day} 
            className={cn(
              "text-gray-500 font-medium py-1.5 uppercase",
              className?.includes('mobile-calendar-fullscreen') ? "text-xs" :
              className?.includes('mobile-calendar') ? "text-[11px]" : "text-[10px]"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendario - Compacto con negro elegante */}
      <div className={cn(
        className?.includes('mobile-calendar-fullscreen') ? "space-y-1.5" : "space-y-1"
      )}>
        {weeks.map((week) => (
          <div key={week[0].toISOString()} className={cn(
            "grid grid-cols-7",
            className?.includes('mobile-calendar-fullscreen') ? "gap-1.5" : "gap-1"
          )}>
            {week.map((day) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dayString = format(day, 'yyyy-MM-dd');
              const hasReservations = reservedDates.includes(dayString);
              const isMobileFullscreen = className?.includes('mobile-calendar-fullscreen');
              const isMobile = className?.includes('mobile-calendar');
              
              return (
                <Button
                  key={day.toISOString()}
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    isMobileFullscreen ? "h-10 w-10 p-0 font-normal relative touch-manipulation text-sm rounded-md" :
                    isMobile ? "h-9 w-9 p-0 font-normal relative touch-manipulation text-xs rounded-md" : 
                    "h-8 w-8 p-0 font-normal relative touch-manipulation text-xs rounded-md",
                    !isCurrentMonth && "text-gray-300 opacity-40",
                    isSelected && "bg-gray-900 text-white hover:bg-gray-800 font-semibold shadow-sm",
                    hasReservations && isCurrentMonth && !isSelected && "bg-gray-100 border border-gray-300 font-semibold text-gray-900 hover:bg-gray-200",
                    !hasReservations && isCurrentMonth && !isSelected && "hover:bg-gray-50 border border-transparent text-gray-700",
                    (isMobile || isMobileFullscreen) && "active:scale-95 transition-all duration-100"
                  )}
                  onClick={() => onSelect?.(day)}
                  disabled={!isCurrentMonth}
                >
                  {format(day, 'd')}
                  {hasReservations && isCurrentMonth && (
                    <div className={cn(
                      "absolute bottom-0.5 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-full",
                      isSelected && "bg-white",
                      isMobileFullscreen ? "w-1 h-1" :
                      isMobile ? "w-1 h-1" : "w-1 h-1"
                    )}></div>
                  )}
                </Button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Leyenda compacta */}
      <div className="mt-3 pt-2.5 border-t border-gray-200">
        <div className="flex items-center justify-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-900"></div>
            <span className="text-gray-600">Seleccionado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Con reservas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
