'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Clock, User, MapPin, MessageSquare, UserCheck } from "lucide-react";
import { Reserva, EstadoReserva } from "../types/reservation";

interface ReservationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva;
  onUpdate: (id: string, updates: Partial<Reserva>) => Promise<void>;
}

export function ReservationEditModal({ 
  isOpen, 
  onClose, 
  reserva,
  onUpdate 
}: ReservationEditModalProps) {
  const [hora, setHora] = useState(reserva.hora);
  const [estado, setEstado] = useState<EstadoReserva>(reserva.estado);
  const [mesa, setMesa] = useState(reserva.mesa || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const estadoOptions: EstadoReserva[] = ['En Progreso', 'Activa', 'En Camino', 'Reserva Caída'];

  const getEstadoColor = (estado: EstadoReserva) => {
    switch (estado) {
      case 'Activa': return 'text-green-600 bg-green-50 border-green-200';
      case 'En Progreso': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'En Camino': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Reserva Caída': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const updates: Partial<Reserva> = {};
      
      if (hora !== reserva.hora) updates.hora = hora;
      if (estado !== reserva.estado) updates.estado = estado;
      if (mesa !== reserva.mesa) updates.mesa = mesa;

      if (Object.keys(updates).length > 0) {
        await onUpdate(reserva.id, updates);
      }
      
      onClose();
    } catch (error) {
      console.error('Error actualizando reserva:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (confirm('¿Estás seguro de que quieres cancelar esta reserva?\\n\\nLa reserva se marcará como "Cancelada por el cliente".')) {
      setIsUpdating(true);
      try {
        await onUpdate(reserva.id, { 
          estado: 'Reserva Caída',
          razonVisita: 'Cancelado por el cliente'
        });
        onClose();
      } catch (error) {
        console.error('Error cancelando reserva:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Editar Reserva
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Información del cliente (solo lectura) */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">{reserva.cliente.nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{reserva.fecha}</span>
              <span>•</span>
              <span>{reserva.numeroPersonas} personas</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <UserCheck className="h-4 w-4" />
              <span>Promotor: {reserva.promotor?.nombre || 'Sistema'}</span>
            </div>
          </div>

          {/* Hora - Editable */}
          <div className="space-y-2">
            <Label htmlFor="hora" className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hora
            </Label>
            <Input
              id="hora"
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Mesa - Editable */}
          <div className="space-y-2">
            <Label htmlFor="mesa" className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Mesa
            </Label>
            <Input
              id="mesa"
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
              placeholder="Número de mesa"
              className="w-full"
            />
          </div>

          {/* Estado - Editable */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Estado
            </Label>
            <Select value={estado} onValueChange={(value: EstadoReserva) => setEstado(value)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(estado)}`}>
                    {estado}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {estadoOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(option)}`}>
                      {option}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Información adicional (solo lectura) */}
          {reserva.razonVisita && reserva.razonVisita !== 'Cancelado por el cliente' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Razón de visita:</span> {reserva.razonVisita}
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isUpdating}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              Cancelar Reserva
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
