"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { QrCode, Download, Share2, Copy, Check } from "lucide-react";
import QRCode from "qrcode";

interface QRGeneratorProps {
  reservaId: string;
  cliente: string;
  fecha: string;
  hora: string;
  servicio?: string;
  onQRGenerated?: (qrData: string, qrToken: string) => void;
}

interface QRData {
  reservaId: string;
  token: string;
  timestamp: number;
  cliente: string;
  fecha: string;
  hora: string;
}

export function QRGenerator({ 
  reservaId, 
  cliente, 
  fecha, 
  hora, 
  servicio,
  onQRGenerated 
}: Readonly<QRGeneratorProps>) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrData, setQrData] = useState<string>("");
  const [qrToken, setQrToken] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generar token único
  const generateToken = () => {
    return `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Generar QR Code
  const generateQRCode = async () => {
    try {
      setIsGenerating(true);
      
      // Crear token único
      const token = generateToken();
      
      // Datos del QR
      const qrDataObj: QRData = {
        reservaId,
        token,
        timestamp: Date.now(),
        cliente: cliente.substring(0, 30), // Limitar longitud
        fecha,
        hora
      };
      
      const qrDataString = JSON.stringify(qrDataObj);
      
      // Generar QR code como imagen
      const qrUrl = await QRCode.toDataURL(qrDataString, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeUrl(qrUrl);
      setQrData(qrDataString);
      setQrToken(token);
      
      // Notificar al componente padre
      onQRGenerated?.(qrDataString, token);
      
    } catch (error) {
      console.error('Error generando QR:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generar automáticamente al montar
  useEffect(() => {
    if (reservaId && cliente && fecha && hora) {
      generateQRCode();
    }
  }, [reservaId, cliente, fecha, hora]); // eslint-disable-line react-hooks/exhaustive-deps

  // Copiar al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  // Descargar QR
  const downloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR-Reserva-${reservaId}-${fecha}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compartir QR (si está disponible)
  const shareQR = async () => {
    if (!navigator.share || !qrCodeUrl) return;
    
    try {
      // Convertir data URL a blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], `QR-Reserva-${reservaId}.png`, { type: 'image/png' });
      
      await navigator.share({
        title: `QR Reserva - ${cliente}`,
        text: `Código QR para la reserva del ${fecha} a las ${hora}`,
        files: [file]
      });
    } catch (error) {
      console.error('Error compartiendo:', error);
      // Fallback: copiar al portapapeles
      copyToClipboard();
    }
  };

  if (isGenerating) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white border border-gray-200 shadow-sm">
        <CardContent className="flex items-center justify-center p-8 bg-white">
          <div className="flex flex-col items-center gap-3">
            <QrCode className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Generando código QR...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white border border-gray-200 shadow-sm">
      <CardHeader className="text-center pb-4 bg-white">
        <CardTitle className="flex items-center justify-center gap-2 text-lg text-gray-800">
          <QrCode className="h-5 w-5 text-blue-600" />
          Código QR de Entrada
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 bg-white">
        {/* Información de la reserva */}
        <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
          <p className="font-semibold text-gray-800">{cliente}</p>
          <p className="text-gray-600">{fecha} - {hora}</p>
          {servicio && <p className="text-gray-600">{servicio}</p>}
        </div>
        
        {/* QR Code */}
        {qrCodeUrl && (
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-100 shadow-sm">
              <img 
                src={qrCodeUrl} 
                alt="Código QR de la reserva"
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>
        )}
        
        {/* Instrucciones */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>• Presenta este código al llegar al establecimiento</p>
          <p>• Válido por 12 horas desde la fecha de tu reserva</p>
          <p>• Un escaneo por persona en tu grupo</p>
        </div>
        
        {/* Botones de acción */}
        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="w-12 h-12 p-0 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors"
            title={copied ? "Copiado" : "Copiar al portapapeles"}
          >
            {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-600" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadQR}
            className="w-12 h-12 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors"
            title="Descargar código QR"
          >
            <Download className="h-5 w-5 text-blue-600" />
          </Button>
          
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant="outline"
              size="sm"
              onClick={shareQR}
              className="w-12 h-12 p-0 bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors"
              title="Compartir código QR"
            >
              <Share2 className="h-5 w-5 text-green-600" />
            </Button>
          )}
        </div>
        
        {/* Token para desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-yellow-50 border rounded text-xs">
            <p className="font-mono text-yellow-800">Token: {qrToken}</p>
            <p className="text-yellow-600 mt-1">Solo visible en desarrollo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
