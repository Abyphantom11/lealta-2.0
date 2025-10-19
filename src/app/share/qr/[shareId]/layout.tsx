import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  params: {
    shareId: string;
  };
}

// Función para obtener los datos del share link
async function getShareData(shareId: string) {
  try {
    const shareLink = await prisma.qRShareLink.findUnique({
      where: { shareId },
      include: {
        Reservation: {
          include: {
            Cliente: true,
            ReservationService: {
              include: {
                Business: true,
              },
            },
          },
        },
      },
    });

    if (!shareLink) {
      return null;
    }

    // Verificar si el link ha expirado (24 horas)
    const now = new Date();
    const expiresAt = new Date(shareLink.createdAt);
    expiresAt.setHours(expiresAt.getHours() + 24);

    if (now > expiresAt) {
      return null;
    }

    return {
      shareLink,
      reserva: shareLink.Reservation,
      message: shareLink.message,
      businessName: shareLink.Reservation.ReservationService.Business.name,
    };
  } catch (error) {
    console.error('Error al obtener share link:', error);
    return null;
  }
}

// Generar metadata dinámico para Open Graph
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { shareId } = params;
  const data = await getShareData(shareId);

  if (!data) {
    return {
      title: 'Reserva no encontrada | Lealta',
      description: 'Esta reserva no existe o ha expirado.',
    };
  }

  const { businessName, message, reserva } = data;
  
  // Fecha formateada
  const fechaReserva = new Date(reserva.reservedAt).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const title = `🎉 Reserva en ${businessName}`;
  const description = message || `Tu reserva para el ${fechaReserva} está confirmada. Presenta este código QR al llegar.`;
  
  // Construir URL base según ambiente
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://lealta.app'
    : 'https://benjamin-naturals-democrats-ahead.trycloudflare.com';
  
  const ogImageUrl = `${baseUrl}/api/share/qr/${shareId}/og`;
  const pageUrl = `${baseUrl}/share/qr/${shareId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'Lealta',
      locale: 'es_ES',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Código QR de reserva en ${businessName}`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: '@lealta',
      site: '@lealta',
    },
    // Meta tags adicionales para WhatsApp
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': `Código QR de reserva en ${businessName}`,
    },
    robots: {
      index: false, // No indexar en Google (son links temporales)
      follow: false,
    },
  };
}

export default function ShareQRLayout({ children }: Readonly<LayoutProps>) {
  return <>{children}</>;
}
