"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Download, Copy, User, Calendar, Clock, Users, MapPin, X, Share2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import QRCode from "react-qr-code";
import { Reserva } from "../types/reservation";
import { toast } from "sonner";

interface QRCodeMobileCompactProps {
  readonly reserva?: Reserva;
  readonly initialValue?: string;
  readonly onClose?: () => void;
}

export function QRCodeMobileCompact({ reserva, initialValue, onClose }: QRCodeMobileCompactProps) {
  const [qrValue, setQrValue] = useState(initialValue || "");
  const qrRef = useRef<HTMLDivElement>(null);

  // Función auxiliar para formatear fecha y hora
  const formatFechaHora = (fecha: string, hora: string) => {
    try {
      const fechaObj = new Date(fecha);
      const [hours, minutes] = hora.split(':');
      fechaObj.setHours(parseInt(hours), parseInt(minutes));
      return fechaObj;
    } catch {
      return new Date();
    }
  };

  // Al abrir el componente, generamos automáticamente un código QR
  useEffect(() => {
    if (reserva) {
      setQrValue(`res-${reserva.id}`);
    }
  }, [reserva]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success('✅ Código copiado', {
        duration: 2000,
      });
    } catch {
      toast.error('❌ Error al copiar');
    }
  };

  const handleShare = async () => {
    if (!reserva) return;
    
    try {
      // Crear el texto para compartir
      const shareText = `🎯 Reserva Confirmada - ${reserva.cliente?.nombre || 'Cliente'}
      
📅 Fecha: ${format(formatFechaHora(reserva.fecha, reserva.hora), "dd/MM/yyyy", { locale: es })}
⏰ Hora: ${reserva.hora}
👥 Personas: ${reserva.numeroPersonas || 0}
${reserva.razonVisita ? `📍 Servicio: ${reserva.razonVisita}` : ''}

🔗 Código QR: ${qrValue}

Presenta este código QR al llegar al establecimiento.`;

      // Verificar si el navegador soporta Web Share API
      if (navigator.share) {
        await navigator.share({
          title: 'Reserva Confirmada',
          text: shareText,
        });
        toast.success('✅ Reserva compartida');
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(shareText);
        toast.success('✅ Información copiada para compartir');
      }
    } catch {
      // Si falla, intentar copiar al portapapeles
      try {
        const shareText = `Reserva: ${reserva.cliente?.nombre || 'Cliente'} - ${format(formatFechaHora(reserva.fecha, reserva.hora), "dd/MM/yyyy", { locale: es })} ${reserva.hora} - Código: ${qrValue}`;
        await navigator.clipboard.writeText(shareText);
        toast.success('✅ Información copiada');
      } catch {
        toast.error('❌ Error al compartir');
      }
    }
  };

  const handleDownload = () => {
    try {
      const qrContainer = qrRef.current;
      if (!qrContainer) {
        toast.error('❌ Error al descargar');
        return;
      }

      const svg = qrContainer.querySelector('svg');
      if (!svg) {
        toast.error('❌ Error al descargar');
        return;
      }

      // Crear canvas para convertir SVG a imagen
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 300;
      canvas.height = 300;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 300, 300);
        
        const link = document.createElement('a');
        link.download = `qr-reserva-${reserva?.id || 'codigo'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        URL.revokeObjectURL(svgUrl);
        toast.success('✅ QR descargado');
      };
      img.src = svgUrl;
    } catch (error) {
      console.error('Error al descargar QR:', error);
      toast.error('❌ Error al descargar');
    }
  };

  if (!reserva) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center p-0">
      <div className="bg-white dark:bg-gray-800 w-full max-h-[90vh] overflow-y-auto rounded-t-2xl animate-slide-up">
        {/* Header compacto */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Código QR</h2>
          <Button 
            onClick={onClose}
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* QR Code - Centrado y compacto */}
          <div className="flex justify-center">
            <div 
              ref={qrRef}
              className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
            >
              <QRCode
                value={qrValue}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "200px" }}
                viewBox="0 0 256 256"
              />
            </div>
          </div>

          {/* Código de texto */}
          <div className="text-center">
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
              {qrValue}
            </p>
          </div>

          {/* Botones de acción - Incluye compartir */}
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              <span className="text-xs">Bajar</span>
            </Button>
            <Button 
              onClick={handleCopyCode}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Copy className="h-4 w-4" />
              <span className="text-xs">Copiar</span>
            </Button>
            <Button 
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Compartir</span>
            </Button>
          </div>

          {/* Detalles de la reserva - Ultra compacto */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Detalles</h3>
            
            {/* Info en grid compacto */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{reserva.cliente?.nombre || 'Sin nombre'}</span>
                </div>
                {reserva.cliente?.telefono && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{reserva.cliente.telefono}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {format(formatFechaHora(reserva.fecha, reserva.hora), "dd/MM/yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{reserva.hora}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{reserva.numeroPersonas || 0} personas</span>
                </div>
                <Badge 
                  variant={reserva.estado === 'Activa' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {reserva.estado}
                </Badge>
              </div>

              {reserva.razonVisita && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{reserva.razonVisita}</span>
                </div>
              )}

              {reserva.promotor?.nombre && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Promotor: {reserva.promotor.nombre}
                </div>
              )}
            </div>
          </div>

          {/* Instrucciones compactas */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
              <strong>Instrucciones para el Cliente:</strong><br />
              Presenta este código QR al personal del establecimiento para confirmar tu asistencia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
