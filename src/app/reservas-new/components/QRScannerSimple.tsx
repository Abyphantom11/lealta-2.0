"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Camera, CameraOff, RotateCcw } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerSimpleProps {
  onScan: (qrCode: string) => Promise<void>;
  onError?: (error: string) => void;
}

export function QRScannerSimple({ onScan, onError }: Readonly<QRScannerSimpleProps>) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función simple para detener cámara
  const stopCamera = useCallback(() => {
    console.log("🛑 Deteniendo cámara...");
    
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



  // Función simple para iniciar cámara
  const startCamera = useCallback(async () => {
    try {
      setError("");
      console.log("🎥 Iniciando cámara simple...");
      
      // Solo cámara, NO micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      console.log("✅ Stream obtenido");
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        setIsScanning(true);
        
        // Iniciar escaneo cada 200ms
        scanIntervalRef.current = setInterval(() => {
          if (!videoRef.current || !canvasRef.current) return;

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
              console.log("🎯 QR detectado:", code.data);
              
              // Detener inmediatamente
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
              }
              
              if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
              }
              
              setIsScanning(false);
              onScan(code.data);
            }
          } catch (scanError) {
            console.warn("Error de escaneo:", scanError);
          }
        }, 200);
        
        console.log("✅ Scanner iniciado");
      }
      
    } catch (err: any) {
      console.error("❌ Error:", err);
      
      if (err.name === 'NotAllowedError') {
        setError("Permisos de cámara denegados. Permite el acceso y recarga.");
      } else if (err.name === 'NotFoundError') {
        setError("No se encontró cámara en este dispositivo.");
      } else {
        setError("Error al acceder a la cámara: " + err.message);
      }
      
      onError?.(err.message);
    }
  }, [facingMode, onError, onScan]);

  // Cambiar cámara
  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    if (isScanning) {
      // Detener manualmente sin referencia circular
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      
      setIsScanning(false);
      setTimeout(async () => {
        // Reiniciar cámara con nuevo facingMode inline
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: newFacingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });

          streamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            
            setIsScanning(true);
            
            // Reiniciar escaneo
            scanIntervalRef.current = setInterval(() => {
              if (!videoRef.current || !canvasRef.current) return;

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
                  console.log("🎯 QR detectado:", code.data);
                  
                  // Detener inmediatamente
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                  }
                  
                  if (scanIntervalRef.current) {
                    clearInterval(scanIntervalRef.current);
                    scanIntervalRef.current = null;
                  }
                  
                  setIsScanning(false);
                  onScan(code.data);
                }
              } catch (scanError) {
                console.warn("Error de escaneo:", scanError);
              }
            }, 200);
          }
        } catch (err: any) {
          console.error("❌ Error al cambiar cámara:", err);
          setError("Error al cambiar cámara: " + err.message);
        }
      }, 100);
    }
  }, [facingMode, isScanning, onScan]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      // Limpiar sin referencia circular
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* Controles */}
      <div className="flex gap-2">
        <Button
          onClick={isScanning ? stopCamera : startCamera}
          variant={isScanning ? "destructive" : "default"}
          className="flex-1"
        >
          {isScanning ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
          {isScanning ? "Detener" : "Iniciar Cámara"}
        </Button>
        
        {isScanning && (
          <Button onClick={switchCamera} variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
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
          </div>
        </CardContent>
      </Card>

      {/* Canvas oculto para procesamiento */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
