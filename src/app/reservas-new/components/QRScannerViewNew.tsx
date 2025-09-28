"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { Camera, CameraOff, RotateCcw, CheckCircle, XCircle, QrCode, ScanLine } from "lucide-react";

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

  // Renderizar el contenido del visor de cámara
  const renderCameraView = () => {
    if (!isScanning) {
      return (
        <div className="h-full w-full flex items-center justify-center flex-col gap-3">
          <CameraOff className="h-16 w-16 text-gray-500" />
          <p className="text-gray-400 font-medium">Cámara no activa</p>
          <p className="text-gray-500 text-sm">Presiona "Iniciar Cámara" para comenzar</p>
        </div>
      );
    }

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

    return (
      <>
        {/* Overlay de escaneo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3/5 h-3/5 border-2 border-blue-400 rounded-lg relative">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
          </div>
        </div>
        
        {/* Línea de escaneo animada */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3/5 h-3/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 shadow-lg animate-pulse" />
            <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-blue-400/60 shadow-lg animate-pulse delay-75" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-400/40 shadow-lg animate-pulse delay-150" />
          </div>
        </div>
        
        {/* Indicador de cámara activa */}
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">EN VIVO</span>
          </div>
        </div>
      </>
    );
  };

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

  useEffect(() => {
    if (!showScanner) {
      stopCamera();
      setMockScanned(false);
    }
    
    return () => {
      stopCamera();
    };
  }, [showScanner]);

  if (!showScanner) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Control de Acceso</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Utiliza el scanner QR para registrar la entrada de invitados de manera rápida y eficiente
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setShowScanner(true)} 
              size="lg"
              className="bg-black hover:bg-gray-800 text-white"
            >
              <ScanLine className="h-5 w-5 mr-2" />
              Abrir Scanner QR
            </Button>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">146</p>
            <p className="text-sm text-muted-foreground">Total Asistentes Registrados</p>
          </div>
          
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</p>
            <p className="text-sm text-muted-foreground">Reservas Hoy</p>
          </div>
          
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">73.4%</p>
            <p className="text-sm text-muted-foreground">Eficiencia de Asistencia</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón para volver */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setShowScanner(false)}
        >
          ← Volver
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Scanner QR Activo</h2>
          <p className="text-sm text-muted-foreground">
            Apunta la cámara hacia el código QR para registrar asistencia
          </p>
        </div>
      </div>

      {/* Área principal del scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="relative aspect-square w-full max-w-md mx-auto rounded-xl overflow-hidden bg-gray-900 border-2 border-dashed border-gray-300">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                  {renderCameraView()}
                </div>
                
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
              
              <div className="flex gap-3 mt-6">
                {isScanning ? (
                  <>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="flex-1"
                    >
                      <CameraOff className="mr-2 h-4 w-4" />
                      Detener Cámara
                    </Button>
                    <Button 
                      onClick={handleMockScan}
                      disabled={mockScanned}
                      className="flex-1"
                    >
                      {mockScanned ? (
                        <>
                          <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Simular Escaneo
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={startCamera}
                    className="flex-1"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Iniciar Cámara
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Panel lateral */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Estado del Escáner</h4>
                <Badge variant={isScanning ? "default" : "secondary"}>
                  {isScanning ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-muted-foreground">
                    {isScanning ? "Buscando códigos QR..." : "Escáner detenido"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Cámara: {facingMode === "environment" ? "Trasera" : "Frontal"}
                </div>
              </div>
            </CardContent>
          </Card>
          
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
