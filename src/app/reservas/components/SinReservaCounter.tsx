'use client';

import { useState } from 'react';
import { Plus, Minus, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface SinReservaCounterProps {
  businessId: string;
  onRegistroCreado: () => void;
}

export function SinReservaCounter({ businessId, onRegistroCreado }: SinReservaCounterProps) {
  const [cantidad, setCantidad] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);

  const incrementar = () => {
    if (cantidad < 99) {
      setCantidad(prev => prev + 1);
    }
  };

  const decrementar = () => {
    if (cantidad > 1) {
      setCantidad(prev => prev - 1);
    }
  };

  const registrar = async () => {
    setIsRegistering(true);
    
    try {
      const now = new Date();
      
      // ✅ Formatear fecha en zona horaria local (no UTC)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const fecha = `${year}-${month}-${day}`; // YYYY-MM-DD local
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const hora = `${hours}:${minutes}`; // HH:mm local

      console.log('📅 Registrando sin reserva:', { fecha, hora, now: now.toString() });

      const response = await fetch(`/api/sin-reserva`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          numeroPersonas: cantidad,
          fecha,
          hora,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar');
      }

      toast.success(`✅ ${cantidad} ${cantidad === 1 ? 'persona' : 'personas'} sin reserva registrada`, {
        className: 'bg-green-600 text-white border-0',
      });

      // Reset contador
      setCantidad(1);
      
      // Notificar al padre para refrescar datos
      onRegistroCreado();

    } catch (error) {
      console.error('Error al registrar sin reserva:', error);
      toast.error('❌ Error al registrar', {
        className: 'bg-red-600 text-white border-0',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          Sin Reserva
        </h3>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Contador */}
        <div className="flex items-center gap-4">
          <Button
            onClick={decrementar}
            disabled={cantidad <= 1 || isRegistering}
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full"
          >
            <Minus className="w-5 h-5" />
          </Button>

          <div className="text-center min-w-[100px]">
            <div className="text-5xl font-bold text-blue-600">
              {cantidad}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {cantidad === 1 ? 'persona' : 'personas'}
            </div>
          </div>

          <Button
            onClick={incrementar}
            disabled={cantidad >= 99 || isRegistering}
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Botón registrar */}
        <Button
          onClick={registrar}
          disabled={isRegistering}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
          size="lg"
        >
          {isRegistering ? 'Registrando...' : `Registrar ${cantidad} ${cantidad === 1 ? 'persona' : 'personas'}`}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Registra personas que llegan sin reserva previa
        </p>
      </div>
    </div>
  );
}
