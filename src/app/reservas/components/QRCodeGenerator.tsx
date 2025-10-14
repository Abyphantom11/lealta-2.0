"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Download, QrCode, RefreshCw } from "lucide-react";
import { Badge } from "./ui/badge";

interface QRCodeGeneratorProps {
  reservationId?: string;
  customerName?: string;
  initialValue?: string;
}

export function QRCodeGenerator({ 
  reservationId, 
  customerName, 
  initialValue 
}: QRCodeGeneratorProps) {
  const [qrValue, setQrValue] = useState(initialValue || "");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!qrValue) return;
    
    setIsGenerating(true);
    
    // Simulamos el tiempo de generación
    setTimeout(() => {
      setIsGenerating(false);
    }, 1000);
  };

  const handleDownload = () => {
    // Aquí iría la lógica para descargar el código QR como imagen
    alert("Descargando código QR...");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="mr-2 h-5 w-5" />
          Generador de Código QR
        </CardTitle>
        <CardDescription>
          Genera un código QR único para la reserva
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reservationId && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ID Reserva:</span>
            <Badge variant="outline">{reservationId}</Badge>
          </div>
        )}
        
        {customerName && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cliente:</span>
            <span className="font-medium">{customerName}</span>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="qrValue">Datos para el código QR</Label>
          <Input 
            id="qrValue"
            value={qrValue}
            onChange={(e) => setQrValue(e.target.value)}
            placeholder="Ingrese datos para el código QR"
          />
        </div>
        
        <div className="flex justify-center pt-4">
          {qrValue ? (
            <div className="relative w-48 h-48 border-2 border-dashed border-muted rounded-lg flex items-center justify-center bg-muted/50">
              {/* Aquí iría la imagen real del QR generado */}
              <div className="w-40 h-40 bg-white p-2 rounded-lg flex items-center justify-center">
                <QrCode className="h-32 w-32 text-primary" />
              </div>
            </div>
          ) : (
            <div className="w-48 h-48 border-2 border-dashed border-muted rounded-lg flex items-center justify-center bg-muted/50">
              <span className="text-sm text-muted-foreground text-center px-4">
                Ingrese datos para generar un código QR
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setQrValue("")}>
          Limpiar
        </Button>
        <div className="flex space-x-2">
          {qrValue && (
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          )}
          <Button 
            onClick={handleGenerate} 
            disabled={!qrValue || isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <QrCode className="mr-2 h-4 w-4" />
                Generar QR
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
