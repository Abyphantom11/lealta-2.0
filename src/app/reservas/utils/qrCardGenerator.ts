import html2canvas from 'html2canvas';

export interface CardDesign {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  shadowColor: string;
  shadowSize: 'none' | 'lg' | 'xl';
  headerColor: string;
  textColor: string;
}

/**
 * Genera una imagen PNG del QRCard personalizado
 */
export async function generateQRCardImage(
  element: HTMLElement,
  fileName: string = 'reserva-qr.png'
): Promise<Blob | null> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Mayor resolución
      logging: false,
      useCORS: true,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  } catch (error) {
    console.error('Error generando imagen del QR Card:', error);
    return null;
  }
}

/**
 * Descarga la imagen del QRCard
 */
export function downloadQRCardImage(blob: Blob, fileName: string = 'reserva-qr.png') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
