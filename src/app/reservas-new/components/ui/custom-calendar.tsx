"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays } from "date-fns";
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
  const lastDay = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });
  
  // Obtener el día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
  let firstDayOfWeek = firstDay.getDay();
  // Ajustar para que la semana comience en lunes (0 = lunes, 6 = domingo)
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Crear array para almacenar días del mes anterior para completar la primera semana
  const daysFromPrevMonth = [];
  if (firstDayOfWeek > 0) {
    const prevMonthLastDay = subMonths(firstDay, 1);
    const prevMonthEnd = endOfMonth(prevMonthLastDay);
    
    // Añadir días del mes anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      daysFromPrevMonth.push(addDays(prevMonthEnd, -i));
    }
  }

  // Crear array para almacenar días del mes siguiente para completar la última semana
  const daysFromNextMonth = [];
  const remainingDays = (7 - ((daysFromPrevMonth.length + daysInMonth.length) % 7)) % 7;
  if (remainingDays > 0) {
    // Añadir días del mes siguiente
    for (let i = 1; i <= remainingDays; i++) {
      daysFromNextMonth.push(addDays(lastDay, i));
    }
  }

  // Combinar todos los días
  const allDays = [...daysFromPrevMonth, ...daysInMonth, ...daysFromNextMonth];

  // Agrupar días en semanas
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  // Función para ir al mes anterior
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Función para ir al mes siguiente
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className={cn("w-full min-w-[280px] p-3", className)}>
      {/* Encabezado del calendario */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-medium text-sm text-center flex-1 px-2">
          {format(currentMonth, 'MMMM yyyy', { locale })}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-muted-foreground text-xs">
            {day}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="space-y-1">
        {weeks.map((week) => (
          <div key={week[0].toISOString()} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dayString = format(day, 'yyyy-MM-dd');
              const hasReservations = reservedDates.includes(dayString);
              
              return (
                <Button
                  key={day.toISOString()}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 font-normal relative",
                    !isCurrentMonth && "text-muted-foreground opacity-50",
                    isSelected && "bg-primary text-primary-foreground",
                    hasReservations && isCurrentMonth && !isSelected && "bg-gray-100 border border-gray-300 font-semibold"
                  )}
                  onClick={() => onSelect?.(day)}
                  disabled={!isCurrentMonth}
                >
                  {format(day, 'd')}
                  {hasReservations && isCurrentMonth && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                  )}
                </Button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
