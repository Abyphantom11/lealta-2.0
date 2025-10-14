"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Camera, CameraOff, RotateCcw, CheckCircle, AlertTriangle, Users } from "lucide-react";
import jsQR from "jsqr";
import { useIsClient } from "./hooks/useClient";

interface QRScannerCleanProps {
  onScan: (qrCode: string) => Promise<void>;
  onError?: (error: string) => void;
  onRefreshNeeded?: (reservaId?: string, nuevaAsistencia?: number) => void; // ✅ OPTIMISTIC: Callback con datos específicos
  businessId?: string;
}

interface ReservaDetectada {
  reservaId: string;
  token: string;
  clienteNombre: string; // ✅ Agregar nombre específico del cliente
  cliente: string;       // Mantener compatibilidad
  telefono: string;
  fecha: string;
  hora: string;
  servicio: string;
  total: number;
  actual: number;
  exceso: number;
}

export function QRScannerClean({ onScan, onError, onRefreshNeeded, businessId }: Readonly<QRScannerCleanProps>) {
  const isClient = useIsClient();
  
  // Estados básicos
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados para el diálogo de incremento
  const [showDialog, setShowDialog] = useState(false);
  const [reservaDetectada, setReservaDetectada] = useState<ReservaDetectada | null>(null);
  // ✅ Ya no usamos incrementoTemporal - siempre será +1
  
  // Referencias
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para obtener información del QR sin incrementar
  const getQRInfo = useCallback(async (qrData: string) => {
    // DEBUG: Log de los datos QR que está leyendo el scanner
    console.log('🔍 QRScanner DEBUG - Datos leídos del QR:', qrData);
    
    console.log('📡 QRScanner DEBUG - Enviando al endpoint unificado:', { qrCode: qrData, action: 'info', businessId });
    
    const response = await fetch('/api/reservas/qr-scan', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(businessId && { 'x-business-id': businessId })
      },
      body: JSON.stringify({ 
        qrCode: qrData, 
        action: 'info',
        businessId 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ QRScanner DEBUG - Error del endpoint:', errorData);
      throw new Error(errorData.message || 'Error al procesar QR');
    }

    const result = await response.json();
    console.log('✅ QRScanner DEBUG - Respuesta del endpoint:', result);
    return result;
  }, [businessId]);

  // Función para escanear QR optimizada
  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isProcessing || showDialog) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    try {
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        // Detener el escaneo inmediatamente
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        
        // Procesar QR inline para evitar dependencias circulares
        (async () => {
          if (isProcessing) return;
          
          try {
            setIsProcessing(true);
            
            // DEBUG: Log de los datos brutos del QR escaneado
            console.log('📷 QRScanner DEBUG - QR detectado, datos brutos:', code.data);
            console.log('📏 QRScanner DEBUG - Longitud de datos:', code.data.length);
            
            const result = await getQRInfo(code.data);
            
            if (result.success && result.reservaId) {
              const reservaInfo: ReservaDetectada = {
                reservaId: result.reservaId,
                token: result.token || '',
                clienteNombre: result.cliente?.nombre || result.cliente?.name || 'Cliente Sin Nombre', // ✅ Nombre específico
                cliente: result.cliente?.nombre || result.cliente?.name || 'Cliente',
                telefono: result.cliente?.telefono || result.cliente?.phone || '',
                fecha: result.reserva?.fecha || '',
                hora: result.reserva?.hora || '',
                servicio: result.reserva?.servicio || '',
                total: result.maxAsistencia || 1,
                actual: result.incrementCount || 0,
                exceso: Math.max(0, (result.incrementCount || 0) - (result.maxAsistencia || 1))
              };
              
              setReservaDetectada(reservaInfo);
              // ✅ Ya no inicializamos incrementoTemporal - siempre será +1
              setShowDialog(true);
              
              await onScan(code.data);
            } else {
              setError(result.message || 'Error al procesar QR');
              // Reiniciar escaneo después de 2 segundos
              setTimeout(() => {
                if (scanIntervalRef.current === null && isScanning) {
                  scanIntervalRef.current = setInterval(scanQRCode, 200);
                }
              }, 2000);
            }
            
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al procesar QR";
            setError(errorMessage);
            onError?.(errorMessage);
            // Reiniciar escaneo después de 2 segundos
            setTimeout(() => {
              if (scanIntervalRef.current === null && isScanning) {
                scanIntervalRef.current = setInterval(scanQRCode, 200);
              }
            }, 2000);
          } finally {
            setIsProcessing(false);
          }
        })();
      }
    } catch {
      // Ignorar errores de escaneo para no saturar la consola
    }
  }, [isProcessing, showDialog, getQRInfo, onScan, onError, isScanning]);



  // Función simple para iniciar cámara
  const startCamera = useCallback(async () => {
    try {
      setError("");
      setSuccess("");
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia no soportado en este navegador");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        setIsScanning(true);
        // Iniciar escaneo inline
        scanIntervalRef.current ??= setInterval(scanQRCode, 200);
      }
      
    } catch (err: any) {
      let errorMessage = "Error desconocido al acceder a la cámara";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "Permisos de cámara denegados. Permite el acceso y recarga.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "No se encontró cámara en este dispositivo.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "Cámara ocupada por otra aplicación.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [facingMode, onError, scanQRCode]);

  // Función para detener cámara
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



  // Función para cambiar cámara
  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    if (isScanning) {
      stopCamera();
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: newFacingMode,
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 }
            },
            audio: false
          });

          streamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            
            setIsScanning(true);
            scanIntervalRef.current ??= setInterval(scanQRCode, 200);
          }
        } catch (err: any) {
          setError("Error al cambiar cámara: " + (err.message || "Error desconocido"));
        }
      }, 500);
    }
  }, [facingMode, isScanning, stopCamera, scanQRCode]);

  // ✅ Funciones de incremento/decremento eliminadas - ya no son necesarias

  // Función para confirmar el incremento (siempre +1)
  const confirmarIncremento = useCallback(async () => {
    if (!reservaDetectada) return;
    
    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/reservas/qr-scan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(businessId && { 'x-business-id': businessId })
        },
        body: JSON.stringify({ 
          qrCode: `res-${reservaDetectada.reservaId}`, // Usar formato simple
          action: 'increment',
          increment: 1, // ✅ Siempre incrementar en 1
          businessId
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
      
      // ✅ OPTIMISTIC: Notificar refrescar con datos específicos para actualización inmediata
      if (onRefreshNeeded) {
        onRefreshNeeded(reservaDetectada.reservaId, nuevoActual);
      }
      
      // Cerrar diálogo y reiniciar escaneo
      setShowDialog(false);
      setReservaDetectada(null);
      // ✅ Ya no reseteamos incrementoTemporal
      
      setTimeout(() => {
        if (isScanning && scanIntervalRef.current === null) {
          scanIntervalRef.current = setInterval(scanQRCode, 200);
        }
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al confirmar incremento";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [reservaDetectada, isScanning, scanQRCode, businessId, onRefreshNeeded]); // ✅ incrementoTemporal eliminado de dependencies

  // Función para cancelar y continuar
  const cancelarYContinuar = useCallback(() => {
    setShowDialog(false);
    setReservaDetectada(null);
    // ✅ Ya no reseteamos incrementoTemporal
    
    if (isScanning && scanIntervalRef.current === null) {
      scanIntervalRef.current = setInterval(scanQRCode, 200);
    }
  }, [isScanning, scanQRCode]);

  // No renderizar en SSR
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Cargando scanner...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* Controles */}
      <div className="flex gap-2">
        <Button
          onClick={isScanning ? stopCamera : startCamera}
          variant="default"
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white border-gray-900"
          disabled={isProcessing}
        >
          {isScanning ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
          {isScanning ? "Detener" : "Iniciar Cámara"}
        </Button>
        
        {isScanning && (
          <Button 
            onClick={switchCamera} 
            variant="outline" 
            disabled={isProcessing}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-600 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Video */}
      <Card>
        <CardContent className="p-0">
          <div className="relative w-full h-64 bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
              autoPlay
              playsInline
              muted
            />
            
            {!isScanning && (
              <div className="text-white text-center">
                <Camera className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>Presiona "Iniciar Cámara" para escanear QR</p>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-blue-900/30 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-white bg-black/50 p-4 rounded-lg">
                  <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  <p className="font-semibold text-sm">Procesando QR...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Canvas oculto */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Diálogo de incremento */}
      <Dialog open={showDialog} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md bg-white border border-gray-200 shadow-xl" 
          style={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Reserva Detectada - Registrar Asistencia
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Ajusta la cantidad de personas que asistieron a esta reserva.
            </DialogDescription>
          </DialogHeader>
          
          {reservaDetectada && (
            <div className="space-y-4">
              {/* Información de la reserva */}
              <div className="bg-gray-100 border border-gray-200 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-1">Cliente: {reservaDetectada.clienteNombre}</h4>
                {reservaDetectada.telefono && (
                  <p className="text-sm text-gray-600">{reservaDetectada.telefono}</p>
                )}
                <p className="text-sm text-gray-600">
                  {reservaDetectada.fecha} - {reservaDetectada.hora}
                </p>
                {reservaDetectada.servicio && (
                  <p className="text-sm text-gray-600">{reservaDetectada.servicio}</p>
                )}
              </div>
              
              {/* Estado actual */}
              <div className="text-center bg-blue-50 p-3 rounded-lg border">
                <p className="text-sm font-medium text-gray-700 mb-2">Estado actual:</p>
                <div className="text-2xl font-bold text-gray-900">
                  <span className="text-blue-600">{reservaDetectada.actual}</span>
                  <span className="text-gray-400 mx-2">/</span>
                  <span className="text-gray-600">{reservaDetectada.total}</span>
                  {reservaDetectada.exceso > 0 && (
                    <span className="text-orange-600 ml-2 text-lg">(+{reservaDetectada.exceso})</span>
                  )}
                </div>
              </div>
              
              {/* Mensaje de registro */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <p className="text-lg font-semibold text-green-800">
                    ✓ Registrado
                  </p>
                </div>
              </div>
              
              {/* Preview del resultado */}
              <div className="text-center text-sm text-gray-600">
                {(() => {
                  const nuevoTotal = reservaDetectada.actual + 1; // ✅ Siempre +1
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
              className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarIncremento}
              disabled={isProcessing}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium border-0"
              style={{ 
                backgroundColor: '#111827', 
                color: '#ffffff', 
                borderColor: '#111827' 
              }}
            >
              {isProcessing ? "Procesando..." : "Confirmar Asistencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
