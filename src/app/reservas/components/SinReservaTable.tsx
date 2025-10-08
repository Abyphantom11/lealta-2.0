'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SinReserva } from '../types/sin-reserva';

interface SinReservaTableProps {
  registros: SinReserva[];
  onDelete: (id: string) => void;
}

export function SinReservaTable({ registros, onDelete }: SinReservaTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      {/* Contenedor con altura fija y scroll */}
      <div className="overflow-auto" style={{ maxHeight: '600px', minHeight: '600px' }}>
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Fecha
              </th>
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
            {registros.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">
                  <p className="text-lg">No hay registros sin reserva</p>
                  <p className="text-sm mt-2">Los walk-ins aparecerán aquí</p>
                </td>
              </tr>
            ) : (
              registros.map((registro) => {
                // ✅ Parsear fecha manualmente para evitar problemas de zona horaria
                const [year, month, day] = registro.fecha.split('-').map(Number);
                const fechaObj = new Date(year, month - 1, day);
                const fechaFormateada = format(fechaObj, "dd/MM/yyyy", { locale: es });

                return (
                  <tr
                    key={registro.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {fechaFormateada}
                    </td>
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
