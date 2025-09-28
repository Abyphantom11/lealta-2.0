"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { Camera, CameraOff, RotateCcw, CheckCircle, XCircle, QrCode, ScanLine, Search } from "lucide-react";

interface QRScannerViewProps {
  onScan: (qrCode: string) => void;
}

export function QRScannerView({ onScan }: Readonly<QRScannerViewProps>) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [mockScanned, setMockScanned] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [manualInput, setManualInput] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  
  const streamRef = useRef<MediaStream | null>(null);

  // Simular acceso a la cámara
  const startCamera = async () => {
    try {
      setError("");
      
      // Simular obtención de stream de cámara
      setTimeout(() => {
        setIsScanning(true);
      }, 1000);
      
    } catch {
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Mock de escaneo para demostración
  const handleMockScan = () => {
    if (mockScanned) return;
    
    setMockScanned(true);
    
    setTimeout(() => {
      const mockQRCode = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      setTimeout(() => {
        onScan(mockQRCode);
        setMockScanned(false);
      }, 1500);
    }, 2000);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      setTimeout(() => {
        onScan(manualInput.trim());
        setManualInput("");
      }, 500);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    if (isScanning) {
      stopCamera();
      setTimeout(startCamera, 500);
    }
  };

  // Función para renderizar el contenido de la cámara
  const renderCameraView = () => {
    if (mockScanned) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-green-900/20">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="h-16 w-16 text-green-400 animate-pulse" />
            <p className="font-semibold text-green-400">¡QR Detectado!</p>
            <p className="text-sm text-green-300">Procesando...</p>
          </div>
        </div>
      );
    }

    if (isScanning) {
      return (
        <>
          {/* Overlay de escaneo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/5 h-3/5 border-2 border-blue-400 rounded-lg relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
            </div>
          </div>
          
          {/* Línea de escaneo animada */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/5 h-3/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 shadow-lg animate-pulse"></div>
              <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-blue-400/60 shadow-lg animate-pulse delay-75"></div>
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-400/40 shadow-lg animate-pulse delay-150"></div>
            </div>
          </div>
          
          {/* Indicador de cámara activa */}
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-medium">EN VIVO</span>
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="h-full w-full flex items-center justify-center flex-col gap-3">
        <CameraOff className="h-16 w-16 text-gray-500" />
        <p className="text-gray-400 font-medium">Cámara no activa</p>
        <p className="text-gray-500 text-sm">Presiona "Abrir Scanner QR" para comenzar</p>
      </div>
    );
  };

  useEffect(() => {
    setError("");
    setMockScanned(false);
    setManualInput("");
    
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Camera className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Control de Acceso</h2>
          <p className="text-muted-foreground">
            Utiliza el scanner QR para registrar la entrada de invitados de manera rápida y eficiente
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {!isScanning ? (
            <Button onClick={startCamera} size="lg" className="px-8">
              <Camera className="mr-2 h-5 w-5" />
              Abrir Scanner QR
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="outline" size="lg" className="px-8">
              <CameraOff className="mr-2 h-5 w-5" />
              Detener Cámara
            </Button>
          )}
          
          <Button variant="outline" size="lg" className="px-8">
            <CheckCircle className="mr-2 h-5 w-5" />
            Buscar Reserva
          </Button>
        </div>
      </div>

      {/* Scanner Area - Only show when scanning */}
      {isScanning && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visor principal */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="relative aspect-square w-full max-w-md mx-auto rounded-xl overflow-hidden bg-gray-900 border-2 border-dashed border-gray-300">
                  {/* Simulación de video de cámara */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                    {renderCameraView()}
                  </div>
                  
                  {/* Controles de cámara */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={toggleCamera}
                      className="bg-black/60 hover:bg-black/80 text-white border-0"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Control de escaneo simulado */}
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={handleMockScan}
                    disabled={mockScanned}
                    variant="outline"
                    size="lg"
                  >
                    {mockScanned ? (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Simular Escaneo QR
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Panel de información */}
          <div className="space-y-4">
            {/* Estado actual */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Estado del Escáner</h4>
                  <Badge variant="default">Activo</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-muted-foreground">Buscando códigos QR...</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cámara: {facingMode === "environment" ? "Trasera" : "Frontal"}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Entrada manual */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Entrada Manual</h4>
                <div className="space-y-3">
                  <Input
                    placeholder="Código de reserva..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleManualSubmit();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim()}
                    size="sm"
                    className="w-full"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Registrar
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Instrucciones */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Instrucciones</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                    <span>Centra el código QR en el área de escaneo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                    <span>Mantén el dispositivo estable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                    <span>Usa entrada manual si hay problemas</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* Errores */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>{error}</p>
              <Button 
                onClick={startCamera} 
                variant="outline" 
                size="sm"
              >
                <Camera className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
