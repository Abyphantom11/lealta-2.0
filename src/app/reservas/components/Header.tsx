"use client";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Plus, Sparkles, LogOut, Palette } from "lucide-react";
import { useIsClient } from "./hooks/useClient";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QRTemplatesModal } from "./QRTemplatesModal";

interface HeaderProps {
  totalReservas: number;
  onCreateReserva: () => void;
  onCreateAIReserva: () => void;
  businessId: string;
}

export function Header({ totalReservas, onCreateReserva, onCreateAIReserva, businessId }: Readonly<HeaderProps>) {
  const isClient = useIsClient();
  const router = useRouter();
  const [isQRTemplatesOpen, setIsQRTemplatesOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Llamar a la API de logout
      await fetch('/api/auth/signout', { method: 'POST' });
      
      // Limpiar cookies del lado del cliente
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Redirigir al login
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Redirigir al login de todas formas
      router.push('/login');
    }
  };

  if (!isClient) {
    // Renderizado de servidor - sin clases responsive que puedan causar hidratación
    return (
      <div className="flex flex-col gap-4 mb-6">
        <QRTemplatesModal 
          isOpen={isQRTemplatesOpen}
          onClose={() => setIsQRTemplatesOpen(false)}
          businessId={businessId}
        />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold truncate">Reservas lealta</h1>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsQRTemplatesOpen(true)}
              variant="outline"
              size="sm"
              className="text-gray-600"
              title="Estilos de QR (Halloween, Navidad, etc.)"
            >
              <Palette className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-red-600 hover:border-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
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
      <QRTemplatesModal 
        isOpen={isQRTemplatesOpen}
        onClose={() => setIsQRTemplatesOpen(false)}
        businessId={businessId}
      />
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold truncate">Reservas lealta</h1>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setIsQRTemplatesOpen(true)}
            variant="outline"
            size="sm"
            className="text-gray-600 sm:hidden"
            title="Estilos de QR"
          >
            <Palette className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-red-600 hover:border-red-600 sm:hidden"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <Badge variant="secondary" className="px-3 py-2 text-center sm:text-left text-sm whitespace-nowrap">
          {totalReservas} reservas
        </Badge>
        <div className="hidden sm:flex items-center gap-2">
          <Button 
            onClick={() => setIsQRTemplatesOpen(true)}
            variant="outline"
            size="sm"
            className="text-gray-600"
            title="Estilos temáticos de QR"
          >
            <Palette className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-red-600 hover:border-red-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
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
