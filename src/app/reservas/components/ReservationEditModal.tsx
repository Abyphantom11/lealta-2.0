'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Clock, User, MapPin, MessageSquare, UserCheck, Plus, X, Upload } from "lucide-react";
import { Reserva, EstadoReserva } from "../types/reservation";
import ComprobanteUploadModal from "./ComprobanteUploadModal";
import { toast } from "sonner";

interface ReservationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva;
  businessId?: string;
  onUpdate: (id: string, updates: Partial<Reserva>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function ReservationEditModal({ 
  isOpen, 
  onClose, 
  reserva,
  businessId,
  onUpdate,
  onDelete 
}: Readonly<ReservationEditModalProps>) {
  // 🎯 ESTRATEGIA DIRECTA: Usar directamente las props como fuente de verdad
  const [hora, setHora] = useState(reserva.hora);
  const [estado, setEstado] = useState<EstadoReserva>(reserva.estado);
  const [mesa, setMesa] = useState(reserva.mesa || '');
  const [detalles, setDetalles] = useState<string[]>(reserva.detalles || []);
  const [nuevoDetalle, setNuevoDetalle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [userIsEditing, setUserIsEditing] = useState(false);

  // Estados para el modal de comprobantes
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(
    reserva.comprobanteUrl || null
  );

  // 🔄 EFECTO SIMPLE Y DIRECTO: Solo sincronizar cuando cambien las props
  useEffect(() => {
    // 🔒 DESHABILITAR SINCRONIZACIÓN DURANTE GUARDADO PARA EVITAR REVERSIONES
    if (!userIsEditing && !isUpdating) {
      setHora(reserva.hora);
      setEstado(reserva.estado);
      setMesa(reserva.mesa || '');
      setDetalles(reserva.detalles || []);
      // Sincronizar URL del comprobante
      setComprobanteUrl(reserva.comprobanteUrl || null);
    }
  }, [reserva.hora, reserva.estado, reserva.mesa, JSON.stringify(reserva.detalles), reserva.comprobanteUrl]);

  // 📎 Funciones para manejar comprobantes
  const handleUploadComprobante = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/reservas/${reserva.id}/comprobante`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir comprobante');
      }

      const data = await response.json();
      setComprobanteUrl(data.url);
      toast.success('✅ Comprobante subido exitosamente');
      
      return data.url;
    } catch (error: any) {
      console.error('Error al subir comprobante:', error);
      toast.error(`❌ ${error.message}`);
      throw error;
    }
  };

  const handleRemoveComprobante = async () => {
    try {
      const response = await fetch(`/api/reservas/${reserva.id}/comprobante`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar comprobante');
      }

      setComprobanteUrl(null);
      toast.success('✅ Comprobante eliminado');
    } catch (error: any) {
      console.error('Error al eliminar comprobante:', error);
      toast.error('❌ Error al eliminar comprobante');
      throw error;
    }
  };

  // 🔄 Listener para actualizaciones forzadas desde escritorio - TEMPORALMENTE DESHABILITADO
  useEffect(() => {
    // Event listener deshabilitado para producción
  }, [reserva.id]);  const estadoOptions: EstadoReserva[] = ['En Progreso', 'Activa', 'En Camino', 'Reserva Caída', 'Cancelado'];

  const getEstadoColor = (estado: EstadoReserva) => {
    switch (estado) {
      case 'Activa': return 'text-green-600 bg-green-50 border-green-200';
      case 'En Progreso': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'En Camino': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Reserva Caída': return 'text-red-600 bg-red-50 border-red-200';
      case 'Cancelado': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Funciones para manejar detalles
  const agregarDetalle = () => {
    if (nuevoDetalle.trim()) {
      setDetalles([...detalles, nuevoDetalle.trim()]);
      setNuevoDetalle('');
    }
  };

  const actualizarDetalle = (index: number, valor: string) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = valor;
    setDetalles(nuevosDetalles);
  };

  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(nuevosDetalles);
  };

  const handleSave = async () => {
    setIsUpdating(true);
    
    // 🔒 Deshabilitar sincronización durante guardado
    setUserIsEditing(true);
    
    try {
      const updates: Partial<Reserva> = {
        hora,
        estado,
        mesa,
        detalles
      };

      // 🎯 Ejecutar actualización
      await onUpdate(reserva.id, updates);
      
      // 🎯 Esperar un momento antes de cerrar
      await new Promise(resolve => setTimeout(resolve, 200));
      
      onClose();
      
    } catch (error) {
      console.error('❌ Error guardando desde modal:', error);
      setUserIsEditing(false); // Re-habilitar sincronización en caso de error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar esta reserva?\\n\\nEsta acción no se puede deshacer.')) {
      setIsUpdating(true);
      try {
        if (onDelete) {
          await onDelete(reserva.id);
        } else {
          // Fallback: cambiar estado si no hay función de eliminación
          await onUpdate(reserva.id, { 
            estado: 'Reserva Caída',
            razonVisita: 'Cancelado por el cliente'
          });
        }
        onClose();
      } catch (error) {
        console.error('Error eliminando reserva:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto bg-white z-50 max-h-[90vh] overflow-y-auto p-4 rounded-lg shadow-xl border-0 sm:max-w-lg">
        <DialogHeader className="pb-4">
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
              key={`hora-${reserva.id}-${reserva.hora}`} // 🔑 Key basada en prop hora para forzar re-render
              id="hora"
              type="time"
              value={userIsEditing ? hora : reserva.hora} // 🎯 Usar prop directamente cuando no se edita
              onChange={(e) => {
                setHora(e.target.value);
              }}
              onFocus={() => {
                setUserIsEditing(true);
                setHora(reserva.hora);
              }}
              onBlur={() => {
                // NO desactivar userIsEditing inmediatamente para evitar interferencia
                // setTimeout(() => setUserIsEditing(false), 100);
              }}
              className="w-full"
              disabled={isUpdating}
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
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(estado)}`}>
                    {estado}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                {estadoOptions.map((option) => (
                  <SelectItem key={option} value={option} className="bg-white hover:bg-gray-50">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(option)}`}>
                      {option}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Detalles - Editable */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Detalles
            </Label>
            
            {/* Lista de detalles existentes */}
            {detalles.length > 0 && (
              <div className="space-y-2">
                {detalles.map((detalle, index) => (
                  <div key={`${detalle}-${index}`} className="flex items-center gap-2">
                    <Input
                      value={detalle}
                      onChange={(e) => actualizarDetalle(index, e.target.value)}
                      className="flex-1 text-sm bg-white border-gray-300"
                      placeholder="Detalle..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => eliminarDetalle(index)}
                      className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Campo para agregar nuevo detalle */}
            <div className="flex items-center gap-2">
              <Input
                value={nuevoDetalle}
                onChange={(e) => setNuevoDetalle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nuevoDetalle.trim()) {
                    e.preventDefault();
                    agregarDetalle();
                  }
                }}
                className="flex-1 text-sm bg-white border-gray-300"
                placeholder="Agregar nuevo detalle..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={agregarDetalle}
                disabled={!nuevoDetalle.trim()}
                className="h-8 w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Comprobante de Pago - Nueva sección */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Comprobante de Pago
            </Label>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadModal(true)}
                className={`flex-1 min-h-[44px] text-sm border-2 transition-all ${
                  comprobanteUrl 
                    ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' 
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Upload className="mr-2 h-4 w-4" />
                {comprobanteUrl ? 'Ver/Cambiar Comprobante' : 'Subir Comprobante'}
              </Button>
            </div>
            
            {comprobanteUrl && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-700 font-medium">
                  ✓ Comprobante de pago registrado
                </span>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3 pt-6">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isUpdating}
              className="flex-1 min-h-[44px] border-red-200 text-red-600 hover:bg-red-50 font-medium"
            >
              Eliminar Reserva
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal para subir comprobante */}
      <ComprobanteUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadComprobante}
        onRemoveComprobante={handleRemoveComprobante}
        reservaId={reserva.id}
        clienteNombre={reserva.cliente.nombre}
        comprobanteExistente={comprobanteUrl}
      />
    </Dialog>
  );
}
