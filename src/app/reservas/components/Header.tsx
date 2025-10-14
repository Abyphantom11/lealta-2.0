"use client";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Plus, Sparkles } from "lucide-react";
import { useIsClient } from "./hooks/useClient";

interface HeaderProps {
  totalReservas: number;
  onCreateReserva: () => void;
  onCreateAIReserva: () => void;
}

export function Header({ totalReservas, onCreateReserva, onCreateAIReserva }: Readonly<HeaderProps>) {
  const isClient = useIsClient();

  if (!isClient) {
    // Renderizado de servidor - sin clases responsive que puedan causar hidratación
    return (
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold truncate">Reservas lealta</h1>
        </div>
        <div className="flex flex-col items-stretch gap-3">
          <Badge variant="secondary" className="px-3 py-2 text-center text-sm whitespace-nowrap">
            {totalReservas} reservas
          </Badge>
          <div className="flex gap-2">
            <Button 
              onClick={onCreateReserva}
              className="bg-black hover:bg-gray-800 text-white h-12 flex-1 font-medium text-base"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Button>
            <Button 
              onClick={onCreateAIReserva}
              className="bg-purple-600 hover:bg-purple-700 text-white h-12 flex-1 font-medium text-base"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              IA
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado de cliente - con todas las clases responsive
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
      <div className="flex items-center justify-between sm:justify-start">
        <h1 className="text-2xl sm:text-3xl font-bold truncate">Reservas lealta</h1>
        <ThemeToggle className="sm:hidden" />
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <Badge variant="secondary" className="px-3 py-2 text-center sm:text-left text-sm whitespace-nowrap">
          {totalReservas} reservas
        </Badge>
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button 
            onClick={onCreateReserva}
            className="bg-black hover:bg-gray-800 text-white h-12 sm:h-10 flex-1 sm:flex-none sm:w-auto font-medium text-base sm:text-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reserva
          </Button>
          <Button 
            onClick={onCreateAIReserva}
            className="bg-purple-600 hover:bg-purple-700 text-white h-12 sm:h-10 flex-1 sm:flex-none sm:w-auto font-medium text-base sm:text-sm"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Reserva</span> IA
          </Button>
        </div>
      </div>
    </div>
  );
}
