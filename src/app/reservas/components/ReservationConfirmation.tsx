"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle, X } from "lucide-react";
import { QRGenerator } from "./QRGenerator";
import { QRCodeGeneratorEnhanced } from "./QRCodeGeneratorEnhanced";
import { Reserva } from "../types/reservation";

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
  onQRGenerated 
}: Readonly<ReservationConfirmationProps>) {
  const [showSuccess, setShowSuccess] = useState(false);

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
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              ¡Reserva Confirmada!
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
          
          {/* Generador de QR */}
          {/* QRGenerator original */}
          {/* <QRGenerator
            reservaId={reserva.id}
            cliente={reserva.cliente.nombre}
            fecha={reserva.fecha}
            hora={reserva.hora}
            servicio={reserva.promotor.nombre}
            onQRGenerated={onQRGenerated}
          /> */}
          
          {/* QRCodeGeneratorEnhanced para comparación */}
          <QRCodeGeneratorEnhanced
            reserva={reserva}
            initialValue={`res-${reserva.id}`}
          />
          
          {/* Botón de cierre */}
          <div className="flex justify-center pt-2">
            <Button onClick={handleClose} className="w-full">
              Entendido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
