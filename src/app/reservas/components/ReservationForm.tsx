"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PromotorSearchOnly } from "./PromotorSearchOnly";
import { CedulaSearch } from "./CedulaSearch";
import { Zap } from "lucide-react";

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
  const [isExpressMode, setIsExpressMode] = useState(false); // 🆕 Estado para modo express
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

  // 🆕 Toggle modo express
  const toggleExpressMode = () => {
    setIsExpressMode(!isExpressMode);
    // Limpiar campos cuando cambiamos de modo
    if (!isExpressMode) {
      // Activando modo express - limpiar campos no necesarios
      setFormData(prev => ({
        ...prev,
        clienteCedula: 'EXPRESS',
        clienteCorreo: 'express@reserva.local',
        clienteTelefono: '',
      }));
    } else {
      // Desactivando modo express - limpiar todo
      setFormData(prev => ({
        ...prev,
        clienteCedula: '',
        clienteCorreo: '',
        clienteTelefono: '',
      }));
    }
  };

  // ✅ Manejar cuando se encuentra un cliente existente
  const handleClienteFound = (cliente: { id: string; cedula: string; nombre: string; email: string; telefono: string } | null) => {
    if (cliente) {
      // Cliente encontrado - Auto-llenar campos (asegurar strings)
      setClienteExistente(true);
      setFormData(prev => ({
        ...prev,
        clienteNombre: cliente.nombre || '',
        clienteCorreo: cliente.email || '',
        clienteTelefono: cliente.telefono || '',
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
    
    // 🆕 Correo por defecto si no se proporciona
    const DEFAULT_EMAIL = 'noemail@reserva.local';
    
    // 🆕 Validación diferente según el modo
    if (isExpressMode) {
      // Modo Express - Solo validar nombre, fecha, hora y promotor
      if (!formData.clienteNombre || 
          !formData.fecha || 
          !formData.hora || 
          !formData.promotorId) {
        toast.error('❌ Campos incompletos (Express)', {
          description: 'Complete: Nombre, Fecha, Hora y Promotor'
        });
        return;
      }
    } else {
      // Modo Normal - Validación SIN email obligatorio
      if (!formData.clienteNombre || 
          !formData.clienteCedula || 
          !formData.clienteTelefono ||
          !formData.fecha || 
          !formData.hora || 
          !formData.promotorId) {
        toast.error('❌ Campos incompletos', {
          description: 'Complete: Nombre, Cédula, Teléfono, Fecha, Hora y Promotor'
        });
        return;
      }

      // ✅ Validar formato de email SOLO si se proporciona
      if (formData.clienteCorreo && formData.clienteCorreo.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.clienteCorreo)) {
          toast.error('❌ Email inválido', {
            description: 'Por favor ingrese un email válido o déjelo vacío'
          });
          return;
        }
      }

      // ✅ Validar que teléfono tenga al menos 8 dígitos (solo modo normal)
      const digitosEnTelefono = formData.clienteTelefono.replace(/\D/g, '').length;
      if (digitosEnTelefono < 8) {
        toast.error('❌ Teléfono inválido', {
          description: 'El teléfono debe tener al menos 8 dígitos'
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // 🆕 Email por defecto si está vacío
      const DEFAULT_EMAIL = 'noemail@reserva.local';
      const emailToUse = isExpressMode 
        ? 'express@reserva.local' 
        : (formData.clienteCorreo?.trim() || DEFAULT_EMAIL);
      
      // 🆕 Datos según el modo
      const reservaData: Omit<Reserva, 'id' | 'codigoQR' | 'fechaCreacion' | 'registroEntradas'> = {
        cliente: {
          id: isExpressMode ? 'EXPRESS' : formData.clienteCedula,
          nombre: formData.clienteNombre,
          email: emailToUse, // ✅ Usa email por defecto si está vacío
          telefono: isExpressMode ? 'N/A' : formData.clienteTelefono // 🆕 N/A para express
        },
        numeroPersonas: Number.parseInt(formData.invitados) || 1,
        razonVisita: isExpressMode ? "⚡ Reserva Express" : (formData.servicio || "Reserva general"), // 🆕 Identificador
        beneficiosReserva: "Sin observaciones",
        promotor: {
          id: formData.promotorId,
          nombre: formData.promotorNombre
        },
        promotorId: formData.promotorId,
        fecha: formData.fecha,
        hora: formData.hora,
        estado: 'En Progreso',
        asistenciaActual: 0
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
      <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl max-h-[95vh] overflow-y-auto bg-white p-3 sm:p-4 md:p-6">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-lg sm:text-xl">Nueva Reserva</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Complete la información para crear una nueva reserva. Los campos marcados con * son obligatorios.
          </DialogDescription>
          <div className="flex items-center justify-between">
            <div></div> {/* Espaciador */}
            <Button
              type="button"
              onClick={toggleExpressMode}
              variant={isExpressMode ? "default" : "outline"}
              size="sm"
              className={isExpressMode ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
            >
              <Zap className="w-4 h-4 mr-1" />
              Express
            </Button>
          </div>
          {isExpressMode && (
            <p className="text-sm text-yellow-600">
              ⚡ Modo rápido: solo nombre, fecha, hora y promotor
            </p>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 🔄 PRIMERO: Cédula (solo si no es modo express) */}
          {!isExpressMode && (
            <CedulaSearch
              businessId={businessId}
              value={formData.clienteCedula}
              onChange={(cedula) => handleInputChange('clienteCedula', cedula)}
              onClienteFound={handleClienteFound}
            />
          )}
          
          {/* 🔄 SEGUNDO: Nombre */}
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
          
          {!isExpressMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clienteCorreo" className="text-sm font-medium text-gray-800">
                  Correo Electrónico (opcional)
                </Label>
                <Input
                  id="clienteCorreo"
                  type="email"
                  value={formData.clienteCorreo}
                  onChange={(e) => handleInputChange('clienteCorreo', e.target.value)}
                  placeholder="Opcional: ejemplo@correo.com"
                  className="min-h-[44px] text-gray-900 placeholder:text-gray-500"
                  disabled={clienteExistente}
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
          )}

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
