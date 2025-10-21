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
        }, 'image/png', 1); // ✅ Máxima calidad
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
      link.remove();
      URL.revokeObjectURL(url);

      toast.success('✅ Imagen descargada exitosamente', {
        className: 'bg-green-600 text-white border-0',
      });
    } catch (error) {
      console.error('Error al descargar:', error);
      toast.error('❌ Error al descargar la imagen');
    }
  };

  // 🔗 SIMPLIFICADO: Compartir por WhatsApp - Solo imagen QR
  const handleShareWhatsApp = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      // PASO 1: Generar mensaje (personalizado o por defecto)
      let mensajeParaEnviar: string;
      
      if (customMessage?.trim() && customMessage.trim().length > 0) {
        mensajeParaEnviar = customMessage.trim();
        console.log('📋 Usando mensaje personalizado (custom)');
      } else if (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0) {
        mensajeParaEnviar = reserva.mensajePersonalizado.trim();
        console.log('📋 Usando mensaje personalizado (reserva)');
      } else {
        // Mensaje mínimo por defecto (solo para evitar error "empty message")
        mensajeParaEnviar = ' ';
        console.log('📋 Usando mensaje mínimo por defecto');
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

      // PASO 3: Copiar SOLO mensaje personalizado al portapapeles (si existe)
      const file = new File([blob], `reserva-qr.png`, { type: 'image/png' });
      
      // Copiar SOLO mensaje personalizado al portapapeles (si existe)
      const tienePersonalizado = (customMessage?.trim() && customMessage.trim().length > 0) || 
                                 (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0);
      
      if (tienePersonalizado) {
        try {
          await navigator.clipboard.writeText(mensajeParaEnviar);
          console.log('✅ Mensaje personalizado copiado al portapapeles');
        } catch (err) {
          console.warn('⚠️ No se pudo copiar mensaje personalizado:', err);
        }
      }
      
      // PASO 4: Compartir imagen con diferentes estrategias
      if (navigator.share) {
        const canShareFiles = navigator.canShare?.({ files: [file] }) ?? false;
        
        if (canShareFiles) {
          try {
            // Pequeño delay para asegurar que el mensaje esté en el portapapeles
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Estrategia 1: Intentar solo con archivos
            try {
              await navigator.share({
                files: [file]
              });

              toast.success('✅ QR enviado correctamente', {
                description: tienePersonalizado 
                  ? '📋 Mensaje personalizado copiado - Pégalo en WhatsApp' 
                  : '📷 Solo imagen enviada - Sin mensaje adicional',
                duration: 5000,
                className: 'bg-green-600 text-white border-0',
              });
              
              setIsSharing(false);
              return;
            } catch (innerError: any) {
              console.warn('Share con solo archivos falló:', innerError);
              
              // Estrategia 2: Intentar con texto mínimo + archivos
              if (innerError.message?.includes('empty') || innerError.message?.includes('Empty')) {
                console.log('Intentando con texto mínimo...');
                await navigator.share({
                  text: mensajeParaEnviar, // Usar el mensaje (personalizado o espacio mínimo)
                  files: [file]
                });

                toast.success('✅ QR enviado correctamente', {
                  description: tienePersonalizado 
                    ? '📋 Mensaje personalizado copiado - Pégalo en WhatsApp' 
                    : '📷 Imagen enviada con texto mínimo',
                  duration: 5000,
                  className: 'bg-green-600 text-white border-0',
                });
                
                setIsSharing(false);
                return;
              }
              
              throw innerError; // Re-lanzar si no es problema de mensaje vacío
            }

          } catch (error: any) {
            if (error.name === 'AbortError') {
              setIsSharing(false);
              return;
            }
            console.warn('Share API falló completamente:', error);
          }
        }
      }

      // PASO 5: FALLBACK - Copiar imagen al portapapeles o descargar
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

      // Copiar SOLO mensaje personalizado al portapapeles (si existe)
      if (tienePersonalizado) {
        try {
          await navigator.clipboard.writeText(mensajeParaEnviar);
        } catch (err) {
          console.warn('No se pudo copiar mensaje personalizado:', err);
        }
      }

      if (imagenCopiada) {
        toast.success('📋 Imagen copiada', {
          description: tienePersonalizado 
            ? 'Imagen + mensaje personalizado listos en portapapeles (Ctrl+V)'
            : 'Imagen lista en portapapeles (Ctrl+V)',
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
        
        toast.success('📥 Imagen descargada', {
          description: tienePersonalizado 
            ? 'Mensaje personalizado copiado - Adjunta la imagen manualmente'
            : 'Solo imagen descargada - Sin mensaje adicional',
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

  // Copiar mensaje personalizado al portapapeles (solo si existe)
  const handleCopyMessage = async () => {
    try {
      // Solo copiar mensaje personalizado
      let mensajePersonalizado: string | null = null;
      
      if (customMessage?.trim() && customMessage.trim().length > 0) {
        mensajePersonalizado = customMessage.trim();
      } else if (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0) {
        mensajePersonalizado = reserva.mensajePersonalizado.trim();
      }

      if (!mensajePersonalizado) {
        toast.error('❌ No hay mensaje personalizado para copiar');
        return;
      }
      
      await navigator.clipboard.writeText(mensajePersonalizado);
      setIsCopied(true);
      
      toast.success('✅ Mensaje personalizado copiado', {
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

      {/* Instrucciones simplificadas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Compartir por WhatsApp
        </p>
        <div className="text-blue-800 space-y-1.5 text-xs ml-1">
          {((customMessage?.trim() && customMessage.trim().length > 0) || 
            (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0)) ? (
            <div className="space-y-2">
              <p>✅ <strong>Se enviará:</strong> Solo la imagen del QR</p>
              <p>📋 <strong>Tu mensaje personalizado</strong> se copia automáticamente al portapapeles</p>
              <p>💬 <strong>Pega el mensaje</strong> en WhatsApp después de enviar la imagen</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p>✅ Se enviará solo la imagen del QR</p>
              <p>💡 <strong>Consejo:</strong> Personaliza tu mensaje usando el botón ⚙️</p>
            </div>
          )}
        </div>
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
