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
  onSubmit: (reserva: Omit<Reserva, 'id'>) => void;
  selectedDate?: Date;
  selectedTime?: string;
}

interface FormData {
  clienteNombre: string;
  clienteCedula: string;
  clienteCorreo: string;
  clienteTelefono: string;
  numeroPersonas: string;
  fecha: string;
  hora: string;
  servicio: string;
  observaciones: string;
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
    numeroPersonas: '1',
    fecha: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    hora: selectedTime || '',
    servicio: '',
    observaciones: '',
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
      const reservaData: Omit<Reserva, 'id'> = {
        cliente: {
          id: `c-${Date.now()}`,
          nombre: formData.clienteNombre,
          email: formData.clienteCorreo,
          telefono: formData.clienteTelefono
        },
        numeroPersonas: parseInt(formData.numeroPersonas) || 1,
        razonVisita: formData.servicio || "Reserva general",
        beneficiosReserva: formData.observaciones || "Sin beneficios especiales",
        promotor: {
          id: "p-default",
          nombre: "Sistema"
        },
        fecha: formData.fecha,
        hora: formData.hora,
        codigoQR: '',
        asistenciaActual: 0,
        estado: 'Activa',
        fechaCreacion: new Date().toISOString(),
        registroEntradas: []
      };

      onSubmit(reservaData);
      
      // Reset form
      setFormData({
        clienteNombre: '',
        clienteCedula: '',
        clienteCorreo: '',
        clienteTelefono: '',
        numeroPersonas: '1',
        fecha: '',
        hora: '',
        servicio: '',
        observaciones: '',
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Nueva Reserva</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clienteNombre" className="text-sm font-medium text-gray-800">
                Nombre Completo *
              </Label>
              <Input
                id="clienteNombre"
                type="text"
                value={formData.clienteNombre}
                onChange={(e) => handleInputChange('clienteNombre', e.target.value)}
                placeholder="Ingrese el nombre completo"
                className="text-gray-900 placeholder:text-gray-500"
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
                className="text-gray-900 placeholder:text-gray-500"
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
                min={new Date().toISOString().split('T')[0]}
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
          
          <div className="space-y-2">
            <Label htmlFor="observaciones" className="text-sm font-medium text-gray-800">
              Observaciones
            </Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              placeholder="Comentarios adicionales, instrucciones especiales, etc..."
              className="min-h-[100px] resize-none text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-gray-600 hover:bg-gray-700 text-white border-0 disabled:bg-gray-400 disabled:text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-black hover:bg-gray-900 text-white border-0 disabled:bg-gray-400 disabled:text-white"
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
