"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

import { Reserva } from "../types/reservation";

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reserva: Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>) => void;
  selectedDate?: Date;
  selectedTime?: string;
}

interface FormData {
  clienteNombre: string;
  clienteCedula: string;
  clienteCorreo: string;
  clienteTelefono: string;
  invitados: string; // Este campo representa el total de personas
  fecha: string;
  hora: string;
  servicio: string;
  referencia: string;
}

export default function ReservationForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedDate, 
  selectedTime 
}: Readonly<ReservationFormProps>) {
  const [formData, setFormData] = useState<FormData>({
    clienteNombre: '',
    clienteCedula: '',
    clienteCorreo: '',
    clienteTelefono: '',
    invitados: '1', // Cambiar por defecto a 1 persona
    fecha: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    hora: selectedTime || '',
    servicio: '',
    referencia: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clienteNombre || !formData.clienteCedula || !formData.fecha || !formData.hora) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reservaData: Omit<Reserva, 'id' | 'codigoQR' | 'fechaCreacion' | 'registroEntradas'> = {
        cliente: {
          id: `c-${Date.now()}`,
          nombre: formData.clienteNombre,
          email: formData.clienteCorreo || undefined, // Permitir undefined para que el backend maneje
          telefono: formData.clienteTelefono
        },
        numeroPersonas: parseInt(formData.invitados) || 1, // El campo "invitados" es realmente el total de personas
        razonVisita: formData.servicio || "Reserva general",
        beneficiosReserva: "Sin observaciones", // Eliminar campo de observaciones
        promotor: {
          id: formData.referencia ? `p-${Date.now()}` : "p-default",
          nombre: formData.referencia || "Sistema" // Usar la referencia del formulario o "Sistema" por defecto
        },
        fecha: formData.fecha,
        hora: formData.hora,
        estado: 'En Espera', // Estado amarillo por defecto
        asistenciaActual: 0 // Iniciar en 0 porque nadie ha asistido aún
      };

      onSubmit(reservaData);
      
      // Reset form
      setFormData({
        clienteNombre: '',
        clienteCedula: '',
        clienteCorreo: '',
        clienteTelefono: '',
        invitados: '1', // Reset a 1 persona por defecto
        fecha: '',
        hora: '',
        servicio: '',
        referencia: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error al crear reserva:', error);
      alert('Error al crear la reserva. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] w-full max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto bg-white">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-lg sm:text-xl">Nueva Reserva</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clienteNombre" className="text-sm font-medium text-gray-800">
                Nombre Completo *
              </Label>
              <Input
                id="clienteNombre"
                type="text"
                value={formData.clienteNombre}
                onChange={(e) => handleInputChange('clienteNombre', e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="min-h-[44px] text-gray-900 placeholder:text-gray-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clienteCedula" className="text-sm font-medium text-gray-800">
                Cédula *
              </Label>
              <Input
                id="clienteCedula"
                type="text"
                value={formData.clienteCedula}
                onChange={(e) => handleInputChange('clienteCedula', e.target.value)}
                placeholder="0-0000-0000"
                className="min-h-[44px] text-gray-900 placeholder:text-gray-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clienteCorreo" className="text-sm font-medium text-gray-800">
                Correo Electrónico
              </Label>
              <Input
                id="clienteCorreo"
                type="email"
                value={formData.clienteCorreo}
                onChange={(e) => handleInputChange('clienteCorreo', e.target.value)}
                placeholder="ejemplo@correo.com"
                className="text-gray-900 placeholder:text-gray-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clienteTelefono" className="text-sm font-medium text-gray-800">
                Teléfono
              </Label>
              <Input
                id="clienteTelefono"
                type="tel"
                value={formData.clienteTelefono}
                onChange={(e) => handleInputChange('clienteTelefono', e.target.value)}
                placeholder="+506 8888-8888"
                className="text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha" className="text-sm font-medium text-gray-800">
                Fecha *
              </Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
                className="text-gray-900 placeholder:text-gray-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hora" className="text-sm font-medium text-gray-800">
                Hora *
              </Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => handleInputChange('hora', e.target.value)}
                className="text-gray-900 placeholder:text-gray-500"
                required
                step="1800"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invitados" className="text-sm font-medium text-gray-800">
                Total de Personas *
              </Label>
              <Input
                id="invitados"
                type="number"
                value={formData.invitados}
                onChange={(e) => handleInputChange('invitados', e.target.value)}
                placeholder="1"
                min="1"
                max="100"
                className="text-gray-900 placeholder:text-gray-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referencia" className="text-sm font-medium text-gray-800">
                Referencia
              </Label>
              <Input
                id="referencia"
                type="text"
                value={formData.referencia}
                onChange={(e) => handleInputChange('referencia', e.target.value)}
                className="text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Botones de acción optimizados para móvil */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="order-2 sm:order-1 min-h-[44px] bg-gray-600 hover:bg-gray-700 text-white border-0 disabled:bg-gray-400 disabled:text-white font-medium"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="order-1 sm:order-2 min-h-[44px] bg-black hover:bg-gray-900 text-white border-0 disabled:bg-gray-400 disabled:text-white font-medium"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </div>
              ) : (
                'Crear Reserva'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
