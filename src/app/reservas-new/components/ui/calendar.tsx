"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { format } from "date-fns";
// Importación explícita de estilos de react-day-picker
import "react-day-picker/dist/style.css";

import { cn } from "./utils";
import { buttonVariants } from "./button";

// Importación de estilos CSS inline para forzar el comportamiento deseado
const calendarStyles = `
  .rdp {
    width: 100%;
  }
  .rdp-months {
    display: grid;
    width: 100%;
  }
  .rdp-month {
    width: 100%;
  }
  .rdp-table {
    width: 100%;
    border-collapse: collapse;
  }
  .rdp-head {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }
  .rdp-head_cell {
    text-align: center;
    padding: 0.5rem 0;
    font-size: 0.75rem;
    font-weight: normal;
  }
  .rdp-tbody {
    display: grid;
  }
  .rdp-week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }
  .rdp-day {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 36px;
    width: 36px;
    margin: 0 auto;
    border-radius: 9999px;
    cursor: pointer;
  }
  .rdp-day_selected {
    background-color: black;
    color: white;
  }
  .rdp-day_today {
    font-weight: bold;
    text-decoration: underline;
  }
`;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  // Agregar estilos CSS inline al componente
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = calendarStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0 w-full", className)}
      classNames={{
        root: "w-full",
        months: "grid grid-cols-1",
        month: "w-full space-y-2",
        caption: "flex justify-center pt-2 relative items-center px-8 h-10",
        caption_label: "text-base font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-80 hover:opacity-100 absolute top-2"
        ),
        nav_button_previous: "left-1",
        nav_button_next: "right-1",
        table: "w-full border-collapse border-spacing-0",
        head_row: "grid grid-cols-7",
        head_cell: "text-muted-foreground text-xs font-normal text-center py-2",
        row: "grid grid-cols-7",
        cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 mx-auto flex items-center justify-center text-sm rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
        ),
        day_selected:
          "bg-black text-white hover:bg-black/90 hover:text-white focus:bg-black focus:text-white",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-60",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
      }}
      locale={es}
      formatters={{
        formatWeekdayName: (date) => {
          const weekdayNames = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'];
          return weekdayNames[date.getDay()];
        },
        formatCaption: (date) => {
          return format(date, 'MMMM yyyy', { locale: es });
        }
      }}
      numberOfMonths={1}
      weekStartsOn={1}
      fixedWeeks={true}
      {...props}
    />
  );
}

export { Calendar };
