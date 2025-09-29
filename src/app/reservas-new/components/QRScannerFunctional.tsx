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
      // Llamar directamente a handleQRDetected en lugar de usar useCallback
      (async (qrData: string) => {
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
          
          // Obtener información de la reserva sin incrementar aún
          const result = await getQRInfo(qrData);
          
          if (result.success && result.reservaId) {
            // Configurar la reserva detectada
            const reservaInfo: ReservaDetectada = {
              reservaId: result.reservaId,
              token: result.token || '', // Guardar token para incrementos posteriores
              cliente: result.cliente?.nombre || 'Cliente',
              telefono: result.cliente?.telefono || '',
              fecha: result.reserva?.fecha || '',
              hora: result.reserva?.hora || '',
              servicio: result.reserva?.servicio || '',
              total: result.maxAsistencia || 1,
              actual: result.incrementCount || 0,
              exceso: Math.max(0, (result.incrementCount || 0) - (result.maxAsistencia || 1))
            };
            
            setReservaDetectada(reservaInfo);
            setIncrementoTemporal(1); // Comenzar con 1 persona detectada
            setShowDialog(true);
            
            await onScan(qrData);
          } else {
            setError(result.message || 'Error al procesar QR');
          }
          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Error al procesar QR";
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
      
      // Verificación básica
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia no soportado en este navegador");
      }
      
      // VERIFICAR PERMISSIONS POLICY PRIMERO
      console.log("🔍 === VERIFICANDO PERMISSIONS POLICY ===");
      
      // Verificar si estamos en un iframe
      const isInIframe = window !== window.top;
      console.log("📊 En iframe:", isInIframe);
      console.log("📊 URL actual:", window.location.href);
      console.log("📊 Origen:", window.location.origin);
      
      // === ANÁLISIS PROFUNDO DE PERMISSIONS POLICY ===
      console.log("🔍 === ANÁLISIS PROFUNDO DE PERMISSIONS POLICY ===");
      
      // 1. Verificar headers HTTP
      console.log("📡 Verificando headers HTTP...");
      try {
        const response = await fetch(window.location.href, { method: 'HEAD' });
        const permissionsPolicyHeader = response.headers.get('Permissions-Policy');
        const featurePolicyHeader = response.headers.get('Feature-Policy');
        
        console.log("📋 Header Permissions-Policy:", permissionsPolicyHeader);
        console.log("📋 Header Feature-Policy (legacy):", featurePolicyHeader);
        
        if (!permissionsPolicyHeader && !featurePolicyHeader) {
          console.warn("⚠️ NO HAY HEADERS DE PERMISSIONS POLICY");
          console.warn("💡 Esto significa que la configuración del servidor no se aplicó");
        }
      } catch (headerError) {
        console.error("❌ Error verificando headers:", headerError);
      }
      
      // 2. Verificar meta tags
      console.log("🏷️ Verificando meta tags...");
      const metaTags = document.querySelectorAll('meta[http-equiv*="Permissions-Policy"], meta[http-equiv*="Feature-Policy"]');
      console.log("📋 Meta tags encontrados:", metaTags.length);
      metaTags.forEach((tag, index) => {
        console.log(`📋 Meta tag ${index + 1}:`, tag.getAttribute('http-equiv'), '=', tag.getAttribute('content'));
      });
      
      // 3. Verificar contexto del documento
      console.log("📄 Verificando contexto del documento...");
      console.log("📋 URL:", window.location.href);
      console.log("📋 Protocolo:", window.location.protocol);
      console.log("📋 Host:", window.location.host);
      console.log("📋 En iframe:", window !== window.top);
      console.log("📋 Contexto seguro (isSecureContext):", window.isSecureContext);
      
      if (window !== window.top) {
        console.log("🔍 Analizando iframe...");
        try {
          console.log("� URL del parent:", window.top?.location.href || "No accesible");
        } catch (error) {
          console.log("� Parent origen diferente - cross-origin iframe", error instanceof Error ? error.message : 'Error desconocido');
        }
      }
      
      // 4. Verificar Feature Policy API
      const featurePolicy = (document as any).featurePolicy;
      if (featurePolicy) {
        console.log("🔍 Feature Policy API disponible");
        
        // Verificar múltiples features
        const features = ['camera', 'microphone', 'geolocation'];
        features.forEach(feature => {
          try {
            const allowed = featurePolicy.allowsFeature(feature);
            console.log(`📋 ${feature} permitido:`, allowed);
            
            if (feature === 'camera' && !allowed) {
              // Intentar obtener más detalles
              try {
                const allowedOrigins = featurePolicy.getAllowlistForFeature(feature);
                console.log("📋 Orígenes permitidos para cámara:", allowedOrigins);
              } catch (allowlistError: unknown) {
                const errorMessage = allowlistError instanceof Error ? allowlistError.message : 'Error desconocido';
                console.log("📋 No se pudo obtener allowlist para cámara:", errorMessage);
              }
            }
          } catch (featureError) {
            console.log(`❌ Error verificando ${feature}:`, featureError);
          }
        });
        
        // Si la cámara está bloqueada, no lanzar error inmediatamente
        // Vamos a intentar getUserMedia para obtener más información
        const cameraAllowed = featurePolicy.allowsFeature('camera');
        if (!cameraAllowed) {
          console.error("🚫 FEATURE POLICY INDICA CÁMARA BLOQUEADA");
          console.error("💡 Pero vamos a intentar getUserMedia para más detalles...");
          // NO lanzar error aquí - continuar con el análisis
        }
      } else {
        console.log("ℹ️ Feature Policy API no disponible en este navegador");
        console.log("💡 Esto es normal en navegadores más antiguos");
      }
      
      // Verificación básica
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia no soportado");
      }
      
      // ANÁLISIS DETALLADO DE PERMISOS
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log("🔐 === ESTADO ACTUAL DE PERMISOS ===");
          console.log("📋 Estado:", permissionStatus.state);
          console.log("🕐 Verificado en:", new Date().toISOString());
          
          // Análisis específico por estado
          switch (permissionStatus.state) {
            case 'denied':
              console.error("🚫 DENIED - Permisos bloqueados previamente");
              console.error("💡 Esto significa que:");
              console.error("   - Usuario bloqueó anteriormente");
              console.error("   - O hay política del navegador/sitio");
              console.error("   - Debe resetear permisos manualmente");
              setError("Permisos de cámara bloqueados previamente. Resetea permisos del sitio.");
              return;
              
            case 'granted':
              console.log("✅ GRANTED - Permisos ya concedidos, debería funcionar");
              break;
              
            case 'prompt':
              console.log("❓ PROMPT - Se mostrará diálogo al usuario");
              console.log("⚠️ Si falla después del prompt, puede ser:");
              console.log("   - Usuario canceló el diálogo");
              console.log("   - Timing issue del navegador");
              console.log("   - Conflicto con otras pestañas");
              break;
          }
          
          // Monitorear cambios de perميsos
          permissionStatus.addEventListener('change', () => {
            console.log("🔄 Cambio en permisos detectado:", permissionStatus.state);
          });
          
        } catch (permError) {
          console.log("ℹ️ No se puede verificar permisos:", permError);
        }
      }
      
      console.log("🔍 Solicitando stream de video...");
      console.log("🕐 Timestamp:", new Date().toISOString());
      
      // VERIFICAR PERMISSIONS POLICY ANTES DE LA LLAMADA
      console.log("🔍 === VERIFICACIÓN PRE-LLAMADA ===");
      
      // Test rápido para detectar Permissions Policy
      const testElement = document.createElement('div');
      testElement.style.display = 'none';
      document.body.appendChild(testElement);
      
      try {
        // Intentar verificar con feature policy si está disponible
        const featurePolicy2 = (document as any).featurePolicy;
        if (featurePolicy2 && !featurePolicy2.allowsFeature('camera')) {
          console.error("🚫 PERMISSIONS POLICY BLOCKING DETECTADO PRE-LLAMADA");
          document.body.removeChild(testElement);
          throw new Error("CONFIRMED: Permissions Policy blocks camera - server restart needed");
        }
      } catch (fpError) {
        console.log("⚠️ Error verificando feature policy:", fpError);
      }
      
      document.body.removeChild(testElement);
      
      // === ANÁLISIS DETALLADO DE getUserMedia ===
      console.log("🎯 === INICIANDO ANÁLISIS DE getUserMedia ===");
      
      let stream;
      const startTime = performance.now();
      
      // Verificar que navigator.mediaDevices.getUserMedia existe
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error("❌ navigator.mediaDevices.getUserMedia no disponible");
        throw new Error("getUserMedia no soportado en este navegador");
      }
      
      // Configuraciones de prueba para getUserMedia
      const testConfigurations = [
        {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          },
          audio: false
        },
        {
          video: {
            facingMode: facingMode,
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          },
          audio: false
        },
        {
          video: {
            facingMode: facingMode
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];
      
      console.log("🧪 Probando diferentes configuraciones de getUserMedia...");
      
      for (let i = 0; i < testConfigurations.length; i++) {
        const config = testConfigurations[i];
        console.log(`🧪 Configuración ${i + 1}:`, JSON.stringify(config));
        
        const testStartTime = performance.now();
        
        try {
          const testStream = await navigator.mediaDevices.getUserMedia(config);
          const testEndTime = performance.now();
          const testDuration = testEndTime - testStartTime;
          
          console.log(`✅ Configuración ${i + 1} EXITOSA en ${testDuration.toFixed(2)}ms`);
          
          // Si una configuración funciona, usar esa
          if (testStream) {
            stream = testStream;
            console.log("🎉 getUserMedia exitoso con configuración:", JSON.stringify(config));
            break;
          }
          
        } catch (testError: any) {
          const testEndTime = performance.now();
          const testDuration = testEndTime - testStartTime;
          
          console.error(`❌ Configuración ${i + 1} falló en ${testDuration.toFixed(2)}ms:`, testError.name, testError.message);
          
          // Analizar el tipo de error
          if (testError.name === 'NotAllowedError') {
            console.error("🚫 NotAllowedError detectado");
            
            if (testDuration < 50) {
              console.error("⚡ FALLO INSTANTÁNEO - Probablemente Permissions Policy");
            } else if (testDuration > 1000) {
              console.error("⏱️ FALLO DESPUÉS DE TIEMPO - Usuario probablemente denegó");
            } else {
              console.error("🤔 FALLO EN TIEMPO MEDIO - Situación ambigua");
            }
          } else if (testError.name === 'NotFoundError') {
            console.error("� No se encontró cámara");
          } else if (testError.name === 'NotReadableError') {
            console.error("🔒 Cámara en uso por otra aplicación");
          } else if (testError.name === 'OverconstrainedError') {
            console.error("🎛️ Configuración de constraints imposible");
          }
          
          // Si es el último intento y no funcionó ninguno
          if (i === testConfigurations.length - 1) {
            console.error("❌ === TODAS LAS CONFIGURACIONES FALLARON ===");
            throw testError;
          }
        }
      }
      
      if (!stream) {
        throw new Error("No se pudo obtener stream con ninguna configuración");
      }
      
      // === ANÁLISIS POST-ÉXITO ===
      const totalTime = performance.now() - startTime;
      console.log(`🎉 === getUserMedia EXITOSO en ${totalTime.toFixed(2)}ms total ===`);
      
      // Información del stream obtenido
      console.log("📹 Información del stream:");
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const track = videoTracks[0];
        console.log("📋 Label de la cámara:", track.label);
        console.log("📋 ID del dispositivo:", track.getSettings().deviceId);
        console.log("📋 Resolución:", track.getSettings().width, "x", track.getSettings().height);
        console.log("📋 FacingMode:", track.getSettings().facingMode);
      }
      
      // Verificar que realmente no era Permissions Policy
      if (totalTime < 100) {
        console.warn("⚠️ NOTA: Éxito muy rápido - puede haber sido permisos previamente concedidos");
      } else {
        console.log("✅ Tiempo normal - usuario interactuó con el diálogo de permisos");
      }
      
      console.log("🎉 getUserMedia exitoso!");
      console.log("🕐 Timestamp éxito:", new Date().toISOString());
      
      console.log("✅ Stream obtenido exitosamente:");
      console.log("- ID:", stream.id);
      console.log("- Tracks:", stream.getVideoTracks().length);
      console.log("- Activo:", stream.active);

      streamRef.current = stream;
      
      console.log("🎬 Configurando elemento de video...");
      
      if (videoRef.current) {
        console.log("- Video element encontrado");
        
        videoRef.current.srcObject = stream;
        console.log("- Stream asignado al video");
        
        // Configurar atributos para reproducción
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        console.log("- Configurando reproducción de video...");
        
        // Función para manejar reproducción robusta
        const playVideoSafely = async (retries = 3): Promise<boolean> => {
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              console.log(`📹 Intento de reproducción ${attempt}/${retries}`);
              
              // Verificar que el video element existe
              if (!videoRef.current) {
                throw new Error("Video element not found");
              }
              
              // Resetear el video element
              if (!videoRef.current.paused) {
                videoRef.current.pause();
              }
              videoRef.current.currentTime = 0;
              
              // Intentar reproducir
              const playPromise = videoRef.current.play();
              
              if (playPromise !== undefined) {
                await playPromise;
                console.log("✅ Video reproduciéndose correctamente");
                return true;
              }
              
              return false;
              
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
      console.error("❌ === ERROR EN STARTCAMERA ===");
      console.error("Error completo:", err);
      
      let errorMessage = "Error desconocido al acceder a la cámara";
      
      if (err instanceof Error) {
        console.error("- Tipo de error:", err.name);
        console.error("- Mensaje:", err.message);
        
        if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) {
          console.error("🚫 === ANÁLISIS DETALLADO DE NotAllowedError ===");
          console.error("🕐 Timestamp:", new Date().toISOString());
          
          // Verificar estado ACTUAL de permisos para diagnosticar
          if (navigator.permissions) {
            try {  
              navigator.permissions.query({ name: 'camera' as PermissionName }).then(permission => {
                console.error("📋 Estado ACTUAL de permisos:", permission.state);
                
                if (permission.state === 'denied') {
                  console.error("🔴 CONFIRMADO: Permisos definitivamente bloqueados");
                  console.error("💡 Usuario debe ir a configuración del navegador");
                } else if (permission.state === 'prompt') {
                  console.error("🟡 PARADOJA: Estado 'prompt' pero getUserMedia falló");
                  console.error("💡 Posibles causas:");
                  console.error("   - Usuario cerró diálogo sin responder");
                  console.error("   - Cámara ocupada por otra pestaña");
                  console.error("   - Bug temporal del navegador");
                  console.error("   - Política HTTPS/contexto seguro");
                } else if (permission.state === 'granted') {
                  console.error("🔴 ERROR CRÍTICO: Granted pero getUserMedia falló!");
                  console.error("💡 Esto es muy raro - posible bug del navegador");
                }
              });
            } catch (permError) {
              console.error("❌ No se pudo verificar permisos:", permError);
            }
          }
          
          console.error("🔍 Detalles adicionales del contexto:");
          console.error("- URL actual:", window.location.href);
          console.error("- Protocolo:", window.location.protocol);
          console.error("- Es HTTPS:", window.location.protocol === 'https:');
          console.error("- User Agent:", navigator.userAgent.substring(0, 100));
          
          errorMessage = "Permisos de cámara denegados. Si no bloqueaste manualmente, resetea permisos del sitio.";
          console.error("💡 SOLUCIÓN: Resetear permisos en configuración del navegador");
        } else if (err.name === 'NotFoundError') {
          errorMessage = "No se encontró cámara en este dispositivo";
          console.error("📷 No hay cámara disponible");
        } else if (err.name === 'NotReadableError') {
          errorMessage = "Cámara ocupada por otra aplicación";
          console.error("🔒 Cámara en uso por otra app");
        } else if (err.name === 'SecurityError') {
          errorMessage = "Error de seguridad - requiere HTTPS";
          console.error("🔐 Problema de contexto seguro");
        } else if (err.message?.includes('Permissions policy violation') || 
                   err.message?.includes('camera is not allowed') ||
                   err.message?.includes('camera blocked by site configuration') ||
                   err.message?.includes('CONFIRMED: Permissions Policy') ||
                   err.message?.includes('INSTANT_FAIL: Permissions Policy') ||
                   err.message?.includes('MESSAGE_POLICY: Permissions Policy') ||
                   err.message?.includes('Permissions Policy bloquea el acceso a la cámara')) {
          console.error("🚫 === PERMISSIONS POLICY VIOLATION DETECTADA ===");
          console.error("💡 El problema NO es de permisos del usuario");
          console.error("💡 Es una configuración de Permissions Policy del sitio");
          console.error("🔍 Causas identificadas:");
          console.error("   ✅ Headers de Permissions Policy agregados");
          console.error("   ✅ Meta tag de Permissions Policy agregado");
          console.error("   ❌ Servidor necesita reiniciarse para aplicar cambios");
          console.error("   - O sitio cargado en iframe problemático");
          console.error("   - O configuración de Vercel/deployment");
          
          errorMessage = "Permissions Policy bloquea la cámara. Reinicia el servidor para aplicar configuración.";
        } else {
          errorMessage = `Error: ${err.message}`;
          console.error("❓ Error no categorizado");
        }
      }
      
      console.error("📝 Mensaje final para usuario:", errorMessage);
      
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

  // Función de reseteo completo para problemas de permisos
  const resetCameraState = useCallback(() => {
    console.log("🔄 === RESETEO COMPLETO DEL ESTADO ===");
    
    // Limpiar todos los estados
    setError("");
    setIsScanning(false);
    setIsProcessing(false);
    setSuccess("");
    
    // Detener cualquier cámara activa
    stopCamera();
    
    console.log("⏳ Esperando 800ms antes de reintentar...");
    // Esperar antes de reintentar para evitar problemas de timing
    setTimeout(() => {
      console.log("🚀 Reintentando startCamera después del reseteo...");
      // Usar una nueva instancia para evitar dependencias circulares
      const retryCamera = async () => {
        try {
          const constraints = {
            video: {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          };
          
          const stream = await navigator.mediaDevices?.getUserMedia(constraints);
          if (stream && videoRef.current) {
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            setIsScanning(true);
            console.log("✅ Cámara reiniciada exitosamente");
          }
        } catch (err) {
          console.error("❌ Error al reiniciar cámara:", err);
          setError("Error al reiniciar la cámara");
        }
      };
      retryCamera();
    }, 800);
  }, [stopCamera, facingMode]);

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
