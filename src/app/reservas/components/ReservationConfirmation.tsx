"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle } from "lucide-react";
import { QRCardShare } from "./QRCardShare";
import { Reserva } from "../types/reservation";
import { useParams } from "next/navigation";

interface ReservationConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva | null;
  onQRGenerated?: (qrData: string, qrToken: string) => void;
}

export function ReservationConfirmation({ 
  isOpen, 
  onClose, 
  reserva,
}: Readonly<ReservationConfirmationProps>) {
  const [showSuccess, setShowSuccess] = useState(false);
  const params = useParams();
  const businessNameOrId = params.businessId as string;
  const [actualBusinessId, setActualBusinessId] = useState<string>(businessNameOrId);

  // Resolver nombre de negocio a ID
  useEffect(() => {
    const resolveBusinessId = async () => {
      if (!businessNameOrId) return;
      
      // Si parece un ID (empieza con 'cm' y es largo), usarlo directamente
      if (businessNameOrId.startsWith('cm') && businessNameOrId.length > 20) {
        setActualBusinessId(businessNameOrId);
        return;
      }
      
      // Si parece un nombre, convertirlo a ID
      try {
        const response = await fetch(`/api/businesses/by-name/${encodeURIComponent(businessNameOrId)}`);
        if (response.ok) {
          const data = await response.json();
          setActualBusinessId(data.id);
        }
      } catch (error) {
        console.error('Error resolviendo businessId:', error);
      }
    };
    
    resolveBusinessId();
  }, [businessNameOrId]);

  useEffect(() => {
    if (isOpen && reserva) {
      setShowSuccess(true);
      // Auto-cerrar después de 30 segundos si no se hace nada
      const timer = setTimeout(() => {
        onClose();
      }, 30000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, reserva, onClose]);

  const handleClose = () => {
    setShowSuccess(false);
    onClose();
  };

  if (!reserva) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl rounded-lg p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            ¡Reserva Confirmada!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Mensaje de éxito */}
          {showSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Tu reserva ha sido confirmada exitosamente. Aquí tienes tu código QR de entrada.
              </AlertDescription>
            </Alert>
          )}
          
          {/* QR Card Personalizado */}
          <QRCardShare
            reserva={{
              id: reserva.id,
              cliente: {
                id: reserva.cliente.id,
                nombre: reserva.cliente.nombre,
                telefono: reserva.cliente.telefono || '',
                email: reserva.cliente.email || '',
              },
              fecha: reserva.fecha,
              hora: reserva.hora,
              numeroPersonas: reserva.numeroPersonas,
              razonVisita: reserva.razonVisita || 'Reserva',
              qrToken: reserva.codigoQR || `RES-${reserva.id}`,
            }}
            businessId={actualBusinessId}
          />
          
          {/* Botón de cierre */}
          <div className="flex justify-center pt-2">
            <button 
              onClick={handleClose} 
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
