"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Download, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import QRCard from "./QRCard";
import html2canvas from "html2canvas";

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
      if (!businessId || businessId.trim() === '') {
        console.error('❌ No businessId provided to QRCardShare');
        // Usar diseño por defecto inmediatamente
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
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 QRCardShare - businessId:', businessId);
        const url = `/api/business/${businessId}/qr-branding`;
        console.log('🔍 Fetching QR config from:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ QR config data:', data);
          
          if (data.data?.businessName) {
            setBusinessName(data.data.businessName);
          }
          if (data.data?.cardDesign) {
            setCardDesign(data.data.cardDesign);
          } else {
            console.log('⚠️ No cardDesign found, using default');
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
        } else {
          console.error('❌ Response not OK:', response.status, response.statusText);
          // Usar diseño por defecto si la respuesta no es OK
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
      } catch (error) {
        console.error('❌ Error al cargar configuración QR:', error);
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

  // Generar imagen del QR Card con mejor manejo de errores
  const generateQRCardImage = async (): Promise<Blob | null> => {
    if (!qrCardRef.current) return null;

    try {
      const canvas = await html2canvas(qrCardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false, // ✅ Evita document.write()
        removeContainer: true, // ✅ Limpia el DOM después
        width: qrCardRef.current.scrollWidth, // ✅ Asegurar ancho completo
        height: qrCardRef.current.scrollHeight, // ✅ Asegurar alto completo
        scrollX: 0,
        scrollY: 0,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 1.0); // ✅ Máxima calidad
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

  // Compartir por WhatsApp - Optimizado para evitar bloqueos
  const handleShareWhatsApp = async () => {
    // Prevenir múltiples clicks
    if (isSharing) return;
    
    setIsSharing(true);
    
    // Usar requestIdleCallback o setTimeout para no bloquear el UI
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      // Generar imagen del QR Card con html2canvas
      const blob = await generateQRCardImage();
      
      if (!blob) {
        toast.error('❌ Error al generar la imagen');
        setIsSharing(false);
        return;
      }

      const fileName = `reserva-${businessName.replace(/\s+/g, '-')}-${reserva.cliente?.nombre?.replace(/\s+/g, '-') || 'cliente'}.png`;
      const file = new File([blob], fileName, { 
        type: 'image/png',
        lastModified: Date.now()
      });

      // Texto formateado para WhatsApp
      const whatsappText = 
        `*Reserva Confirmada - ${businessName}*\n\n` +
        `📱 *Presenta este QR al llegar*\n` +
        `🅿️ *Parqueadero gratuito e ilimitado* dentro del edificio (S1, S2, S3, S4).\n` +
        `🪪 Presentar cédula o pasaporte (en caso de pérdida, traer denuncia con respaldo).\n\n` +
        `📍 *Dirección:* Diego de Almagro y Ponce Carrasco, Edificio Almagro 240, piso 13\n` +
        `📎 *Google Maps:* \`https://g.co/kgs/KbKrU5N\`\n\n` +
        `⏱️ *Tiempo de espera:* 10 minutos.\n` +
        `❗ Para cambios o cancelaciones, avisarnos por este medio.\n\n` +
        `✨ ¡Nos vemos pronto!`;

      // 🎯 INTENTO 1: Web Share API con archivo (iOS/Android moderno)
      if (navigator.share) {
        try {
          const canShareFiles = navigator.canShare?.({ files: [file] }) ?? false;
          
          if (canShareFiles) {
            // Usar setTimeout para evitar que el modal se cierre antes del share
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await navigator.share({
              title: `Reserva - ${businessName}`,
              text: whatsappText,
              files: [file]
            });

            toast.success('💚 Reserva compartida exitosamente', {
              className: 'bg-green-600 text-white border-0',
            });
            setIsSharing(false);
            return;
          }
        } catch (shareError: any) {
          // Si el usuario cancela, no mostrar error
          if (shareError.name === 'AbortError') {
            console.log('Usuario canceló el compartir');
            setIsSharing(false);
            return;
          }
          console.warn('Share API con archivo falló:', shareError);
          // Continuar con fallback
        }
      }

      // 🎯 INTENTO 2: Descargar + Abrir WhatsApp (Desktop/Fallback)
      // Descargar la imagen
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Limpiar inmediatamente
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      // Abrir WhatsApp con el texto después de un pequeño delay
      setTimeout(() => {
        const message = encodeURIComponent(whatsappText + '\n\n📎 Adjunta la imagen que se acaba de descargar');
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
      }, 300);

      toast.success('💚 Imagen descargada. Adjúntala en WhatsApp', {
        className: 'bg-green-600 text-white border-0',
        description: 'La imagen del QR se descargó. Ahora ábrela en WhatsApp y adjúntala.',
        duration: 6000,
      });
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
    <div className="space-y-3">
      {/* QR Card - Se renderiza para captura */}
      <div ref={qrCardRef} className="flex justify-center p-2 sm:p-4" style={{ minWidth: '320px', minHeight: '400px', maxWidth: '100%' }}>
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
