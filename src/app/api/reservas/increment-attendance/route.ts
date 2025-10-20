import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservaId, token, increment } = body;

    if (!reservaId || !token || !increment || increment < 1) {
      return NextResponse.json(
        { success: false, message: 'Datos requeridos: reservaId, token, increment' },
        { status: 400 }
      );
    }

    // Buscar la reserva por ID
    const reserva = await prisma.reservation.findUnique({
      where: {
        id: reservaId,
      },
      include: {
        Cliente: true,
        ReservationService: true,
        ReservationSlot: true,
        ReservationQRCode: true
      }
    });

    if (!reserva) {
      return NextResponse.json(
        { success: false, message: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Verificar el token QR
    const qrCodeEntry = reserva.ReservationQRCode.find((qr: any) => qr.qrToken === token);
    if (!qrCodeEntry) {
      return NextResponse.json(
        { success: false, message: 'Token QR inválido' },
        { status: 404 }
      );
    }

    // Verificar que la reserva esté confirmada
    if (reserva.status !== 'CONFIRMED') {
      return NextResponse.json(
        { success: false, message: 'La reserva no está confirmada' },
        { status: 400 }
      );
    }

    // Obtener asistencia actual e incrementar
    const currentAsistencia = qrCodeEntry.scanCount || 0;
    const newAsistencia = currentAsistencia + increment;
    const maxAsistencia = reserva.guestCount || 1;

    // Actualizar el contador de escaneos
    await prisma.reservationQRCode.update({
      where: {
        id: qrCodeEntry.id,
      },
      data: {
        scanCount: newAsistencia,
        lastScannedAt: new Date(),
      }
    });

    // Actualizar la reserva
    const updatedReserva = await prisma.reservation.update({
      where: {
        id: reservaId,
      },
      data: {
        updatedAt: new Date(),
      },
      include: {
        Cliente: true,
        ReservationSlot: true,
        ReservationService: true
      }
    });

    // Calcular exceso si lo hay
    const exceso = Math.max(0, newAsistencia - maxAsistencia);
    
    // Mensaje personalizado basado en incremento y exceso
    let message = '';
    if (increment === 1) {
      message = exceso > 0 ? 
        `Entrada registrada (1 persona adicional sobre el límite)` :
        'Entrada registrada exitosamente';
    } else {
      message = exceso > 0 ? 
        `Registradas ${increment} personas (${exceso} adicionales sobre el límite)` :
        `Registradas ${increment} personas exitosamente`;
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: message,
      reservaId: reservaId,
      incrementCount: newAsistencia,
      maxAsistencia: maxAsistencia,
      exceso: exceso,
      increment: increment,
      clienteCliente: {
        nombre: updatedReserva.customerName || 'Cliente',
        telefono: updatedReserva.customerPhone || ''
      },
      reserva: {
        fecha: updatedReserva.ReservationSlot?.date ? new Date(updatedReserva.ReservationSlot.date).toISOString().split('T')[0] : '',
        hora: updatedReserva.ReservationSlot?.startTime ? 
          new Date(updatedReserva.ReservationSlot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
        servicio: updatedReserva.ReservationService?.name || '',
        observaciones: updatedReserva.specialRequests || ''
      }
    });

  } catch (error) {
    console.error('Error al incrementar asistencia:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
