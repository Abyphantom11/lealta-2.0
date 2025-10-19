import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

// Usar Node.js runtime para tener acceso completo a QRCode
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Función helper para generar el QR code como data URL (SVG simulado en canvas)
async function generateQRDataURL(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: 180,
    margin: 0,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}

// Diseño por defecto (Black Card - Elegante)
const DEFAULT_CARD_DESIGN = {
  backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
  borderColor: '#2a2a2a',
  borderWidth: 1,
  borderRadius: 20,
  padding: 40,
  shadowSize: 'xl',
  headerColor: '#ffffff',
  textColor: '#9ca3af',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;

    // Obtener datos del share link
    const shareLink = await prisma.qRShareLink.findUnique({
      where: { shareId },
      include: {
        Reservation: {
          include: {
            Cliente: true,
            ReservationService: {
              include: {
                Business: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    qrBrandingConfig: true, // ✅ Incluir configuración del diseño
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!shareLink) {
      return new Response('Share link no encontrado', { status: 404 });
    }

    // Verificar expiración
    const now = new Date();
    const expiresAt = new Date(shareLink.createdAt);
    expiresAt.setHours(expiresAt.getHours() + 24);

    if (now > expiresAt) {
      return new Response('Share link expirado', { status: 410 });
    }

    const reservation = shareLink.Reservation;
    const business = reservation.ReservationService.Business;
    const businessName = business.name;
    const customerName = reservation.customerName;
    
    // ✅ Extraer cardDesign personalizado del business (usar diseño por defecto si no existe)
    let cardDesign = { ...DEFAULT_CARD_DESIGN };
    
    if (business.qrBrandingConfig && typeof business.qrBrandingConfig === 'object') {
      const config = business.qrBrandingConfig as any;
      if (config.cardDesign) {
        cardDesign = { ...cardDesign, ...config.cardDesign };
      }
    }
    
    // Detectar si es tarjeta oscura (para efectos de brillo)
    const isDarkCard = cardDesign.backgroundColor.includes('#0a0a0a') || 
                       cardDesign.backgroundColor.includes('#1a1a1a') || 
                       cardDesign.backgroundColor.includes('#2d2d2d');
    
    // Formatear fecha
    const fecha = new Date(reservation.reservedAt);
    const fechaStr = fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    // Formatear hora
    const horaStr = new Date(reservation.reservedAt).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Generar QR code (usando ID de reserva como en el componente)
    const qrDataURL = await generateQRDataURL(`res-${reservation.id}`);

    // ✅ Generar imagen IDÉNTICA al componente QRCard.tsx
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            padding: '40px',
          }}
        >
          {/* Tarjeta QR - Layout idéntico a QRCard.tsx */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              background: cardDesign.backgroundColor,
              borderRadius: `${cardDesign.borderRadius}px`,
              border: `${cardDesign.borderWidth}px solid ${cardDesign.borderColor}`,
              padding: `${cardDesign.padding}px`,
              maxWidth: '500px',
              width: '100%',
              boxShadow: cardDesign.shadowSize === 'xl' 
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header - Nombre del Negocio */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: cardDesign.headerColor,
                  margin: '0 0 8px 0',
                  textAlign: 'center',
                }}
              >
                {businessName}
              </h2>
              <div
                style={{
                  fontSize: '14px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: cardDesign.textColor,
                }}
              >
                Reserva Confirmada
              </div>
            </div>

            {/* Nombre del Cliente */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: cardDesign.headerColor,
                }}
              >
                {customerName}
              </div>
            </div>

            {/* QR Code Container */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                background: '#ffffff',
                padding: '32px',
                borderRadius: '12px',
                marginBottom: '24px',
                marginLeft: '8px',
                marginRight: '8px',
              }}
            >
              <img
                src={qrDataURL}
                alt="QR Code"
                width="180"
                height="180"
              />
            </div>

            {/* Detalles en Grid 2x2 */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              {/* Fecha */}
              <div style={{ display: 'flex', flexDirection: 'column', width: 'calc(50% - 8px)' }}>
                <div
                  style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: cardDesign.textColor,
                    marginBottom: '4px',
                  }}
                >
                  Fecha
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: cardDesign.headerColor,
                  }}
                >
                  {fechaStr}
                </div>
              </div>

              {/* Hora */}
              <div style={{ display: 'flex', flexDirection: 'column', width: 'calc(50% - 8px)' }}>
                <div
                  style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: cardDesign.textColor,
                    marginBottom: '4px',
                  }}
                >
                  Hora
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: cardDesign.headerColor,
                  }}
                >
                  {horaStr}
                </div>
              </div>

              {/* Personas */}
              <div style={{ display: 'flex', flexDirection: 'column', width: 'calc(50% - 8px)' }}>
                <div
                  style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: cardDesign.textColor,
                    marginBottom: '4px',
                  }}
                >
                  Personas
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: cardDesign.headerColor,
                  }}
                >
                  {reservation.guestCount}
                </div>
              </div>

              {/* Código */}
              <div style={{ display: 'flex', flexDirection: 'column', width: 'calc(50% - 8px)' }}>
                <div
                  style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: cardDesign.textColor,
                    marginBottom: '4px',
                  }}
                >
                  Código
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: '500',
                    color: cardDesign.headerColor,
                    wordBreak: 'break-all',
                    lineHeight: '1.2',
                  }}
                >
                  {reservation.reservationNumber}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                fontSize: '12px',
                color: cardDesign.textColor,
                paddingTop: '16px',
                borderTop: `1px solid ${isDarkCard ? 'rgba(255,255,255,0.1)' : cardDesign.textColor + '30'}`,
              }}
            >
              Presenta este código al llegar
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generando OG image:', error);
    return new Response('Error generando imagen', { status: 500 });
  }
}
