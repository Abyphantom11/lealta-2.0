"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
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
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const params = useParams();
  const businessSlug = (params?.businessId as string) || '';

  // Resolver nombre de negocio a ID si es necesario
  useEffect(() => {
    if (!businessSlug) {
      console.warn('⚠️ No businessSlug found in params');
    }
  }, [businessSlug]);

  // Manejar auto-cierre con pausa cuando el usuario interactúa
  useEffect(() => {
    if (isOpen && reserva) {
      setShowSuccess(true);
      
      // Solo crear timer si el usuario NO está interactuando
      if (!isUserInteracting) {
        timerRef.current = setTimeout(() => {
          onClose();
        }, 30000);
      }
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [isOpen, reserva, onClose, isUserInteracting]);

  // Callback para cuando el usuario abre/cierra el modal de configuración
  const handleUserInteraction = (isInteracting: boolean) => {
    setIsUserInteracting(isInteracting);
    
    // Si deja de interactuar, reiniciar el timer
    if (!isInteracting && isOpen && reserva) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        onClose();
      }, 30000);
    } else if (isInteracting && timerRef.current) {
      // Si empieza a interactuar, cancelar el timer
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    onClose();
  };

  if (!reserva) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm sm:max-w-md bg-white border border-gray-200 shadow-xl rounded-lg max-h-[85vh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            ¡Reserva Confirmada!
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Tu reserva ha sido confirmada exitosamente. Aquí tienes tu código QR de entrada.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
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
          {businessSlug ? (
            <QRCardShare
              reserva={{
                id: reserva.id,
                cliente: {
                  id: reserva.cliente?.id || '',
                  nombre: reserva.cliente?.nombre || 'Sin nombre',
                  telefono: reserva.cliente?.telefono || '',
                  email: reserva.cliente?.email || '',
                },
                fecha: reserva.fecha,
                hora: reserva.hora,
                numeroPersonas: reserva.numeroPersonas,
                razonVisita: reserva.razonVisita || 'Reserva',
                qrToken: reserva.codigoQR || `RES-${reserva.id}`,
              }}
              businessId={businessSlug}
              onUserInteraction={handleUserInteraction}
            />
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                ⚠️ No se pudo cargar la configuración del QR. Contacta con soporte.
              </p>
            </div>
          )}
          
          {/* Botón de cierre */}
          <div className="flex justify-center pt-1">
            <button 
              onClick={handleClose} 
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
