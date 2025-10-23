"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Download, MessageCircle, Loader2, Settings, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import QRCard from "./QRCard";
import { useBrowserCapabilities, getStrategyUI } from "@/hooks/useBrowserCapabilities";
import { useDetailedShareCapabilities, getCompatibilityUI } from "@/hooks/useDetailedShareCapabilities";
import { useQRGeneration } from "@/hooks/useQRGeneration";
import { executeShareStrategy, copyToClipboardSafe } from "@/utils/shareStrategies";

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
  // Estados básicos
  const [businessName, setBusinessName] = useState('Mi Negocio');
  const [cardDesign, setCardDesign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [showMessageEditor, setShowMessageEditor] = useState(false);
  const [isSavingMessage, setIsSavingMessage] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Refs
  const qrCardRef = useRef<HTMLDivElement>(null);
  
  // Hooks personalizados
  const capabilities = useBrowserCapabilities();
  const detailedCaps = useDetailedShareCapabilities();
  const { generateQR, downloadQR, clearCache } = useQRGeneration();

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

  // Limpiar cache al desmontar el componente
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  // 📥 Descargar imagen (OPTIMIZADO)
  const handleDownload = useCallback(async () => {
    if (!qrCardRef.current) {
      toast.error('❌ Error: No se encontró el QR');
      return;
    }

    try {
      const element = qrCardRef.current.querySelector('[data-qr-card]') as HTMLElement;
      if (!element) {
        toast.error('❌ Error: No se encontró el elemento QR');
        return;
      }

      toast.loading('📸 Generando imagen...', { id: 'download' });
      
      await generateQR(element);
      const fileName = `reserva-${reserva.cliente?.nombre?.replace(/\s+/g, '-') || 'qr'}.png`;
      const success = downloadQR(fileName);

      toast.dismiss('download');

      if (success) {
        toast.success('✅ Imagen descargada exitosamente', {
          className: 'bg-green-600 text-white border-0',
        });
      } else {
        toast.error('❌ Error al descargar la imagen');
      }
    } catch (error) {
      console.error('Error al descargar:', error);
      toast.dismiss('download');
      toast.error('❌ Error al descargar la imagen');
    }
  }, [reserva.cliente?.nombre, generateQR, downloadQR]);

  // 🚀 COMPARTIR POR WHATSAPP (OPTIMIZADO CON ESTRATEGIAS)
  const handleShareWhatsApp = useCallback(async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      // PASO 1: Determinar mensaje a enviar
      let mensajeParaEnviar = '';
      const tienePersonalizado = !!(
        (customMessage?.trim() && customMessage.trim().length > 0) || 
        (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0)
      );

      if (tienePersonalizado) {
        mensajeParaEnviar = (customMessage?.trim() || reserva.mensajePersonalizado?.trim() || '').trim();
        console.log('📋 Usando mensaje personalizado');
      }

      // PASO 2: Generar QR
      const qrCardElement = qrCardRef.current?.querySelector('[data-qr-card]') as HTMLElement;
      if (!qrCardElement) {
        toast.error('❌ No se encontró el QR');
        setIsSharing(false);
        return;
      }

      toast.loading('📸 Generando QR...', { id: 'share-loading' });

      const blob = await generateQR(qrCardElement);
      
      if (!blob) {
        toast.dismiss('share-loading');
        toast.error('❌ Error al generar la imagen');
        setIsSharing(false);
        return;
      }

      toast.dismiss('share-loading');

      // PASO 3: Crear archivo
      const file = new File(
        [blob], 
        `reserva-${reserva.cliente?.nombre?.replace(/\s+/g, '-') || reserva.id.slice(0, 8)}.png`,
        { type: 'image/png' }
      );

      // PASO 4: Ejecutar estrategia recomendada
      const strategyUI = getStrategyUI(capabilities.recommendedStrategy);
      toast.loading(`${strategyUI.emoji} ${strategyUI.label}...`, { id: 'share-strategy' });

      const result = await executeShareStrategy(
        capabilities.recommendedStrategy,
        {
          file,
          message: mensajeParaEnviar,
          hasCustomMessage: tienePersonalizado,
        }
      );

      toast.dismiss('share-strategy');

      if (result.success) {
        toast.success(result.message, {
          description: result.description,
          duration: 5000,
          className: 'bg-green-600 text-white border-0',
        });
      } else if (result.message !== 'Compartir cancelado') {
        toast.error(result.message, {
          description: result.description,
        });
      }

    } catch (error) {
      console.error('Error al compartir:', error);
      toast.dismiss('share-loading');
      toast.dismiss('share-strategy');
      toast.error('❌ Error al compartir por WhatsApp');
    } finally {
      setIsSharing(false);
    }
  }, [
    isSharing,
    customMessage,
    reserva.mensajePersonalizado,
    reserva.cliente?.nombre,
    reserva.id,
    generateQR,
    capabilities.recommendedStrategy,
  ]);

  // 📋 Copiar mensaje personalizado (OPTIMIZADO)
  const handleCopyMessage = useCallback(async () => {
    try {
      const mensajePersonalizado = customMessage?.trim() || reserva.mensajePersonalizado?.trim() || '';

      if (!mensajePersonalizado) {
        toast.error('❌ No hay mensaje personalizado para copiar');
        return;
      }
      
      const success = await copyToClipboardSafe(mensajePersonalizado);
      
      if (success) {
        setIsCopied(true);
        
        toast.success('✅ Mensaje copiado', {
          description: 'Pega el mensaje en WhatsApp después de enviar el QR',
          duration: 3000,
        });
        
        // Reset después de 3 segundos
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        toast.error('❌ Error al copiar el mensaje');
      }
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error('❌ Error al copiar el mensaje');
    }
  }, [customMessage, reserva.mensajePersonalizado]);

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

      {/* Indicador de compatibilidad mejorado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 text-sm">
        {/* Badge de compatibilidad */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCompatibilityUI(detailedCaps.compatibility).badgeColor}`}>
            {getCompatibilityUI(detailedCaps.compatibility).emoji}
            {getCompatibilityUI(detailedCaps.compatibility).label}
            <span className="text-[10px] opacity-75">({detailedCaps.confidence}%)</span>
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getStrategyUI(capabilities.recommendedStrategy).emoji}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-1">
              {capabilities.strategyDescription}
            </p>
            
            {/* Mensaje personalizado presente */}
            {((customMessage?.trim() && customMessage.trim().length > 0) || 
              (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0)) && (
              <>
                <div className="text-blue-700 space-y-1.5 text-xs mt-2">
                  <p className="font-medium">📱 Tu dispositivo:</p>
                  <p className="text-[11px] opacity-90">
                    {detailedCaps.os === 'ios' && `iOS ${detailedCaps.osVersion || '?'}`}
                    {detailedCaps.os === 'android' && `Android ${detailedCaps.osVersion || '?'}`}
                    {!detailedCaps.isMobile && 'Desktop'}
                    {' • '}
                    {detailedCaps.browser === 'safari' && 'Safari'}
                    {detailedCaps.browser === 'chrome' && 'Chrome'}
                    {detailedCaps.browser === 'firefox' && 'Firefox'}
                    {detailedCaps.browser === 'edge' && 'Edge'}
                    {detailedCaps.browser === 'opera' && 'Opera'}
                    {detailedCaps.browser === 'brave' && 'Brave'}
                    {detailedCaps.browser === 'samsung' && 'Samsung Internet'}
                    {detailedCaps.browser === 'other' && 'Otro'}
                    {detailedCaps.browserVersion && ` ${detailedCaps.browserVersion}`}
                    {detailedCaps.browserEngine && detailedCaps.browserEngine !== 'other' && 
                      ` (${detailedCaps.browserEngine === 'chromium' ? 'Chromium' : 
                           detailedCaps.browserEngine === 'webkit' ? 'WebKit' : 
                           detailedCaps.browserEngine === 'gecko' ? 'Gecko' : ''})`}
                  </p>
                  
                  <p className="font-medium mt-2">� Qué esperar:</p>
                  <p className="text-[11px] opacity-90">{detailedCaps.compatibilityReason}</p>
                  
                  <p className="font-medium mt-2">✅ Acción recomendada:</p>
                  <p className="text-[11px] opacity-90">{detailedCaps.recommendedAction}</p>
                </div>
              </>
            )}
            
            {/* Sin mensaje personalizado */}
            {!((customMessage?.trim() && customMessage.trim().length > 0) || 
               (reserva.mensajePersonalizado?.trim() && reserva.mensajePersonalizado.trim().length > 0)) && (
              <div className="text-blue-700 space-y-1 text-xs">
                <p>✅ Se compartirá solo la imagen del QR</p>
                <p>💡 <strong>Sugerencia:</strong> Personaliza tu mensaje con el botón ⚙️</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Info técnica (debug) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2 text-xs text-gray-600">
            <summary className="cursor-pointer hover:text-gray-800">Detalles técnicos</summary>
            <div className="mt-1 pl-2 space-y-0.5 font-mono">
              <p>🌐 Chrome: {capabilities.isChrome ? `v${capabilities.chromeVersion}` : 'No'}</p>
              <p>📱 Móvil: {capabilities.isMobile ? 'Sí' : 'No'}</p>
              <p>🔗 Share API: {capabilities.hasShareAPI ? 'Sí' : 'No'}</p>
              <p>📤 Archivos: {capabilities.canShareFiles ? 'Sí' : 'No'}</p>
              <p>📝 Texto: {capabilities.canShareText ? 'Sí' : 'No'}</p>
              <p>🎯 Ambos: {capabilities.canShareBoth ? 'Sí' : 'No'}</p>
            </div>
          </details>
        )}
      </div>

      {/* Modal de Edición de Mensaje */}
      {showMessageEditor && (
        <dialog
          open
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 border-0"
          aria-modal="true"
        >
          <button 
            className="absolute inset-0 w-full h-full opacity-0"
            onClick={() => setShowMessageEditor(false)}
            aria-label="Cerrar diálogo"
          ></button>
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
        </dialog>
      )}
    </div>
  );
}
