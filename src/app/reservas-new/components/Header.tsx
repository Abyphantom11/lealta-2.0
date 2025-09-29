"use client";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Plus } from "lucide-react";
import { useIsClient } from "./hooks/useClient";

interface HeaderProps {
  totalReservas: number;
  onCreateReserva: () => void;
}

export function Header({ totalReservas, onCreateReserva }: HeaderProps) {
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
          <Button 
            onClick={onCreateReserva}
            className="bg-black hover:bg-gray-800 text-white min-h-[44px] w-full font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reserva
          </Button>
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
        <Button 
          onClick={onCreateReserva}
          className="bg-black hover:bg-gray-800 text-white min-h-[44px] w-full sm:w-auto font-medium"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Reserva
        </Button>
      </div>
    </div>
  );
}
