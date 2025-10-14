'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SinReserva } from '../types/sin-reserva';

interface SinReservaTableProps {
  registros: SinReserva[];
  selectedDate?: Date; // Nueva prop para mostrar fecha seleccionada
  onDelete: (id: string) => void;
}

export function SinReservaTable({ registros, selectedDate, onDelete }: Readonly<SinReservaTableProps>) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtrar registros por fecha seleccionada si está disponible
  const registrosFiltrados = selectedDate 
    ? registros.filter(registro => {
        const fechaRegistro = registro.fecha;
        const fechaSeleccionada = format(selectedDate, 'yyyy-MM-dd');
        return fechaRegistro === fechaSeleccionada;
      })
    : registros;

  // Calcular estadísticas
  const totalPersonas = registrosFiltrados.reduce((sum, registro) => sum + registro.numeroPersonas, 0);
  const esHoy = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : true;

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header con información de fecha */}
      {selectedDate && (
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Sin Reserva - {format(selectedDate, 'PPPP', { locale: es })}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{registrosFiltrados.length} registro{registrosFiltrados.length !== 1 ? 's' : ''}</span>
              <span>{totalPersonas} persona{totalPersonas !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenedor con altura fija y scroll */}
      <div className="overflow-auto" style={{ maxHeight: '600px', minHeight: '600px' }}>
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              {!selectedDate && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Fecha
                </th>
              )}
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Hora
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Personas
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Notas
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {registrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={selectedDate ? 4 : 5} className="text-center py-12 text-gray-500">
                  <p className="text-lg">
                    {selectedDate 
                      ? `No hay registros sin reserva para ${format(selectedDate, 'dd/MM/yyyy')}`
                      : 'No hay registros sin reserva'
                    }
                  </p>
                  <p className="text-sm mt-2">
                    {esHoy ? 'Utiliza el contador para registrar personas' : 'Los walk-ins aparecerán aquí'}
                  </p>
                </td>
              </tr>
            ) : (
              registrosFiltrados.map((registro) => {
                // ✅ Parsear fecha manualmente para evitar problemas de zona horaria
                const [year, month, day] = registro.fecha.split('-').map(Number);
                const fechaObj = new Date(year, month - 1, day);
                const fechaFormateada = format(fechaObj, "dd/MM/yyyy", { locale: es });

                return (
                  <tr
                    key={registro.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {!selectedDate && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {fechaFormateada}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {registro.hora}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        👥 {registro.numeroPersonas} {registro.numeroPersonas === 1 ? 'persona' : 'personas'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {registro.notas || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        onClick={() => handleDelete(registro.id)}
                        disabled={deletingId === registro.id}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
