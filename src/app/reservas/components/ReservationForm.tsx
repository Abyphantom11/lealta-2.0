"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PromotorSearchOnly } from "./PromotorSearchOnly";
import { CedulaSearch } from "./CedulaSearch";

import { Reserva } from "../types/reservation";

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reserva: Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>) => void;
  selectedDate?: Date;
  selectedTime?: string;
  businessId: string; // ✅ NUEVO: businessId para cargar promotores
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
  promotorId: string; // ✅ Cambiado de "referencia" a "promotorId"
  promotorNombre: string; // ✅ Para mostrar el nombre seleccionado
}

export default function ReservationForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedDate, 
  selectedTime,
  businessId // ✅ NUEVO
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
    promotorId: '', // ✅ Vacío por defecto, el usuario debe seleccionar
    promotorNombre: '', // ✅ Nombre del promotor seleccionado
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clienteExistente, setClienteExistente] = useState<boolean>(false);

  // ✅ Manejar cuando se encuentra un cliente existente
  const handleClienteFound = (cliente: { id: string; cedula: string; nombre: string; email: string; telefono: string } | null) => {
    if (cliente) {
      // Cliente encontrado - Auto-llenar campos
      setClienteExistente(true);
      setFormData(prev => ({
        ...prev,
        clienteNombre: cliente.nombre,
        clienteCorreo: cliente.email,
        clienteTelefono: cliente.telefono,
      }));
    } else {
      // Cliente nuevo - Limpiar campos para permitir registro
      setClienteExistente(false);
      setFormData(prev => ({
        ...prev,
        clienteNombre: '',
        clienteCorreo: '',
        clienteTelefono: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Validación completa de campos obligatorios
    if (!formData.clienteNombre || 
        !formData.clienteCedula || 
        !formData.clienteCorreo || 
        !formData.clienteTelefono ||
        !formData.fecha || 
        !formData.hora || 
        !formData.promotorId) {
      toast.error('❌ Campos incompletos', {
        description: 'Complete todos los campos: Nombre, Cédula, Email, Teléfono, Fecha, Hora y Promotor'
      });
      return;
    }

    // ✅ Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.clienteCorreo)) {
      toast.error('❌ Email inválido', {
        description: 'Por favor ingrese un email válido'
      });
      return;
    }

    // ✅ Validar que teléfono tenga al menos 8 dígitos
    const digitosEnTelefono = formData.clienteTelefono.replace(/\D/g, '').length;
    if (digitosEnTelefono < 8) {
      toast.error('❌ Teléfono inválido', {
        description: 'El teléfono debe tener al menos 8 dígitos'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reservaData: Omit<Reserva, 'id' | 'codigoQR' | 'fechaCreacion' | 'registroEntradas'> = {
        cliente: {
          id: formData.clienteCedula, // ✅ Usar cédula real del formulario
          nombre: formData.clienteNombre,
          email: formData.clienteCorreo, // ✅ Obligatorio ahora
          telefono: formData.clienteTelefono // ✅ Obligatorio ahora
        },
        numeroPersonas: parseInt(formData.invitados) || 1, // El campo "invitados" es realmente el total de personas
        razonVisita: formData.servicio || "Reserva general",
        beneficiosReserva: "Sin observaciones", // Eliminar campo de observaciones
        promotor: {
          id: formData.promotorId, // ✅ Usar el ID del promotor seleccionado
          nombre: formData.promotorNombre // ✅ Usar el nombre del promotor seleccionado
        },
        promotorId: formData.promotorId, // ✅ NUEVO: Guardar el ID para la base de datos
        fecha: formData.fecha,
        hora: formData.hora,
        estado: 'En Progreso', // Estado amarillo por defecto
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
        promotorId: '', // ✅ Reset promotorId
        promotorNombre: '', // ✅ Reset promotorNombre
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
                disabled={clienteExistente}
                required
              />
              {clienteExistente && (
                <p className="text-xs text-green-600">
                  ✓ Datos del cliente registrado
                </p>
              )}
            </div>
            
            <CedulaSearch
              businessId={businessId}
              value={formData.clienteCedula}
              onChange={(cedula) => handleInputChange('clienteCedula', cedula)}
              onClienteFound={handleClienteFound}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clienteCorreo" className="text-sm font-medium text-gray-800">
                Correo Electrónico *
              </Label>
              <Input
                id="clienteCorreo"
                type="email"
                value={formData.clienteCorreo}
                onChange={(e) => handleInputChange('clienteCorreo', e.target.value)}
                placeholder="ejemplo@correo.com"
                className="min-h-[44px] text-gray-900 placeholder:text-gray-500"
                disabled={clienteExistente}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clienteTelefono" className="text-sm font-medium text-gray-800">
                Teléfono *
              </Label>
              <Input
                id="clienteTelefono"
                type="tel"
                value={formData.clienteTelefono}
                onChange={(e) => {
                  // ✅ Solo permitir números, guiones, espacios y símbolo + (para código de país)
                  const valor = e.target.value.replace(/[^\d\s\-+]/g, '');
                  handleInputChange('clienteTelefono', valor);
                }}
                placeholder="+507 6000-0000"
                className="min-h-[44px] text-gray-900 placeholder:text-gray-500"
                disabled={clienteExistente}
                required
                pattern="[\d\s\-+]+"
                title="Solo se permiten números, espacios, guiones y símbolo +"
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
            
            {/* ✅ Buscador de Promotores */}
            <div className="col-span-2">
              <PromotorSearchOnly
                businessId={businessId}
                value={formData.promotorId}
                onSelect={(promotorId, promotorNombre) => {
                  setFormData(prev => ({
                    ...prev,
                    promotorId,
                    promotorNombre,
                  }));
                }}
                label="Promotor"
                placeholder="Buscar promotor..."
                required={true}
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
