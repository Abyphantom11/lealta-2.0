"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Download, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import QRCard from "./QRCard";
import html2canvas from 'html2canvas';

// Tipo compatible con ambas interfaces de Reserva
interface QRCardReserva {
  id: string;
  cliente: {
    id: string;
    nombre: string;
    telefono?: string;
    email?: string;
  };
  fecha: string;
  hora: string;
  numeroPersonas: number;
  razonVisita?: string;
  qrToken: string;
}

interface QRCardShareProps {
  readonly reserva: QRCardReserva;
  readonly businessId: string;
}

export function QRCardShare({ reserva, businessId }: QRCardShareProps) {
  const [businessName, setBusinessName] = useState('Mi Negocio');
  const [cardDesign, setCardDesign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const qrCardRef = useRef<HTMLDivElement>(null);

  // Cargar configuración del negocio
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('🔵 QRCardShare: Cargando config para businessId:', businessId);
        const response = await fetch(`/api/business/${businessId}/qr-branding`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔵 QRCardShare: Respuesta del API:', data);
          
          if (data.data?.businessName) {
            console.log('✅ businessName:', data.data.businessName);
            setBusinessName(data.data.businessName);
          }
          if (data.data?.cardDesign) {
            console.log('✅ cardDesign:', data.data.cardDesign);
            setCardDesign(data.data.cardDesign);
          } else {
            console.log('⚠️ No hay cardDesign, usando diseño por defecto');
            // Diseño por defecto (Elegante)
            setCardDesign({
              backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
              borderColor: '#2a2a2a',
              borderWidth: 1,
              borderRadius: 20,
              padding: 40,
              shadowColor: '#000000',
              shadowSize: 'xl',
              headerColor: '#ffffff',
              textColor: '#9ca3af',
            });
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        // Usar diseño por defecto
        setCardDesign({
          backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          borderColor: '#2a2a2a',
          borderWidth: 1,
          borderRadius: 20,
          padding: 40,
          shadowColor: '#000000',
          shadowSize: 'xl',
          headerColor: '#ffffff',
          textColor: '#9ca3af',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [businessId]);

  // Generar imagen del QR Card
  const generateQRCardImage = async (): Promise<Blob | null> => {
    if (!qrCardRef.current) return null;

    try {
      const canvas = await html2canvas(qrCardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error generando imagen:', error);
      return null;
    }
  };

  // Descargar imagen
  const handleDownload = async () => {
    try {
      const blob = await generateQRCardImage();
      if (!blob) {
        toast.error('❌ Error al generar la imagen');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reserva-${reserva.cliente?.nombre?.replace(/\s+/g, '-') || 'qr'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('✅ Imagen descargada exitosamente', {
        className: 'bg-green-600 text-white border-0',
      });
    } catch (error) {
      console.error('Error al descargar:', error);
      toast.error('❌ Error al descargar la imagen');
    }
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = async () => {
    setIsSharing(true);
    try {
      const blob = await generateQRCardImage();
      
      if (!blob) {
        toast.error('❌ Error al generar la imagen');
        return;
      }

      const file = new File(
        [blob], 
        `reserva-${reserva.cliente?.nombre?.replace(/\s+/g, '-') || 'qr'}.png`, 
        { type: 'image/png' }
      );

      // Intentar compartir con Web Share API (móviles)
      if (navigator.share && 'canShare' in navigator && (navigator as any).canShare({ files: [file] })) {
        await navigator.share({
          title: `🎉 Reserva de ${reserva.cliente?.nombre || 'Cliente'}`,
          text: `📅 ${reserva.fecha} ⏰ ${reserva.hora}\n👥 ${reserva.numeroPersonas} personas\n\n📱 Presenta este código QR al llegar`,
          files: [file]
        });

        toast.success('💚 Reserva compartida exitosamente', {
          className: 'bg-green-600 text-white border-0',
        });
      } else {
        // Fallback: Descargar la imagen y abrir WhatsApp con texto
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reserva-${reserva.cliente?.nombre?.replace(/\s+/g, '-') || 'qr'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const message = encodeURIComponent(
          `🎉 *Tu Reserva Confirmada*\n\n` +
          `👤 ${reserva.cliente?.nombre || 'Cliente'}\n` +
          `📅 Fecha: ${reserva.fecha}\n` +
          `⏰ Hora: ${reserva.hora}\n` +
          `👥 Personas: ${reserva.numeroPersonas}\n` +
          `🎯 Motivo: ${reserva.razonVisita || 'Visita'}\n\n` +
          `📱 *La imagen del QR se descargó automáticamente*\n\n` +
          `✨ Instrucciones:\n` +
          `• Adjunta la imagen descargada en WhatsApp\n` +
          `• Comparte con tus invitados\n` +
          `• Presenta el código al llegar\n\n` +
          `¡Nos vemos pronto! 🎉`
        );

        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');

        toast.success('💚 Imagen descargada. Adjúntala en WhatsApp', {
          className: 'bg-green-600 text-white border-0',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error('❌ Error al compartir por WhatsApp');
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!cardDesign) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se pudo cargar la configuración del QR
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* QR Card - Se renderiza para captura */}
      <div ref={qrCardRef} className="flex justify-center">
        <QRCard
          reserva={reserva}
          businessName={businessName}
          cardDesign={cardDesign}
        />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Descargar
        </Button>
        <Button
          onClick={handleShareWhatsApp}
          disabled={isSharing}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {isSharing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          WhatsApp
        </Button>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-blue-900 mb-1">📱 Instrucciones</p>
        <ul className="text-blue-800 space-y-1 text-xs">
          <li>• Descarga o comparte el código QR personalizado</li>
          <li>• Envíalo a tus invitados por WhatsApp</li>
          <li>• Presenta el código al llegar al establecimiento</li>
        </ul>
      </div>
    </div>
  );
}
