import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

// Usamos Node.js runtime porque Prisma no funciona en Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;

    // Buscar el share link
    const shareLink = await prisma.qRShareLink.findUnique({
      where: { shareId },
      include: {
        Reservation: {
          include: {
            Cliente: true,
            ReservationQRCode: true,
            ReservationService: {
              include: {
                Business: {
                  select: {
                    name: true,
                    qrBrandingConfig: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!shareLink) {
      return new Response('Not found', { status: 404 });
    }

    const business = shareLink.Reservation.ReservationService.Business;
    const reservedAt = new Date(shareLink.Reservation.reservedAt);
    const fecha = reservedAt.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
    const hora = reservedAt.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const cliente = shareLink.Reservation.Cliente 
      ? shareLink.Reservation.Cliente.nombre
      : shareLink.Reservation.customerName;

    // Generar QR Code como data URL
    const qrToken = shareLink.Reservation.ReservationQRCode?.[0]?.qrToken || shareLink.Reservation.reservationNumber;
    const qrDataUrl = await QRCode.toDataURL(qrToken, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Extraer colores del cardDesign si existe
    let bgColor = '#0a0a0a';
    let textColor = '#ffffff';
    let accentColor = '#9ca3af';
    
    if (business.qrBrandingConfig && typeof business.qrBrandingConfig === 'object') {
      const config = business.qrBrandingConfig as any;
      if (config.cardDesign) {
        bgColor = config.cardDesign.backgroundColor || bgColor;
        textColor = config.cardDesign.headerColor || textColor;
        accentColor = config.cardDesign.textColor || accentColor;
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            padding: '60px',
          }}
        >
          {/* Tarjeta del QR */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: bgColor,
              borderRadius: '24px',
              padding: '50px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxWidth: '800px',
              width: '100%',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  fontFamily: 'Inter',
                  color: textColor,
                  marginBottom: '10px',
                  textAlign: 'center',
                }}
              >
                🎉 {business.name}
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontFamily: 'Inter',
                  color: accentColor,
                  textAlign: 'center',
                }}
              >
                Reserva Confirmada
              </div>
            </div>

            {/* QR Code Real */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '16px',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={qrDataUrl}
                alt="QR Code"
                width="280"
                height="280"
                style={{
                  borderRadius: '8px',
                }}
              />
            </div>

            {/* Información */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '24px',
                  fontFamily: 'Inter',
                  color: accentColor,
                }}
              >
                <span>👤 {cliente}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '24px',
                  fontFamily: 'Inter',
                  color: accentColor,
                }}
              >
                <span>📅 {fecha}</span>
                <span>🕐 {hora}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '24px',
                  fontFamily: 'Inter',
                  color: accentColor,
                }}
              >
                <span>👥 {shareLink.Reservation.guestCount} personas</span>
              </div>
            </div>

            {/* Mensaje */}
            {shareLink.message && (
              <div
                style={{
                  marginTop: '30px',
                  padding: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '20px',
                  fontFamily: 'Inter',
                  color: accentColor,
                  textAlign: 'center',
                  maxWidth: '100%',
                }}
              >
                💬 {shareLink.message}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: '40px',
              fontSize: '20px',
              fontFamily: 'Inter',
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            🎫 Presenta este código al llegar
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: await fetch(
              'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
            ).then((res) => res.arrayBuffer()),
            style: 'normal',
            weight: 400,
          },
          {
            name: 'Inter',
            data: await fetch(
              'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2'
            ).then((res) => res.arrayBuffer()),
            style: 'normal',
            weight: 700,
          },
        ],
      }
    );
  } catch (error) {
    console.error('Error generando imagen OG:', error);
    return new Response('Error', { status: 500 });
  }
}
