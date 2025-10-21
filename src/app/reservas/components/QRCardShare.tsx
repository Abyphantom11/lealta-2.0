"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Download, MessageCircle, Loader2, Settings, Copy, Check } from "lucide-react";
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
  mensajePersonalizado?: string;
}

interface QRCardShareProps {
  readonly reserva: QRCardReserva;
  readonly businessId: string;
  readonly onUserInteraction?: (isInteracting: boolean) => void;
}

export function QRCardShare({ reserva, businessId, onUserInteraction }: QRCardShareProps) {
  const [businessName, setBusinessName] = useState('Mi Negocio');
  const [cardDesign, setCardDesign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [showMessageEditor, setShowMessageEditor] = useState(false);
  const [isSavingMessage, setIsSavingMessage] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const qrCardRef = useRef<HTMLDivElement>(null);

  // Notificar cuando el usuario abre/cierra el modal de configuración
  useEffect(() => {
    if (onUserInteraction) {
      onUserInteraction(showMessageEditor);
    }
  }, [showMessageEditor, onUserInteraction]);

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
          
          // ✅ CARGAR MENSAJE PERSONALIZADO
          if (data.data?.customWhatsappMessage) {
            setCustomMessage(data.data.customWhatsappMessage);
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

  // 🔗 REFACTORIZADO: Compartir por WhatsApp - Simple y directo
  const handleShareWhatsApp = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      // PASO 1: Crear el mensaje (con fallback garantizado)
      const defaultMessage = `🎉 ¡Tu reserva está confirmada!

📍 ${businessName}
👤 ${reserva.cliente?.nombre || 'Sin nombre'}
📅 ${new Date(reserva.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
🕐 ${reserva.hora}
👥 ${reserva.numeroPersonas} ${reserva.numeroPersonas === 1 ? 'persona' : 'personas'}

Presenta este código QR al llegar 📱`;

      // Primero intentar customMessage, luego mensajePersonalizado, luego default
      let mensaje = defaultMessage;
      if (customMessage?.trim() && customMessage.trim().length > 0) {
        mensaje = customMessage.trim();
        console.log('📋 Usando mensaje personalizado (custom):', mensaje);
      } else if (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0) {
        mensaje = reserva.mensajePersonalizado.trim();
        console.log('📋 Usando mensaje personalizado (reserva):', mensaje);
      } else {
        console.log('📋 Usando mensaje por defecto:', mensaje);
      }

      // PASO 2: Generar la imagen del QR
      toast.loading('📸 Generando imagen del QR...', { id: 'generating' });

      const qrCardElement = document.querySelector('[data-qr-card]') as HTMLElement;
      if (!qrCardElement) {
        toast.dismiss('generating');
        toast.error('❌ No se encontró el QR');
        setIsSharing(false);
        return;
      }

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(qrCardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1);
      });

      if (!blob) {
        toast.dismiss('generating');
        toast.error('❌ Error al generar la imagen');
        setIsSharing(false);
        return;
      }

      toast.dismiss('generating');

      // PASO 3: Copiar mensaje al portapapeles PRIMERO (WhatsApp lo leerá automáticamente)
      const file = new File([blob], `reserva-qr.png`, { type: 'image/png' });
      
      // Determinar qué tipo de mensaje se está usando
      const esPersonalizado = (customMessage?.trim() && customMessage.trim().length > 0) || 
                             (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0);
      
      // 🔑 CLAVE: Copiar mensaje ANTES de compartir para que WhatsApp lo detecte
      try {
        await navigator.clipboard.writeText(mensaje);
        console.log('✅ Mensaje copiado al portapapeles - WhatsApp lo detectará');
      } catch (err) {
        console.warn('⚠️ No se pudo copiar mensaje:', err);
      }
      
      if (navigator.share) {
        const canShareFiles = navigator.canShare?.({ files: [file] }) ?? false;
        
        if (canShareFiles) {
          try {
            // Pequeño delay para asegurar que el mensaje esté en el portapapeles
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Compartir imagen + texto (para evitar "can't send empty message")
            await navigator.share({
              text: mensaje,
              files: [file]
            });

            toast.success('✅ ¡Perfecto!', {
              description: esPersonalizado 
                ? '🎉 Imagen enviada - El mensaje personalizado está listo en WhatsApp' 
                : '🎉 Imagen enviada - El mensaje está listo en WhatsApp',
              duration: 5000,
              className: 'bg-green-600 text-white border-0',
            });
            
            setIsSharing(false);
            return;
          } catch (error: any) {
            if (error.name === 'AbortError') {
              setIsSharing(false);
              return;
            }
            console.warn('Share API falló:', error);
          }
        }
      }

      // PASO 4: FALLBACK - Copiar imagen + abrir WhatsApp Web
      let imagenCopiada = false;
      
      if (navigator.clipboard && 'write' in navigator.clipboard) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          imagenCopiada = true;
        } catch (err) {
          console.warn('No se pudo copiar imagen:', err);
        }
      }

      // Copiar el mensaje al portapapeles
      try {
        await navigator.clipboard.writeText(mensaje);
      } catch (err) {
        console.warn('No se pudo copiar mensaje:', err);
      }

      if (imagenCopiada) {
        toast.success('� Imagen y mensaje copiados', {
          description: 'Abriendo WhatsApp... Pega el mensaje primero, luego la imagen (Ctrl+V)',
          duration: 6000,
        });
      } else {
        // Descargar la imagen si no se pudo copiar
        const imageUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = `reserva-qr-${reserva.id.slice(0, 8)}.png`;
        downloadLink.click();
        URL.revokeObjectURL(imageUrl);
        
        toast.success('📥 Mensaje copiado + Imagen descargada', {
          description: 'Abriendo WhatsApp... Pega el mensaje (Ctrl+V) y adjunta la imagen',
          duration: 6000,
        });
      }

      // Abrir WhatsApp Web solo en fallback (comentado para no interferir)
      // window.open('https://wa.me/', '_blank');

    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error('❌ Error al compartir por WhatsApp');
    } finally {
      setIsSharing(false);
    }
  };

  // Copiar mensaje al portapapeles
  const handleCopyMessage = async () => {
    try {
      // Usar la MISMA lógica que handleShareWhatsApp
      const defaultMessage = `🎉 ¡Tu reserva está confirmada!

📍 ${businessName}
👤 ${reserva.cliente?.nombre || 'Sin nombre'}
📅 ${new Date(reserva.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
🕐 ${reserva.hora}
👥 ${reserva.numeroPersonas} ${reserva.numeroPersonas === 1 ? 'persona' : 'personas'}

Presenta este código QR al llegar 📱`;

      let mensaje = defaultMessage;
      if (customMessage?.trim() && customMessage.trim().length > 0) {
        mensaje = customMessage.trim();
      } else if (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0) {
        mensaje = reserva.mensajePersonalizado.trim();
      }
      
      await navigator.clipboard.writeText(mensaje);
      setIsCopied(true);
      
      const esPersonalizado = (customMessage?.trim() && customMessage.trim().length > 0) || 
                             (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0);
      
      toast.success(esPersonalizado ? '✅ Mensaje personalizado copiado' : '✅ Mensaje copiado', {
        description: 'Ahora comparte el QR y pega el mensaje en WhatsApp',
        duration: 3000,
      });
      
      // Reset después de 3 segundos
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error('❌ Error al copiar el mensaje');
    }
  };

  // Guardar mensaje personalizado
  const handleSaveMessage = async () => {
    if (!businessId) {
      toast.error('Error: No se pudo identificar el negocio');
      return;
    }

    setIsSavingMessage(true);
    try {
      console.log('💾 Guardando mensaje para businessId:', businessId);
      console.log('📝 Mensaje:', customMessage);
      
      const response = await fetch(`/api/business/${businessId}/qr-branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customWhatsappMessage: customMessage,
        }),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error || 'Error al guardar el mensaje');
      }

      const data = await response.json();
      console.log('✅ Guardado exitoso:', data);

      toast.success('✅ Mensaje guardado exitosamente', {
        className: 'bg-green-600 text-white border-0',
      });
      setShowMessageEditor(false);
    } catch (error) {
      console.error('Error saving message:', error);
      toast.error('❌ Error al guardar el mensaje');
    } finally {
      setIsSavingMessage(false);
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
      <div ref={qrCardRef} className="flex justify-center p-2 sm:p-4" style={{ minWidth: '320px', minHeight: '520px', maxWidth: '100%' }}>
        <QRCard
          reserva={reserva}
          businessName={businessName}
          cardDesign={cardDesign}
        />
      </div>

      {/* Botones de acción */}
      <div className="space-y-2">
        {/* Botón principal de WhatsApp - Más grande y destacado */}
        <Button
          onClick={handleShareWhatsApp}
          disabled={isSharing}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {isSharing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Preparando...
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5 mr-2" />
              Compartir por WhatsApp
            </>
          )}
        </Button>

        {/* Botones secundarios */}
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
            title="Descargar imagen del QR"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
          
          {customMessage && (
            <Button
              onClick={handleCopyMessage}
              variant={isCopied ? "default" : "outline"}
              className={isCopied ? "flex-1 bg-green-600 hover:bg-green-700 text-white" : "flex-1"}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={() => setShowMessageEditor(true)}
            variant="outline"
            className="flex items-center gap-2"
            title="Personalizar mensaje de WhatsApp"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Instrucciones mejoradas */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Cómo compartir por WhatsApp
        </p>
        <ol className="text-green-800 space-y-1.5 text-xs ml-1">
          <li className="flex items-start gap-2">
            <span className="font-bold min-w-[20px]">1.</span>
            <span>Toca el botón verde de WhatsApp ⬆️</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold min-w-[20px]">2.</span>
            <span>El mensaje se copia automáticamente 📋</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold min-w-[20px]">3.</span>
            <span>Comparte la imagen del QR por WhatsApp 📱</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold min-w-[20px]">4.</span>
            <span>Pega el mensaje copiado en WhatsApp ✅</span>
          </li>
        </ol>
      </div>

      {/* Modal de Edición de Mensaje */}
      {showMessageEditor && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMessageEditor(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-auto mb-0 sm:mb-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  ✏️ Personalizar Mensaje
                </h3>
                <button
                  onClick={() => setShowMessageEditor(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Escribe tu mensaje personalizado aquí...&#10;&#10;Ejemplo:&#10;📍 Dirección: Calle Principal #123&#10;🅿️ Parqueadero disponible&#10;📞 Contacto: +593 99 123 4567"
                className="w-full h-64 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                maxLength={500}
                autoFocus
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">
                  Este mensaje se enviará junto con el QR
                </p>
                <p className="text-xs font-medium text-gray-600">
                  {customMessage.length}/500
                </p>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-5 rounded-b-2xl flex gap-3 justify-end">
              <Button
                onClick={() => setShowMessageEditor(false)}
                variant="outline"
                disabled={isSavingMessage}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveMessage}
                disabled={isSavingMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSavingMessage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    💾 Guardar Mensaje
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
