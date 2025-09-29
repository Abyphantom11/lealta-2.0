import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservaId = params.id;

    if (!reservaId) {
      return NextResponse.json(
        { success: false, message: 'ID de reserva requerido' },
        { status: 400 }
      );
    }

    // Buscar la reserva con su QR code
    const reserva = await prisma.reservation.findUnique({
      where: {
        id: reservaId,
      },
      include: {
        cliente: true,
        service: true,
        slot: true,
        qrCodes: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!reserva) {
      return NextResponse.json(
        { success: false, message: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    if (!reserva.qrCodes || reserva.qrCodes.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No hay código QR activo para esta reserva' },
        { status: 404 }
      );
    }

    const qrCode = reserva.qrCodes[0];

    // Verificar si el QR code ha expirado
    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      return NextResponse.json(
        { success: false, message: 'El código QR ha expirado' },
        { status: 400 }
      );
    }

    // Formatear la respuesta
    const response = {
      success: true,
      qrData: {
        reservaId: reserva.id,
        token: qrCode.qrToken,
        timestamp: qrCode.createdAt.getTime(),
        cliente: reserva.customerName,
        fecha: reserva.slot?.date ? 
          new Date(reserva.slot.date).toISOString().split('T')[0] : '',
        hora: reserva.slot?.startTime ? 
          new Date(reserva.slot.startTime).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : '',
        servicio: reserva.service?.name || '',
        invitados: reserva.guestCount,
        estado: reserva.status,
        expiresAt: qrCode.expiresAt
      },
      reserva: {
        id: reserva.id,
        numero: reserva.reservationNumber,
        cliente: {
          nombre: reserva.customerName,
          telefono: reserva.customerPhone,
          email: reserva.customerEmail
        },
        fecha: reserva.slot?.date ? 
          new Date(reserva.slot.date).toISOString().split('T')[0] : '',
        hora: reserva.slot?.startTime ? 
          new Date(reserva.slot.startTime).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : '',
        servicio: reserva.service?.name || '',
        invitados: reserva.guestCount,
        observaciones: reserva.specialRequests,
        estado: reserva.status,
        asistenciaActual: qrCode.scanCount || 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error obteniendo QR de reserva:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
