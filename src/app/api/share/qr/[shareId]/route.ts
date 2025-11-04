import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// Type helper para el query con include
type ShareLinkWithReservation = Prisma.QRShareLinkGetPayload<{
  include: {
    Reservation: {
      include: {
        Cliente: true;
        ReservationService: {
          include: {
            Business: {
              select: {
                id: true;
                name: true;
                slug: true;
                qrBrandingConfig: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;

    // Buscar el share link en la base de datos
    const shareLink: ShareLinkWithReservation | null = await prisma.qRShareLink.findUnique({
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
      return NextResponse.json(
        { 
          error: 'Este código QR ya no está disponible',
          message: 'El código QR de esta reserva ha expirado o fue eliminado por antigüedad. Si necesitas un nuevo QR, contacta con el establecimiento.',
          code: 'QR_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Verificar si el link ha expirado (24 horas)
    const now = new Date();
    const expiresAt = new Date(shareLink.createdAt);
    expiresAt.setHours(expiresAt.getHours() + 24);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Link expirado' },
        { status: 410 }
      );
    }

    // Incrementar contador de vistas
    await prisma.qRShareLink.update({
      where: { id: shareLink.id },
      data: { views: { increment: 1 } },
    });

    // Extraer cardDesign de qrBrandingConfig si existe
    const business = shareLink.Reservation.ReservationService.Business;
    let cardDesign = null;
    
    if (business.qrBrandingConfig && typeof business.qrBrandingConfig === 'object') {
      const config = business.qrBrandingConfig as any;
      cardDesign = config.cardDesign || null;
    }

    // Extraer fecha y hora del campo reservedAt
    const reservedAt = new Date(shareLink.Reservation.reservedAt);
    const fecha = reservedAt.toISOString().split('T')[0]; // YYYY-MM-DD
    const hora = reservedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); // HH:MM

    // Construir objeto cliente - usar Cliente si existe, sino usar customerName
    const cliente = shareLink.Reservation.Cliente 
      ? {
          id: shareLink.Reservation.Cliente.id,
          nombre: shareLink.Reservation.Cliente.nombre,
          telefono: shareLink.Reservation.Cliente.telefono,
          email: shareLink.Reservation.Cliente.correo,
        }
      : {
          id: shareLink.Reservation.clienteId || 'temp',
          nombre: shareLink.Reservation.customerName,
          telefono: shareLink.Reservation.customerPhone,
          email: shareLink.Reservation.customerEmail,
        };

    return NextResponse.json({
      success: true,
      data: {
        reserva: {
          ...shareLink.Reservation,
          cliente, // ✅ Cliente con fallback a customerName
          service: shareLink.Reservation.ReservationService,
          qrToken: shareLink.Reservation.reservationNumber, // ✅ Agregar qrToken dentro de reserva
          fecha, // ✅ Agregar fecha formateada
          hora, // ✅ Agregar hora formateada
          numeroPersonas: shareLink.Reservation.guestCount, // ✅ Mapear guestCount a numeroPersonas
        },
        message: shareLink.message,
        businessName: business.name,
        qrToken: shareLink.Reservation.reservationNumber,
        cardDesign, // ✅ Incluir diseño personalizado del business
      },
    });
  } catch (error) {
    console.error('Error al obtener share link:', error);
    return NextResponse.json(
      { error: 'Error al cargar la información' },
      { status: 500 }
    );
  }
}
