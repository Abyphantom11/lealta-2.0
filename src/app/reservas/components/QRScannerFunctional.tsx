"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Camera, CameraOff, RotateCcw, CheckCircle, AlertTriangle, ScanLine, Plus, Minus, Users } from "lucide-react";
import jsQR from "jsqr";
import { getScannerInfo } from "./scanner-version";
import { useIsClient } from "./hooks/useClient";

interface QRScannerFunctionalProps {
  onScan: (qrCode: string) => Promise<void>;
  onError?: (error: string) => void;
}

interface ScanResult {
  success: boolean;
  message: string;
  reservaId?: string;
  incrementCount?: number;
  maxAsistencia?: number;
  cliente?: {
    nombre: string;
    telefono: string;
  };
  reserva?: {
    fecha: string;
    hora: string;
    servicio: string;
  };
}

// Estructura del QR generado (debe coincidir con QRGenerator)
interface QRData {
  reservaId: string;
  token: string;
  timestamp: number;
  cliente: string;
  fecha: string;
  hora: string;
}

interface ReservaDetectada {
  reservaId: string;
  token: string; // Agregar token para usar en incrementos
  cliente: string;
  telefono: string;
  fecha: string;
  hora: string;
  servicio: string;
  total: number;
  actual: number;
  exceso: number;
}

export function QRScannerFunctional({ onScan, onError }: Readonly<QRScannerFunctionalProps>) {
  // Estados inicializados de manera consistente para evitar hidratación
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Hook personalizado para detectar cliente y evitar hidratación
  const isClient = useIsClient();

  
  // Estados para el dialog de incremento
  const [showDialog, setShowDialog] = useState(false);
  const [reservaDetectada, setReservaDetectada] = useState<ReservaDetectada | null>(null);
  const [incrementoTemporal, setIncrementoTemporal] = useState(1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para obtener información del QR SIN incrementar aún
  const getQRInfo = useCallback(async (qrData: string): Promise<ScanResult & { token?: string }> => {
    try {
      const response = await fetch('/api/reservas/qr-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode: qrData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar el QR');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al verificar QR";
      throw new Error(errorMessage);
    }
  }, []);



  // Función para escanear QR en el frame actual - OPTIMIZADA
  const scanQRCode = useCallback(() => {
    // Verificaciones de seguridad
    if (!videoRef.current || !canvasRef.current || isProcessing || showDialog) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Verificar que el video esté realmente listo
    if (video.readyState < video.HAVE_ENOUGH_DATA || video.paused || video.videoWidth === 0) {
      return;
    }

    try {
      const context = canvas.getContext('2d');
      if (!context) return;

      // Ajustar canvas al tamaño del video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      
      // Dibujar frame actual
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Obtener datos de imagen
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Intentar detectar QR
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert", // Optimización: no invertir colores
      });
      
      // Debug cada 30 frames (aproximadamente 1 vez por segundo)
      if (Math.random() < 0.033) {
        console.log("🔍 Escaneando... Video:", video.videoWidth + "x" + video.videoHeight, "Ready:", video.readyState);
      }
      
      if (code) {
        // Procesar el QR detectado
        (async (qrDataString: string) => {
          if (isProcessing || showDialog) return;
          
          setIsProcessing(true);
          setError("");
          setSuccess("");
          
          try {
            // Detener temporalmente el escaneo
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }
            
            console.log("📱 QR detectado, parseando datos...");
            
            // Parsear el QR que viene en formato JSON del QRGenerator
            let qrData: QRData;
            try {
              qrData = JSON.parse(qrDataString);
              console.log("✅ QR parseado correctamente:", qrData);
            } catch (parseError) {
              console.error("❌ Error al parsear QR:", parseError);
              setError("Código QR inválido o corrupto");
              setIsProcessing(false);
              return;
            }
            
            // Validar que tenga los campos requeridos
            if (!qrData.reservaId || !qrData.token) {
              console.error("❌ QR no tiene campos requeridos");
              setError("Código QR inválido: faltan datos requeridos");
              setIsProcessing(false);
              return;
            }
            
            // Obtener información completa de la reserva desde la API
            const result = await getQRInfo(qrDataString);
            
            if (result.success && result.reservaId) {
              // Configurar la reserva detectada con datos del QR y de la API
              const reservaInfo: ReservaDetectada = {
                reservaId: qrData.reservaId,
                token: qrData.token,
                cliente: qrData.cliente || result.cliente?.nombre || 'Cliente',
                telefono: result.cliente?.telefono || '',
                fecha: qrData.fecha || result.reserva?.fecha || '',
                hora: qrData.hora || result.reserva?.hora || '',
                servicio: result.reserva?.servicio || '',
                total: result.maxAsistencia || 1,
                actual: result.incrementCount || 0,
                exceso: Math.max(0, (result.incrementCount || 0) - (result.maxAsistencia || 1))
              };
              
              console.log("🎉 Reserva detectada:", reservaInfo);
              setReservaDetectada(reservaInfo);
              setIncrementoTemporal(1); // Comenzar con 1 persona detectada
              setShowDialog(true);
              
              await onScan(qrDataString);
            } else {
              console.error("❌ Error en respuesta de API:", result.message);
              setError(result.message || 'Error al procesar QR');
            }
            
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al procesar QR";
            console.error("❌ Error procesando QR:", errorMessage);
            setError(errorMessage);
            onError?.(errorMessage);
          } finally {
            setIsProcessing(false);
          }
        })(code.data);
      }
      
    } catch (scanError) {
      // Manejar errores de escaneo silenciosamente para no interrumpir el flujo
      if (Math.random() < 0.01) { // Log ocasional de errores
        console.warn("⚠️ Error en scanQRCode:", scanError);
      }
    }
  }, [isProcessing, showDialog, getQRInfo, onScan, onError]);



  // Función para incrementar asistencia
  const incrementarAsistencia = useCallback(() => {
    setIncrementoTemporal(prev => prev + 1);
  }, []);

  // Función para decrementar asistencia
  const decrementarAsistencia = useCallback(() => {
    setIncrementoTemporal(prev => Math.max(1, prev - 1));
  }, []);

  // Función para confirmar el incremento
  const confirmarIncremento = useCallback(async () => {
    if (!reservaDetectada) return;
    
    try {
      setIsProcessing(true);
      
      // Usar la nueva API de incremento múltiple
      const response = await fetch('/api/reservas/increment-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reservaId: reservaDetectada.reservaId,
          token: reservaDetectada.token, // Usar el token real del QR escaneado
          increment: incrementoTemporal
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al incrementar asistencia');
      }

      const data = await response.json();
      
      const nuevoActual = data.incrementCount;
      const exceso = data.exceso || 0;
      
      const excesoText = exceso > 0 ? ` (+${exceso})` : '';
      setSuccess(`✅ ${data.message}. Total: ${nuevoActual}/${data.maxAsistencia}${excesoText}`);
      
      // Cerrar dialog y reiniciar escaneo después de 3 segundos
      setShowDialog(false);
      setReservaDetectada(null);
      setIncrementoTemporal(1);
      
      setTimeout(() => {
        if (isScanning && scanIntervalRef.current === null) {
          scanIntervalRef.current = setInterval(scanQRCode, 100);
        }
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al confirmar incremento";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [reservaDetectada, incrementoTemporal, isScanning, scanQRCode]);

  // Función para cancelar y continuar escaneando
  const cancelarYContinuar = useCallback(() => {
    setShowDialog(false);
    setReservaDetectada(null);
    setIncrementoTemporal(1);
    
    // Reiniciar escaneo inmediatamente
    setTimeout(() => {
      if (isScanning && scanIntervalRef.current === null) {
        scanIntervalRef.current = setInterval(scanQRCode, 100);
      }
    }, 500);
  }, [isScanning, scanQRCode]);

  // Función para iniciar el escaneo automático
  const startScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    scanIntervalRef.current = setInterval(scanQRCode, 100);
  }, [scanQRCode]);

  // Función para obtener acceso a la cámara - VERSIÓN SIMPLIFICADA
  const startCamera = useCallback(async () => {
    try {
      // Limpiar estados
      setError("");
      setSuccess("");
      
      console.log("🎥 Iniciando cámara...");
      
      // Verificación básica de soporte
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia no soportado en este navegador");
      }
      
      // Verificar permisos existentes
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log("📋 Estado de permisos de cámara:", permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            setError("Permisos de cámara bloqueados. Ve a configuración del navegador para permitir el acceso.");
            return;
          }
        } catch {
          console.log("ℹ️ No se puede verificar estado de permisos");
        }
      }

      // Variable para el stream
      let stream: MediaStream;
      
      // Configuración ÚNICA Y SIMPLE - Sin reintentos molestos
      const config = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      console.log("🎥 Solicitando cámara con configuración:", JSON.stringify(config));
      const requestStartTime = performance.now();
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(config);
        console.log("✅ Cámara obtenida exitosamente");
      } catch (testError: any) {
        const requestEndTime = performance.now();
        const requestDuration = requestEndTime - requestStartTime;
        
        console.error(`❌ Error al obtener cámara:`, testError.name, testError.message);
        
        // Mensajes de error específicos para el usuario
        if (testError.name === 'NotAllowedError') {
          if (requestDuration > 1000) {
            throw new Error("Permisos de cámara denegados. Por favor, permite el acceso a la cámara en tu navegador.");
          } else {
            throw new Error("Cámara bloqueada por el navegador. Revisa la configuración de permisos del sitio.");
          }
        } else if (testError.name === 'NotFoundError') {
          throw new Error("No se detectó ninguna cámara en tu dispositivo.");
        } else if (testError.name === 'NotReadableError') {
          throw new Error("La cámara está siendo usada por otra aplicación. Ciérrala e intenta de nuevo.");
        } else if (testError.name === 'OverconstrainedError') {
          // Intentar con configuración mínima como fallback
          console.log("⚠️ Constraints muy estrictos, intentando configuración básica...");
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            console.log("✅ Cámara obtenida con configuración básica");
          } catch {
            throw new Error("Tu cámara no soporta la configuración requerida.");
          }
        } else {
          throw testError;
        }
      }
      
      if (!stream) {
        throw new Error("No se pudo obtener acceso a la cámara");
      }
      
      console.log("✅ Stream de cámara obtenido");
      streamRef.current = stream;
      
      // Configurar elemento de video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        // Intentar reproducir el video
        const playVideoSafely = async (retries = 2): Promise<boolean> => {
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              if (!videoRef.current) {
                throw new Error("Video element not found");
              }
              
              await videoRef.current.play();
              console.log("✅ Video reproduciéndose");
              return true;
              
            } catch (playError: any) {
              console.warn(`⚠️ Intento ${attempt} falló:`, playError.name, playError.message);
              
              if (playError.name === 'AbortError' && attempt < retries) {
                console.log("🔄 Esperando antes de reintentar...");
                await new Promise(resolve => setTimeout(resolve, 200 * attempt));
                continue;
              } else if (attempt === retries) {
                throw playError;
              }
            }
          }
          return false;
        };
        
        // Intentar reproducir video
        const videoStarted = await playVideoSafely();
        
        if (videoStarted && videoRef.current && !videoRef.current.paused) {
          console.log("🎬 Video estable - iniciando scanner...");
          
          // Esperar a que el video esté realmente listo
          await new Promise(resolve => {
            const checkReady = () => {
              if (videoRef.current && videoRef.current.readyState >= 2) {
                resolve(undefined);
              } else {
                setTimeout(checkReady, 100);
              }
            };
            checkReady();
          });
          
          setIsScanning(true);
          startScanning();
          console.log("✅ Scanner QR iniciado exitosamente");
        } else {
          throw new Error("No se pudo iniciar la reproducción de video");
        }
      } else {
        console.error("❌ No se encontró elemento de video");
        throw new Error("Elemento de video no encontrado");
      }
    } catch (err) {
      console.error("❌ Error al acceder a la cámara:", err);
      
      let errorMessage = "Error desconocido al acceder a la cámara";
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) {
          errorMessage = "Permisos de cámara denegados. Por favor, permite el acceso a la cámara.";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "No se encontró cámara en este dispositivo";
        } else if (err.name === 'NotReadableError') {
          errorMessage = "Cámara ocupada por otra aplicación";
        } else if (err.name === 'SecurityError') {
          errorMessage = "Error de seguridad - requiere HTTPS";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError, startScanning, facingMode]);



  // Función para detener la cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsScanning(false);
  }, []);

  // Función de reseteo simple
  const resetCameraState = useCallback(() => {
    console.log("🔄 Reseteando estado de la cámara");
    setError("");
    setIsScanning(false);
    setIsProcessing(false);
    setSuccess("");
    stopCamera();
  }, [stopCamera]);

  // Cambiar cámara (frontal/trasera)
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  }, []);

  // Efectos
  useEffect(() => {
    if (facingMode && isScanning) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [facingMode, startCamera, stopCamera, isScanning]);

  // Log de debug cuando el cliente está listo
  useEffect(() => {
    if (isClient) {
      console.log("QR Scanner Info:", getScannerInfo());
    }
  }, [isClient]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // No renderizar hasta que estemos en el cliente para evitar hidratación
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 bg-gray-300 rounded mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded mb-2 w-48" />
              <div className="h-3 bg-gray-200 rounded w-64" />
            </div>
          </div>
        </div>
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instrucciones simples */}
      {!isScanning && !error && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ScanLine className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Scanner QR de Reservas</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Al presionar "Iniciar Cámara" se solicitarán permisos</p>
                  <p>• Selecciona "Permitir" en el prompt del navegador</p>
                  <p>• Apunta la cámara al código QR para escanear</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso de Privacidad */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 mb-2">🔒 Tu privacidad es importante</h4>
                <div className="text-sm text-green-800 space-y-1 mb-3">
                  <p>✓ Solo usamos la cámara para escanear códigos QR</p>
                  <p>✓ Las imágenes NO se guardan ni se envían</p>
                  <p>✓ Puedes revocar el permiso en cualquier momento</p>
                </div>
                <a 
                  href="/privacy-policy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 hover:text-green-900 underline font-medium"
                >
                  Ver Política de Privacidad completa →
                </a>
              </div>
            </div>
          </div>
        </>
      )}



      {/* Controles simples */}
      <div className="flex flex-wrap gap-2 justify-center px-4">
        <Button
          onClick={() => {
            console.log("🖱️ Click directo del usuario - acción inmediata");
            if (isScanning) {
              stopCamera();
            } else {
              startCamera();
            }
          }}
          variant={isScanning ? "destructive" : "default"}
          className="min-h-[48px] px-6 text-base font-medium touch-manipulation"
          disabled={isProcessing}
        >
          {isScanning ? <CameraOff className="mr-2 h-5 w-5" /> : <Camera className="mr-2 h-5 w-5" />}
          <span className="hidden sm:inline">
            {isScanning ? "Detener Cámara" : "Iniciar Cámara"}
          </span>
          <span className="sm:hidden">
            {isScanning ? "Detener" : "Iniciar"}
          </span>
        </Button>
        
        {isScanning && (
          <Button
            onClick={switchCamera}
            variant="outline"
            className="min-h-[48px] px-4 text-base font-medium touch-manipulation"
            disabled={isProcessing}
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            <span className="hidden sm:inline">Cambiar Cámara</span>
            <span className="sm:hidden">Cambiar</span>
          </Button>
        )}

        {/* Botón de reintentar cuando hay error */}
        {error && !isScanning && (
          <Button
            onClick={() => {
              console.log("🔄 Usuario solicitó reintentar - usando reseteo completo");
              resetCameraState();
            }}
            variant="outline"
            className="min-h-[48px] px-6 text-base font-medium touch-manipulation border-orange-200 text-orange-600 hover:bg-orange-50"
            disabled={isProcessing}
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            <span className="hidden sm:inline">Reintentar Acceso a Cámara</span>
            <span className="sm:hidden">Reintentar</span>
          </Button>
        )}

      </div>

      {/* Área de escaneo */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full h-[280px] sm:h-[320px] md:h-[400px] bg-black flex items-center justify-center">
            {/* Video de la cámara */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
              autoPlay
              playsInline
              muted
              style={{ 
                maxHeight: '80vh',
                objectFit: 'cover'
              }}
            />
            
            {/* Canvas oculto para procesamiento */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Estado de cámara inactiva */}
            {!isScanning && (
              <div className="flex flex-col items-center gap-3 text-white px-4">
                <CameraOff className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-400" />
                <p className="text-gray-400 font-medium text-center text-sm sm:text-base">Cámara no activa</p>
                <p className="text-gray-500 text-xs sm:text-sm text-center max-w-xs sm:max-w-sm">
                  Presiona "Iniciar Cámara" para comenzar a escanear códigos QR
                </p>
              </div>
            )}
            
            {/* Overlay de escaneo responsive */}
            {isScanning && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 border-2 border-blue-400 rounded-lg relative">
                    <div className="absolute -top-1 -left-1 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                  </div>
                </div>
                
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/70 rounded-full px-2 py-1 sm:px-3 sm:py-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-xs font-medium">ESCANEANDO</span>
                  </div>
                </div>
                
                <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 pointer-events-none">
                  <div className="bg-black/70 rounded-lg px-3 py-2 text-center">
                    <span className="text-white text-xs sm:text-sm">
                      Coloca el código QR dentro del marco
                    </span>
                  </div>
                </div>
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-blue-900/30 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-white bg-black/50 p-4 rounded-lg">
                      <ScanLine className="h-8 w-8 sm:h-12 sm:w-12 animate-spin" />
                      <p className="font-semibold text-sm sm:text-base">Procesando QR...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de incremento de asistencia */}
      <Dialog open={showDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              QR Detectado - Registrar Asistencia
            </DialogTitle>
          </DialogHeader>
          
          {reservaDetectada && (
            <div className="space-y-4">
              {/* Información de la reserva */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-800">{reservaDetectada.cliente}</h4>
                <p className="text-sm text-gray-600">{reservaDetectada.telefono}</p>
                <p className="text-sm text-gray-600">
                  {reservaDetectada.fecha} - {reservaDetectada.hora}
                </p>
                {reservaDetectada.servicio && (
                  <p className="text-sm text-gray-600">{reservaDetectada.servicio}</p>
                )}
              </div>
              
              {/* Estado actual */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Estado actual:</p>
                <div className="text-lg font-semibold">
                  {reservaDetectada.actual}/{reservaDetectada.total}
                  {reservaDetectada.exceso > 0 && (
                    <span className="text-orange-600 ml-1">(+{reservaDetectada.exceso})</span>
                  )}
                </div>
              </div>
              
              {/* Contador de incremento */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decrementarAsistencia}
                  disabled={incrementoTemporal <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <div className="text-2xl font-bold min-w-[60px] text-center">
                  {incrementoTemporal}
                  <span className="text-lg text-blue-600">+</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={incrementarAsistencia}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Preview del resultado */}
              <div className="text-center text-sm text-gray-600">
                {(() => {
                  const nuevoTotal = reservaDetectada.actual + incrementoTemporal;
                  const exceso = Math.max(0, nuevoTotal - reservaDetectada.total);
                  return (
                    <span>
                      Resultado: {nuevoTotal}/{reservaDetectada.total}
                      {exceso > 0 && (
                        <span className="text-orange-600 font-semibold"> (+{exceso})</span>
                      )}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={cancelarYContinuar}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarIncremento}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
{(() => {
                if (isProcessing) return "Registrando...";
                const personaText = incrementoTemporal === 1 ? 'persona' : 'personas';
                return `Registrar ${incrementoTemporal} ${personaText}`;
              })()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Mensajes de estado */}
      {error && (
        <Alert variant="destructive" className="space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <AlertDescription className="mb-3">
                {error.includes("Permissions Policy") || error.includes("INSTANT_FAIL") || error.includes("MESSAGE_POLICY") || error.includes("CONFIRMED") ? (
                  <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <p className="font-bold text-red-800">🚫 PROBLEMA TÉCNICO DETECTADO</p>
                    </div>
                    <div className="text-sm space-y-2">
                      <p className="font-semibold text-red-700">⛔ Permissions Policy Violation</p>
                      <div className="bg-white p-3 rounded border-l-4 border-red-400">
                        <p className="font-medium text-gray-800">El navegador bloquea automáticamente la cámara</p>
                        <p className="text-gray-600 mt-1">
                          • No aparece el diálogo de permisos<br/>
                          • Falla instantáneamente sin dar opción al usuario<br/>
                          • Es un problema de configuración del servidor
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                        <p className="text-yellow-800 font-medium">✅ Configuración ya agregada al código</p>
                        <p className="text-yellow-700 text-xs">Se necesita reiniciar el servidor para aplicar cambios</p>
                      </div>
                    </div>
                  </div>
                ) : error.includes("bloqueados") || error.includes("denegado") ? (
                  <div className="space-y-2">
                    <p className="font-semibold">🚫 Error de Permisos de Cámara</p>
                    {error.includes("no bloqueaste manualmente") ? (
                      <div className="text-sm space-y-1">
                        <p className="text-orange-600 font-medium">⚠️ Situación inusual detectada</p>
                        <p>El navegador reporta permisos denegados, pero esto puede ser un error temporal o de configuración.</p>
                      </div>
                    ) : (
                      <p className="text-sm">El navegador tiene los permisos bloqueados para este sitio.</p>
                    )}
                  </div>
                ) : (
                  error
                )}
              </AlertDescription>
              
              {(error.includes("Permissions Policy") || error.includes("INSTANT_FAIL") || error.includes("MESSAGE_POLICY") || error.includes("CONFIRMED")) ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-green-800 font-semibold mb-2">🔧 SOLUCIÓN INMEDIATA:</p>
                    <p className="text-green-700 text-sm mb-3">
                      Ya se agregó la configuración necesaria. Solo falta reiniciar el servidor de desarrollo.
                    </p>
                    <Button
                      onClick={() => {
                        const instructions = [
                          "🔄 REINICIA EL SERVIDOR AHORA:",
                          "",
                          "1. 🛑 Ve a la terminal donde corre el servidor",
                          "2. ⌨️  Presiona Ctrl+C para detenerlo",
                          "3. ⚡ Ejecuta: npm run dev",
                          "4. ⏳ Espera que arranque completamente",
                          "5. 🔄 Recarga esta página",
                          "",
                          "Esto aplicará las configuraciones de Permissions Policy",
                          "que ya están en el código y solucionará el problema."
                        ];
                        
                        if (confirm(instructions.join('\n') + '\n\n¿Entendido? Click OK para continuar.')) {
                          // Mostrar indicador visual de que debe reiniciar
                          const indicator = document.createElement('div');
                          indicator.innerHTML = '� REINICIA EL SERVIDOR AHORA';
                          indicator.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:red;color:white;padding:10px 20px;border-radius:5px;z-index:9999;font-weight:bold;animation:blink 1s infinite;';
                          document.body.appendChild(indicator);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                      size="sm"
                    >
                      🚀 INSTRUCCIONES DE REINICIO
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-600">🔧 Opciones adicionales:</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => {
                        const isDev = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.');
                        const diagnosis = [
                          "🔍 DIAGNÓSTICO DE PERMISSIONS POLICY:",
                          "",
                          `📊 URL: ${window.location.href}`,
                          `📊 Entorno: ${isDev ? 'Desarrollo' : 'Producción'}`,
                          `📊 En iframe: ${window !== window.top ? 'Sí' : 'No'}`,
                          `📊 Origen: ${window.location.origin}`,
                          `📊 Protocolo: ${window.location.protocol}`,
                          "",
                          "� ESTADO ACTUAL:",
                          "✅ Headers de Permissions Policy agregados en next.config.js",
                          "✅ Meta tag de Permissions Policy agregado en layout.tsx",
                          "",
                          "💡 SOLUCIONES:",
                          isDev ? "🔄 DESARROLLO: Reinicia el servidor (npm run dev)" : "🚀 PRODUCCIÓN: Redeploy necesario",
                          "🪟 Probar en nueva pestaña/ventana incógnito",
                          "🔄 Limpiar caché del navegador completamente"
                        ];
                        alert(diagnosis.join('\n'));
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs border-red-200 text-red-600"
                    >
                      🔍 Info Técnica
                    </Button>
                    
                    <Button
                      onClick={() => {
                        const newUrl = window.location.href.includes('?') ? 
                          `${window.location.href}&camera_debug=1` : 
                          `${window.location.href}?camera_debug=1`;
                        window.open(newUrl, '_blank');
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs border-blue-200 text-blue-600"
                    >
                      🪟 Abrir en Nueva Pestaña
                    </Button>
                    
                    <Button
                      onClick={() => {
                        alert("🔄 REINICIA EL SERVIDOR:\n\n1. Ve a la terminal donde está corriendo el servidor\n2. Presiona Ctrl+C para detenerlo\n3. Ejecuta: npm run dev\n4. Espera a que arranque completamente\n5. Recarga esta página\n\nEsto aplicará las nuevas configuraciones de Permissions Policy.");
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs border-green-200 text-green-600"
                    >
                      🔄 Reiniciar Servidor
                    </Button>
                    
                    <Button
                      onClick={() => {
                        // Intento de bypass temporal
                        const bypassUrl = `${window.location.origin}/reservas-new?bypass_policy=1&timestamp=${Date.now()}`;
                        window.open(bypassUrl, '_self');
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs border-purple-200 text-purple-600"
                    >
                      🚀 Bypass Temporal
                    </Button>
                  </div>
                </div>
              ) : (error.includes("bloqueados") || error.includes("denegado")) && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      🔄 Recargar Página
                    </Button>
                    
                    <Button
                      onClick={() => {
                        alert("🔧 CÓMO ARREGLAR PERMISOS DE CÁMARA:\n\n1. 🔒 Haz click en el ícono de candado (o información del sitio) en la barra de direcciones\n\n2. 📷 Busca la opción 'Cámara' y cámbiala a 'Permitir'\n\n3. 🔄 Recarga la página (F5 o Ctrl+R)\n\n4. ▶️ Intenta de nuevo\n\nSi sigue sin funcionar:\n• Cierra todas las pestañas de este sitio\n• Reinicia el navegador\n• Prueba en modo incógnito");
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      ❓ Cómo Arreglar
                    </Button>
                  </div>
                  
                  {error.includes("no bloqueaste manualmente") && (
                    <div className="border-t pt-2">
                      <p className="text-xs text-gray-600 mb-2">💡 Diagnósticos adicionales:</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => {
                            console.log("🔍 Usuario reporta que NO bloqueó - iniciando diagnóstico avanzado");
                            navigator.permissions?.query({ name: 'camera' as PermissionName }).then(permission => {
                              const diagnosis = [
                                "🔍 DIAGNÓSTICO AVANZADO:",
                                `📋 Estado actual: ${permission.state}`,
                                `🌐 URL: ${window.location.href}`,
                                `🔒 HTTPS: ${window.location.protocol === 'https:' ? 'Sí' : 'No'}`,
                                `🖥️ Navegador: ${navigator.userAgent.split(' ')[0]}`,
                                "",
                                permission.state === 'prompt' ? "⚠️ PARADOJA CONFIRMADA: Estado es 'prompt' pero getUserMedia falla" : 
                                permission.state === 'denied' ? "🔴 Permisos efectivamente bloqueados" :
                                "✅ Permisos granted - posible bug del navegador"
                              ];
                              alert(diagnosis.join('\n'));
                            }).catch(() => {
                              alert("❌ No se pudo obtener información de permisos del navegador");
                            });
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs border-blue-200 text-blue-600"
                        >
                          🔍 Diagnóstico
                        </Button>
                        
                        <Button
                          onClick={() => {
                            if (confirm("🔄 Esto intentará un reseteo completo del estado de permisos.\n\n¿Continuar?")) {
                              // Limpiar localStorage relacionado con perміsos
                              const keys = Object.keys(localStorage);
                              keys.forEach(key => {
                                if (key.includes('permission') || key.includes('camera')) {
                                  localStorage.removeItem(key);
                                }
                              });
                              
                              // Forzar recarga completa
                              window.location.reload();
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs border-purple-200 text-purple-600"
                        >
                          🧹 Reset Completo
                        </Button>
                      </div>
                    </div>
                  )}
                  
                </div>
              )}
            </div>
          </div>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-600 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
