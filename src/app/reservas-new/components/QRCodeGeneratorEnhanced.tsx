"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Download, Share2, Copy, User, Calendar, Clock, Users, MapPin, RefreshCw } from "lucide-react";
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrValue);
    toast.success('✅ Código QR copiado al portapapeles', {
      className: 'bg-green-600 text-white border-0',
      style: {
        backgroundColor: '#10b981 !important',
        color: 'white !important',
        border: 'none !important',
      },
    });
  };

  const handleDownload = () => {
    // Simulación de descarga
    toast.success('⬇️ Código QR descargado exitosamente', {
      className: 'bg-blue-600 text-white border-0',
      style: {
        backgroundColor: '#3b82f6 !important',
        color: 'white !important',
        border: 'none !important',
      },
    });
  };

  const handleShare = () => {
    // Simulación de compartir
    toast.success('📤 Código QR compartido correctamente', {
      className: 'bg-green-600 text-white border-0',
      style: {
        backgroundColor: '#059669 !important',
        color: 'white !important',
        border: 'none !important',
      },
    });
  };

  // Función para formatear fecha y hora
  const formatFechaHora = (fecha: string, hora: string) => {
    const fechaObj = new Date(`${fecha}T${hora}`);
    return fechaObj;
  };

  if (!reserva) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Header con estado */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Código QR de la Reserva</h2>
        <Badge className="bg-blue-100 text-blue-800 text-sm">
          {typeof reserva.estado === 'string' ? reserva.estado : "Activa"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* QR Code - Más compacto */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardContent className="p-4 text-center">
              <div className="bg-white p-3 rounded-lg border inline-block">
                {!isGenerating ? (
                  <QRCode
                    id="qr-code"
                    value={qrValue || "Sin datos"}
                    size={140}
                    level="H"
                    className="w-full h-auto max-w-[140px] mx-auto"
                  />
                ) : (
                  <div className="w-[140px] h-[140px] flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-700">Código QR</p>
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded block break-all font-mono">
                  {qrValue}
                </code>
              </div>

              <div className="flex gap-2 mt-3 justify-center">
                <Button 
                  onClick={handleDownload} 
                  size="sm" 
                  className="w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 text-white border-0"
                  title="Descargar QR"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={handleShare} 
                  size="sm" 
                  className="w-10 h-10 p-0 bg-green-600 hover:bg-green-700 text-white border-0"
                  title="Compartir QR"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={handleCopyCode} 
                  size="sm" 
                  className="w-10 h-10 p-0 bg-gray-600 hover:bg-gray-700 text-white border-0"
                  title="Copiar código"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información de la Reserva - Más compacta */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Detalles de la Reserva</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{reserva.cliente?.nombre || 'Sin nombre'}</p>
                    {reserva.cliente?.telefono && (
                      <p className="text-xs text-gray-600">{reserva.cliente.telefono}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-xs">
                      {format(formatFechaHora(reserva.fecha, reserva.hora), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{reserva.hora || 'Sin hora'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {typeof reserva.numeroPersonas === 'number' ? reserva.numeroPersonas : 0} personas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{reserva.razonVisita || 'Sin especificar'}</p>
                    {reserva.promotor && (
                      <p className="text-xs text-gray-600">Promotor: {reserva.promotor?.nombre || 'Sin nombre'}</p>
                    )}
                  </div>
                </div>
              </div>

              {reserva.beneficiosReserva && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="font-medium text-gray-900 text-sm mb-1">Beneficios</p>
                  <p className="text-xs text-gray-600">{reserva.beneficiosReserva}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Instrucciones - Más compactas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-medium text-blue-900 text-sm mb-2">Instrucciones para el Cliente</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Comparte este código QR con tus invitados</li>
          <li>• Cada escaneo registra +1 persona en tu reserva</li>
          <li>• Presenta el código al llegar al establecimiento</li>
        </ul>
      </div>
    </div>
  );
}
