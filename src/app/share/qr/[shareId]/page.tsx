'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCard from '@/app/reservas/components/QRCard';
import { Loader2, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareData {
  reserva: any;
  message: string;
  businessName: string;
  qrToken: string;
}

export default function ShareQRPage() {
  const params = useParams();
  const shareId = params?.shareId as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const text = data?.message || 'Reserva confirmada';

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reserva - ${data?.businessName}`,
          text: text,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelado');
      }
    } else {
      // Copiar al portapapeles
      await navigator.clipboard.writeText(`${text}\n\n${shareUrl}`);
      alert('Link copiado al portapapeles');
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

        {/* Mensaje Personalizado */}
        {data.message && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💬</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Mensaje importante:
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {data.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QR Card */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <div data-qr-card className="flex justify-center">
            <QRCard
              reserva={data.reserva}
              businessName={data.businessName}
              cardDesign={{
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
            Cómo usar tu QR:
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Descarga o guarda el código QR en tu dispositivo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Presenta el código al llegar al establecimiento</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Puedes compartir este link con tus acompañantes</span>
            </li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar QR
          </Button>
          <Button
            onClick={handleShare}
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </Button>
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
