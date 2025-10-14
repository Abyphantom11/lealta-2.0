'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface QRDisplayProps {
  shortId: string;
  name: string;
  targetUrl: string;
  clickCount: number;
}

export function QRDisplay({ shortId, name, targetUrl, clickCount }: QRDisplayProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const qrUrl = `${window.location.origin}/r/${shortId}`;

  const generateQR = async () => {
    setIsGenerating(true);
    
    try {
      // Usar API gratuita para generar QR
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&ecc=M&margin=20`;
      setQrImageUrl(qrApiUrl);
      toast.success('QR generado exitosamente');
    } catch (error) {
      toast.error('Error generando QR');
      console.error('Error generating QR:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrImageUrl) {
      toast.error('Primero genera el QR');
      return;
    }

    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `qr-${shortId}-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR descargado');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(qrUrl);
    toast.success('URL copiada al portapapeles');
  };

  const copyTargetUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    toast.success('URL destino copiada');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-blue-600" />
          {name}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {clickCount} clicks
          </Badge>
          <Badge variant="secondary">
            ID: {shortId}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="text-center">
          {qrImageUrl ? (
            <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
              <img 
                src={qrImageUrl} 
                alt={`QR Code para ${name}`}
                className="w-full h-auto max-w-[300px]"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Click "Generar QR" para ver el código</p>
            </div>
          )}
        </div>

        {/* URLs */}
        <div className="space-y-2">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              URL del QR
            </div>
            <div className="flex items-center gap-1 mt-1">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 text-blue-600 break-all">
                {qrUrl}
              </code>
              <Button size="sm" variant="ghost" onClick={copyUrl}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Destino Actual
            </div>
            <div className="flex items-center gap-1 mt-1">
              <code className="text-xs bg-green-50 px-2 py-1 rounded flex-1 text-green-700 break-all">
                {targetUrl}
              </code>
              <Button size="sm" variant="ghost" onClick={copyTargetUrl}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={generateQR} 
            disabled={isGenerating}
            className="flex-1"
            variant={qrImageUrl ? "outline" : "default"}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Generando...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                {qrImageUrl ? 'Regenerar QR' : 'Generar QR'}
              </>
            )}
          </Button>
          
          {qrImageUrl && (
            <Button onClick={downloadQR} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          )}
        </div>

        {/* Tips */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Tip:</strong> El QR siempre apunta a la misma URL, pero puedes cambiar el destino.</p>
          <p>📊 Los clicks se registran automáticamente para analytics.</p>
        </div>
      </CardContent>
    </Card>
  );
}
