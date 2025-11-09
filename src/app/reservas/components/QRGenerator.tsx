"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { QrCode, Download, Share2, Copy, Check } from "lucide-react";
import QRCodeSVG from "react-qr-code"; // Librería correcta para QR

interface QRGeneratorProps {
  reservaId: string;
  cliente: string;
  fecha: string;
  hora: string;
  servicio?: string;
  onQRGenerated?: (qrData: string, qrToken: string) => void;
}

/**
 * ✅ QRGenerator - CORREGIDO para usar formato simple compatible
 * 
 * Cambios realizados:
 * - ❌ Removido: librería "qrcode" que generaba JSON complejo
 * - ✅ Agregado: "react-qr-code" (misma que QRCard.tsx)
 * - ✅ Formato simple: res-{reservaId} (compatible con scanner)
 */
export function QRGenerator({ 
  reservaId, 
  cliente, 
  fecha, 
  hora, 
  servicio,
  onQRGenerated 
}: Readonly<QRGeneratorProps>) {
  const [qrValue, setQrValue] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ Generar QR Code usando formato simple compatible
  const generateQRCode = () => {
    try {
      setIsGenerating(true);
      
      // ✅ Usar formato simple compatible con el scanner
      // El scanner espera: res-{reservaId}
      const simpleQRValue = `res-${reservaId}`;
      
      setQrValue(simpleQRValue);
      
      // Notificar al componente padre con el formato correcto
      onQRGenerated?.(simpleQRValue, reservaId);
      
      console.log('✅ QR generado con formato simple:', simpleQRValue);
      
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
      if (!qrValue) return;
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  // Descargar QR como imagen
  const downloadQR = () => {
    if (!qrValue) return;
    
    // Obtener el SVG del QR
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    // Crear un canvas temporal para convertir el SVG a imagen
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    // Fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Crear imagen del SVG
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Dibujar el QR en el canvas
      const padding = 20;
      ctx.drawImage(img, padding, padding, 260, 260);
      
      // Convertir a imagen y descargar
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR-Reserva-${reservaId}-${fecha}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
      
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  };

  // Compartir QR (si está disponible)
  const shareQR = async () => {
    if (!qrValue) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `QR Reserva - ${cliente}`,
          text: `Código QR para la reserva del ${fecha} a las ${hora}\n\nCódigo: ${qrValue}`
        });
      } else {
        // Fallback: copiar al portapapeles
        await copyToClipboard();
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
      await copyToClipboard();
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
        {qrValue && (
          <div className="flex justify-center">
            <div id="qr-code-svg" className="bg-white p-4 rounded-lg border-2 border-gray-100 shadow-sm">
              <QRCodeSVG
                value={qrValue}
                size={192}
                level="M"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
          </div>
        )}
        
        {/* Código QR texto */}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Código de reserva</p>
          <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono">
            {qrValue}
          </code>
        </div>
        
        {/* Instrucciones */}
        <div className="text-center text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-3">
          <p>• Presenta este código al llegar al establecimiento</p>
          <p>• Válido por 24 horas desde la fecha de tu reserva</p>
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
            disabled={!qrValue}
            className="w-12 h-12 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors disabled:opacity-50"
            title="Descargar código QR"
          >
            <Download className="h-5 w-5 text-blue-600" />
          </Button>
          
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant="outline"
              size="sm"
              onClick={shareQR}
              disabled={!qrValue}
              className="w-12 h-12 p-0 bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors disabled:opacity-50"
              title="Compartir código QR"
            >
              <Share2 className="h-5 w-5 text-green-600" />
            </Button>
          )}
        </div>
        
        {/* Info para desarrollo */}
        {process.env.NODE_ENV === 'development' && qrValue && (
          <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <p className="font-semibold text-blue-800 mb-1">Debug Info:</p>
            <p className="font-mono text-blue-700">Formato: res-{'{'}reservaId{'}'}</p>
            <p className="font-mono text-blue-700">Longitud: {qrValue.length} caracteres</p>
            <p className="text-blue-600 mt-1">✅ Formato compatible con scanner</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
