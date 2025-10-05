import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

// POST /api/reservas/[id]/asistencia - Registrar asistencia en una reserva
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;
    const body = await request.json();
    const { cantidad, metodo, userId } = body;

    // Validar datos
    if (!reservationId || !cantidad || !metodo) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar la reserva
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        cliente: true,
        service: true,
        slot: true,
        qrCodes: true
      }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Verificar que el usuario tiene acceso a esta reserva
    if (session.user.businessId !== reservation.businessId) {
      return NextResponse.json({ error: 'No autorizado para esta reserva' }, { status: 403 });
    }

    // Actualizar el QR code y el estado de la reserva
    let updatedReservation = reservation;
    let updatedQrCode = reservation.qrCodes[0];

    if (updatedQrCode) {
      updatedQrCode = await prisma.reservationQRCode.update({
        where: { id: updatedQrCode.id },
        data: {
          scanCount: {
            increment: cantidad
          },
          lastScannedAt: new Date(),
          usedAt: updatedQrCode.usedAt || new Date(),
          usedBy: updatedQrCode.usedBy || userId || session.user.id,
          status: 'USED'
        }
      });
    }

    // Si es la primera vez que registra asistencia, actualizar el estado de la reserva
    // PENDING → CONFIRMED cuando llega la primera persona
    const newScanCount = (updatedQrCode?.scanCount || 0);
    const shouldActivate = newScanCount === 1 && reservation.status === 'PENDING';
    
    if (shouldActivate) {
      updatedReservation = await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          checkedInAt: new Date()
        },
        include: {
          cliente: true,
          service: true,
          slot: true,
          qrCodes: true
        }
      });
    }

    // Registrar en el log de auditoría
    await prisma.reservationAuditLog.create({
      data: {
        businessId: reservation.businessId,
        reservationId: reservation.id,
        action: 'check_in',
        userId: userId || session.user.id,
        userName: session.user.name || 'Usuario del sistema',
        newValues: JSON.stringify({ 
          metodo, 
          cantidad, 
          timestamp: new Date().toISOString() 
        })
      }
    });

    // Formatear la respuesta
    const response = {
      id: updatedReservation.id,
      businessId: updatedReservation.businessId,
      cliente: updatedReservation.cliente ? {
        id: updatedReservation.cliente.id,
        nombre: updatedReservation.cliente.nombre,
        telefono: updatedReservation.cliente.telefono || undefined,
        email: updatedReservation.cliente.correo || undefined,
      } : null,
      numeroPersonas: updatedReservation.guestCount,
      razonVisita: updatedReservation.specialRequests || '',
      beneficiosReserva: updatedReservation.notes || '',
      promotor: { id: userId || session.user.id, nombre: session.user.name || 'Usuario del sistema' },
      fecha: updatedReservation.reservedAt.toISOString().split('T')[0],
      hora: new Date(updatedReservation.slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      codigoQR: updatedQrCode?.qrToken || '',
      asistenciaActual: updatedQrCode?.scanCount || 0,
      estado: updatedReservation.status,
      fechaCreacion: updatedReservation.createdAt.toISOString(),
      fechaModificacion: updatedReservation.updatedAt.toISOString(),
      // Información adicional
      customerName: updatedReservation.customerName,
      customerEmail: updatedReservation.customerEmail,
      customerPhone: updatedReservation.customerPhone,
      specialRequests: updatedReservation.specialRequests,
      notes: updatedReservation.notes,
      reservedAt: updatedReservation.reservedAt.toISOString(),
      status: updatedReservation.status,
      guestCount: updatedReservation.guestCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en POST /api/reservas/[id]/asistencia:', error);
    return NextResponse.json({ error: 'Error al registrar asistencia' }, { status: 500 });
  }
}
