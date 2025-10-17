"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Download, MessageCircle, Loader2, Settings } from "lucide-react";
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

  // 🔗 Compartir por WhatsApp - Nueva estrategia con link compartible
  const handleShareWhatsApp = async () => {
    // Prevenir múltiples clicks
    if (isSharing) return;
    
    setIsSharing(true);
    
    try {
      // Mensaje personalizado
      const message = customMessage || `Tu reserva en ${businessName} está confirmada. Por favor presenta este QR al llegar.`;

      // 1️⃣ Crear link compartible con QR + mensaje
      toast.loading('Generando link compartible...', { id: 'creating-link' });
      
      const response = await fetch('/api/share/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservaId: reserva.id,
          message: message,
          businessId: businessId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el link');
      }

      const result = await response.json();
      const shareUrl = result.data.shareUrl;

      toast.dismiss('creating-link');

      // 2️⃣ Preparar texto para compartir con el link
      const shareText = `${message}\n\n📱 Ver QR y detalles: ${shareUrl}`;

      // 3️⃣ Intentar usar Web Share API (funciona con texto en todos los dispositivos)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Reserva - ${businessName}`,
            text: shareText,
          });

          toast.success('✅ Reserva compartida exitosamente', {
            className: 'bg-green-600 text-white border-0',
            description: 'El link incluye el QR y el mensaje completo',
            duration: 5000,
          });
          
          setIsSharing(false);
          return;
        } catch (error: any) {
          // Si el usuario cancela, salir silenciosamente
          if (error.name === 'AbortError') {
            setIsSharing(false);
            return;
          }
          console.log('Share API no disponible, usando WhatsApp directo');
        }
      }

      // 4️⃣ FALLBACK: Abrir WhatsApp directamente con el link
      const whatsappMessage = encodeURIComponent(shareText);
      const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
      
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      toast.success('✅ WhatsApp abierto', {
        className: 'bg-green-600 text-white border-0',
        description: 'El mensaje incluye el link al QR. Solo envíalo.',
        duration: 5000,
      });

    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error('❌ Error al compartir por WhatsApp');
    } finally {
      setIsSharing(false);
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
        <Button
          onClick={() => setShowMessageEditor(true)}
          variant="outline"
          className="flex items-center gap-2"
          title="Personalizar mensaje de WhatsApp"
        >
          <Settings className="w-4 h-4" />
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

      {/* Modal de Edición de Mensaje */}
      {showMessageEditor && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMessageEditor(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    ⚙️ Personalizar Mensaje de WhatsApp
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Este mensaje se enviará junto con el QR de la reserva
                  </p>
                </div>
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
            <div className="p-6 space-y-6">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>💡 Nota:</strong> La imagen del QR ya contiene toda la información de la reserva (nombre, fecha, hora, personas). 
                  Este mensaje se enviará junto con el QR por WhatsApp. Úsalo para:
                </p>
                <ul className="text-sm text-blue-800 mt-2 ml-4 space-y-1">
                  <li>• Compartir la dirección de tu negocio</li>
                  <li>• Indicar información de parqueadero</li>
                  <li>• Mencionar requisitos especiales</li>
                  <li>• Agregar información de contacto</li>
                </ul>
              </div>

              {/* Preview del mensaje completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📱 Vista Previa del Mensaje de WhatsApp
                </label>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                  <div className="text-gray-900">
                    {customMessage || `Tu reserva en ${businessName} está confirmada. Por favor presenta este QR al llegar.`}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 La imagen del QR ya contiene toda la información de la reserva (nombre, fecha, hora, personas)
                </p>
              </div>

              {/* Editor de Mensaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ✏️ Mensaje para WhatsApp
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Ejemplo:&#10;&#10;📍 Dirección: Calle Principal #123&#10;🅿️ Parqueadero disponible en el sótano&#10;📞 Contacto: +593 99 123 4567&#10;&#10;Para cambios, responde a este mensaje."
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans"
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Máximo 500 caracteres
                  </p>
                  <p className="text-xs text-gray-500">
                    {customMessage.length}/500
                  </p>
                </div>
              </div>

              {/* Botones Templates Rápidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⚡ Templates Rápidos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCustomMessage(
                      '📍 Dirección: [Tu dirección aquí]\n' +
                      '🅿️ Parqueadero disponible\n\n' +
                      'Para cambios, responde a este mensaje.'
                    )}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
                  >
                    📍 Con Dirección
                  </button>
                  <button
                    onClick={() => setCustomMessage(
                      '🎉 ¡Te esperamos!\n\n' +
                      '📍 Google Maps: [tu link]\n' +
                      '📞 Contacto: [tu teléfono]'
                    )}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
                  >
                    🎉 Casual
                  </button>
                  <button
                    onClick={() => setCustomMessage(
                      '📍 [Tu dirección]\n' +
                      '🪪 Traer documento de identidad\n' +
                      '👔 Código de vestimenta: Smart Casual'
                    )}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
                  >
                    👔 Formal
                  </button>
                  <button
                    onClick={() => setCustomMessage(
                      '📍 [Tu dirección]\n' +
                      '🅿️ Parqueadero disponible\n' +
                      '📞 [Tu teléfono]'
                    )}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
                  >
                    📋 Básico
                  </button>
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl flex gap-3 justify-end">
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
