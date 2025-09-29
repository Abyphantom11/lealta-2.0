import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

// GET /api/reservas/qr/[token] - Buscar una reserva por código QR
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!token || !businessId) {
      return NextResponse.json({ error: 'Token QR y businessId son requeridos' }, { status: 400 });
    }

    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || session.user.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar el QR y la reserva asociada
    const qrCode = await prisma.reservationQRCode.findFirst({
      where: {
        qrToken: token,
        businessId
      },
      include: {
        reservation: {
          include: {
            cliente: true,
            service: true,
            slot: true
          }
        }
      }
    });

    if (!qrCode) {
      return NextResponse.json({ error: 'Código QR no encontrado' }, { status: 404 });
    }

    // Verificar si el QR está expirado o cancelado
    if (qrCode.status === 'EXPIRED' || qrCode.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Código QR expirado o cancelado' }, { status: 400 });
    }

    const reservation = qrCode.reservation;
    
    // Formatear la respuesta
    const response = {
      id: reservation.id,
      businessId: reservation.businessId,
      cliente: reservation.cliente ? {
        id: reservation.cliente.id,
        nombre: reservation.cliente.nombre,
        telefono: reservation.cliente.telefono || undefined,
        email: reservation.cliente.correo || undefined,
      } : null,
      numeroPersonas: reservation.guestCount,
      razonVisita: reservation.specialRequests || '',
      beneficiosReserva: reservation.notes || '',
      promotor: { id: '', nombre: '' }, // No tenemos esta info en este contexto
      fecha: reservation.reservedAt.toISOString().split('T')[0],
      hora: new Date(reservation.slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      codigoQR: qrCode.qrToken,
      asistenciaActual: qrCode.scanCount,
      estado: reservation.status,
      fechaCreacion: reservation.createdAt.toISOString(),
      fechaModificacion: reservation.updatedAt.toISOString(),
      // Información adicional
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      customerPhone: reservation.customerPhone,
      specialRequests: reservation.specialRequests,
      notes: reservation.notes,
      reservedAt: reservation.reservedAt.toISOString(),
      status: reservation.status,
      guestCount: reservation.guestCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en GET /api/reservas/qr/[token]:', error);
    return NextResponse.json({ error: 'Error al buscar reserva por QR' }, { status: 500 });
  }
}
