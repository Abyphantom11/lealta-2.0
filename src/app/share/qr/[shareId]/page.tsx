'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCard from '@/app/reservas/components/QRCard';
import { Loader2, Download, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareData {
  reserva: any;
  message: string;
  businessName: string;
  qrToken: string;
  cardDesign?: any;
}

export default function ShareQRPage() {
  const params = useParams();
  const shareId = params?.shareId as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const loadShareData = async () => {
      try {
        const response = await fetch(`/api/share/qr/${shareId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cargar');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Error al cargar la información');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      loadShareData();
    }
  }, [shareId]);

  const handleDownload = async () => {
    // Implementar descarga del QR
    const canvas = document.querySelector('[data-qr-card]') as HTMLElement;
    if (!canvas) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvasEl = await html2canvas(canvas, {
        backgroundColor: null,
        scale: 2,
      });

      canvasEl.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reserva-qr.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error al descargar:', error);
    }
  };

  const handleCopyMessage = async () => {
    if (!data) return;
    
    try {
      const message = data.message || `¡Bienvenido! Tu reserva en ${data.businessName} está confirmada.`;
      await navigator.clipboard.writeText(message);
      setIsCopied(true);
      toast.success('✅ Mensaje copiado', {
        description: 'Ahora comparte el QR y pega el mensaje en WhatsApp',
        duration: 3000,
      });
      
      // Reset después de 3 segundos
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error('❌ Error al copiar el mensaje');
    }
  };

  const handleShare = async () => {
    const canvas = document.querySelector('[data-qr-card]') as HTMLElement;
    if (!canvas || !data) return;

    try {
      // Generar imagen del QR
      const html2canvas = (await import('html2canvas')).default;
      const canvasEl = await html2canvas(canvas, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      // Convertir a blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasEl.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) {
        throw new Error('No se pudo generar la imagen');
      }

      // Crear archivo
      const file = new File([blob], 'reserva-qr.png', { type: 'image/png' });

      // Intentar compartir con Web Share API (incluye imagen)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
          });
          
          toast.success('✅ QR compartido exitosamente', {
            description: 'Recuerda pegar el mensaje copiado en WhatsApp',
            duration: 5000,
          });
          return;
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('Share cancelado por el usuario');
            return;
          }
          console.error('Error compartiendo:', error);
        }
      }

      // Fallback: Compartir solo por WhatsApp con imagen descargada
      // El usuario descarga la imagen y luego puede compartirla manualmente
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reserva-qr.png';
      link.click();
      URL.revokeObjectURL(url);

      toast.success('📥 Imagen descargada', {
        description: 'Ahora puedes compartirla en WhatsApp con el mensaje copiado',
        duration: 5000,
      });
      
    } catch (error) {
      console.error('Error al compartir:', error);
      alert('Error al generar la imagen. Intenta de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando reserva...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops...
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 {data.businessName}
          </h1>
          <p className="text-gray-600">
            Tu reserva está confirmada
          </p>
        </div>

        {/* QR Card */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <div data-qr-card className="flex justify-center">
            <QRCard
              reserva={data.reserva}
              businessName={data.businessName}
              cardDesign={data.cardDesign || {
                backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
                borderColor: '#2a2a2a',
                borderWidth: 1,
                borderRadius: 20,
                padding: 40,
                shadowColor: '#000000',
                shadowSize: 'xl',
                headerColor: '#ffffff',
                textColor: '#9ca3af',
              }}
            />
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span className="text-xl">📱</span>
            Cómo compartir en WhatsApp:
          </h3>
          <ul className="space-y-2 text-blue-800">
            {data.message && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">1.</span>
                <span>Copia el mensaje usando el botón &quot;Copiar Mensaje&quot;</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">{data.message ? '2.' : '1.'}</span>
              <span>Presiona &quot;Compartir&quot; y selecciona WhatsApp</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">{data.message ? '3.' : '2.'}</span>
              <span>{data.message ? 'Pega el mensaje copiado en WhatsApp' : 'Envía el QR a tus invitados'}</span>
            </li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="icon"
            className="shrink-0"
            title="Descargar QR"
          >
            <Download className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleShare}
            size="icon"
            className="shrink-0 bg-green-600 hover:bg-green-700"
            title="Compartir en WhatsApp"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          {data.message && (
            <Button
              onClick={handleCopyMessage}
              variant={isCopied ? "default" : "outline"}
              className={isCopied ? "flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" : "flex-1 gap-2"}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Mensaje
                </>
              )}
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Este link es válido por 24 horas</p>
          <p className="mt-1">Generado por {data.businessName}</p>
        </div>
      </div>
    </div>
  );
}
