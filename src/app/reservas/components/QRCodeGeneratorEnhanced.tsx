"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Download, Copy, User, Calendar, Clock, Users, MapPin, RefreshCw, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import QRCode from "react-qr-code";
import { Reserva } from "../types/reservation";
import { toast } from "sonner";

interface QRCodeGeneratorProps {
  readonly reserva?: Reserva;
  readonly initialValue?: string;
}

export function QRCodeGeneratorEnhanced({ reserva, initialValue }: QRCodeGeneratorProps) {
  const [qrValue, setQrValue] = useState(initialValue || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Función para generar el código QR
  const handleGenerate = useCallback(() => {
    if (!qrValue) return;
    
    setIsGenerating(true);
    
    // Simulamos el tiempo de generación
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('✨ Código QR generado exitosamente', {
        className: 'bg-green-600 text-white border-0',
        style: {
          backgroundColor: '#16a34a !important',
          color: 'white !important',
          border: 'none !important',
        },
      });
    }, 500);
  }, [qrValue]);

  // Al abrir el componente, generamos automáticamente un código QR
  useEffect(() => {
    if (reserva) {
      setQrValue(`res-${reserva.id}`);
      setTimeout(() => handleGenerate(), 100);
    }
  }, [reserva, handleGenerate]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success('✅ Código QR copiado al portapapeles', {
        className: 'bg-green-600 text-white border-0',
        style: {
          backgroundColor: '#10b981 !important',
          color: 'white !important',
          border: 'none !important',
        },
      });
    } catch {
      toast.error('❌ Error al copiar al portapapeles', {
        className: 'bg-red-600 text-white border-0',
      });
    }
  };

  const handleDownload = () => {
    try {
      // Buscar el SVG del QR dentro del componente
      const qrContainer = qrRef.current;
      if (!qrContainer) {
        toast.error('❌ No se pudo encontrar el código QR');
        return;
      }

      const svg = qrContainer.querySelector('svg');
      if (!svg) {
        toast.error('❌ No se pudo encontrar el código QR');
        return;
      }

      // Crear un canvas para convertir el SVG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 400;
      canvas.height = 400;

      // Fondo blanco
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Crear imagen del SVG
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Dibujar la imagen centrada
        const size = 300;
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;
        ctx.drawImage(img, x, y, size, size);

        // Descargar
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `qr-reserva-${reserva?.cliente?.nombre?.replace(/\s+/g, '-') || 'reserva'}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast.success('⬇️ Código QR descargado exitosamente', {
            className: 'bg-blue-600 text-white border-0',
            style: {
              backgroundColor: '#3b82f6 !important',
              color: 'white !important',
              border: 'none !important',
            },
          });
        }, 'image/png');

        URL.revokeObjectURL(svgUrl);
      };
      img.src = svgUrl;
    } catch {
      toast.error('❌ Error al descargar el código QR', {
        className: 'bg-red-600 text-white border-0',
      });
    }
  };

  const generateQRBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      try {
        const qrContainer = qrRef.current;
        if (!qrContainer) {
          resolve(null);
          return;
        }

        const svg = qrContainer.querySelector('svg');
        if (!svg) {
          resolve(null);
          return;
        }

        // Crear un canvas para convertir el SVG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        canvas.width = 500;
        canvas.height = 600;

        // Fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Agregar información de la reserva
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 Tu Reserva', canvas.width / 2, 40);

        ctx.font = '18px Arial';
        ctx.fillText(`${reserva?.cliente?.nombre || 'Cliente'}`, canvas.width / 2, 70);
        
        ctx.font = '16px Arial';
        ctx.fillText(`📅 ${reserva?.fecha} ⏰ ${reserva?.hora}`, canvas.width / 2, 95);
        ctx.fillText(`👥 ${reserva?.numeroPersonas} personas`, canvas.width / 2, 115);

        // Crear imagen del SVG
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          // Dibujar el QR centrado
          const qrSize = 300;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 140;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

          // Agregar código QR texto
          ctx.font = '12px monospace';
          ctx.fillStyle = '#6b7280';
          ctx.fillText(`Código: ${qrValue}`, canvas.width / 2, qrY + qrSize + 30);

          // Instrucciones
          ctx.font = '14px Arial';
          ctx.fillStyle = '#374151';
          ctx.fillText('📱 Escanea este código al llegar', canvas.width / 2, qrY + qrSize + 60);

          // Convertir a blob
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(svgUrl);
            resolve(blob);
          }, 'image/png', 0.9);
        };

        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          resolve(null);
        };

        img.src = svgUrl;
      } catch {
        resolve(null);
      }
    });
  };

  const handleShare = async () => {
    try {
      // Generar la imagen del QR
      const qrBlob = await generateQRBlob();
      
      if (qrBlob && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([qrBlob], 'qr.png', { type: 'image/png' })] })) {
        // Compartir con Web Share API (incluyendo la imagen)
        const file = new File([qrBlob], `reserva-${reserva?.cliente?.nombre?.replace(/\s+/g, '-') || 'qr'}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `🎉 Reserva de ${reserva?.cliente?.nombre || 'Cliente'}`,
          text: `📅 ${reserva?.fecha} ⏰ ${reserva?.hora}\n👥 ${reserva?.numeroPersonas} personas\n\n📱 Escanea el código QR al llegar`,
          files: [file]
        });
        
        toast.success('💚 Reserva compartida por WhatsApp', {
          className: 'bg-green-600 text-white border-0',
          style: {
            backgroundColor: '#059669 !important',
            color: 'white !important',
            border: 'none !important',
          },
        });
      } else {
        // Fallback: Abrir WhatsApp Web con el texto
        const message = encodeURIComponent(
          `🎉 *Tu Reserva Confirmada*\n\n` +
          `👤 ${reserva?.cliente?.nombre || 'Cliente'}\n` +
          `📅 Fecha: ${reserva?.fecha}\n` +
          `⏰ Hora: ${reserva?.hora}\n` +
          `👥 Personas: ${reserva?.numeroPersonas}\n` +
          `🎯 Motivo: ${reserva?.razonVisita || 'Visita'}\n\n` +
          `� *Código QR:* ${qrValue}\n\n` +
          `✨ Instrucciones:\n` +
          `• Comparte este código con tus invitados\n` +
          `• Cada escaneo registra +1 persona\n` +
          `• Presenta el código al llegar\n\n` +
          `¡Nos vemos pronto! 🎉`
        );
        
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        toast.success('💚 Abriendo WhatsApp para compartir', {
          className: 'bg-green-600 text-white border-0',
          style: {
            backgroundColor: '#059669 !important',
            color: 'white !important',
            border: 'none !important',
          },
        });
      }
    } catch {
      // Último recurso: copiar al portapapeles
      try {
        const shareText = `🎉 Tu Reserva Confirmada\n\n` +
          `👤 ${reserva?.cliente?.nombre || 'Cliente'}\n` +
          `📅 ${reserva?.fecha} ⏰ ${reserva?.hora}\n` +
          `👥 ${reserva?.numeroPersonas} personas\n` +
          `📱 Código QR: ${qrValue}\n\n` +
          `✨ Escanea el código al llegar`;
        
        await navigator.clipboard.writeText(shareText);
        
        toast.success('📋 Información copiada para compartir', {
          className: 'bg-blue-600 text-white border-0',
          style: {
            backgroundColor: '#3b82f6 !important',
            color: 'white !important',
            border: 'none !important',
          },
        });
      } catch {
        toast.error('❌ Error al compartir', {
          className: 'bg-red-600 text-white border-0',
        });
      }
    }
  };

  // Función para formatear fecha y hora
  const formatFechaHora = (fecha: string, hora: string) => {
    // Crear fecha correctamente evitando problemas de zona horaria
    const fechaBase = fecha.includes('T') ? fecha.split('T')[0] : fecha;
    const fechaObj = new Date(`${fechaBase}T${hora}`);
    return fechaObj;
  };

  if (!reserva) return null;

  return (
    <div className="w-full space-y-3">
      {/* Layout en 2 columnas con Badge arriba */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-900">Código QR de la Reserva</h3>
        <Badge className="bg-blue-100 text-blue-800 text-xs">
          {typeof reserva.estado === 'string' ? reserva.estado : "Activa"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Columna izquierda: QR Code */}
        <div className="flex flex-col items-center space-y-3">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200" ref={qrRef}>
            {!isGenerating ? (
              <QRCode
                value={qrValue || "Sin datos"}
                size={200}
                level="H"
                className="w-full h-auto"
              />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          
          {/* Código QR texto */}
          <div className="w-full text-center">
            <p className="text-xs font-medium text-gray-600 mb-1">Código QR</p>
            <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded inline-block break-all font-mono max-w-full">
              {qrValue}
            </code>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-2 w-full">
            <Button 
              onClick={handleDownload} 
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button 
              onClick={handleShare} 
              size="sm" 
              className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-sm font-medium"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              onClick={handleCopyCode} 
              size="sm" 
              className="w-full bg-gray-600 hover:bg-gray-700 text-white h-9 text-sm font-medium"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
          </div>
        </div>

        {/* Columna derecha: Detalles de la Reserva */}
        <div className="flex flex-col space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Detalles de la Reserva</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{reserva.cliente?.nombre || 'Sin nombre'}</p>
                  {reserva.cliente?.telefono && (
                    <p className="text-xs text-gray-600">{reserva.cliente?.telefono}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <p className="font-medium text-gray-900">
                  {format(formatFechaHora(reserva.fecha, reserva.hora), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <p className="font-medium text-gray-900">{reserva.hora || 'Sin hora'}</p>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <p className="font-medium text-gray-900">
                  {typeof reserva.numeroPersonas === 'number' ? reserva.numeroPersonas : 0} personas
                </p>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{reserva.razonVisita || 'Reserva general'}</p>
                  {reserva.promotor && (
                    <p className="text-xs text-gray-600">Promotor: {reserva.promotor?.nombre || 'Sistema'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Beneficios (si existen) */}
          {reserva.beneficiosReserva && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-1">Beneficios</p>
              <p className="text-xs text-gray-600">{reserva.beneficiosReserva}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-blue-900 mb-1.5">Instrucciones para el Cliente</h4>
        <ul className="text-xs text-blue-800 space-y-0.5">
          <li>• Comparte este código QR con tus invitados</li>
          <li>• Cada escaneo registra +1 persona en tu reserva</li>
          <li>• Presenta el código al llegar al establecimiento</li>
        </ul>
      </div>
    </div>
  );
}
