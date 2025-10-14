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
        cliente: true,
        service: true,
        slot: true,
        qrCodes: true
      }
    });

    if (!reserva) {
      return NextResponse.json(
        { success: false, message: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Verificar el token QR
    const qrCodeEntry = reserva.qrCodes.find(qr => qr.qrToken === token);
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
        cliente: true,
        slot: true,
        service: true
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
      cliente: {
        nombre: updatedReserva.customerName || 'Cliente',
        telefono: updatedReserva.customerPhone || ''
      },
      reserva: {
        fecha: updatedReserva.slot?.date ? new Date(updatedReserva.slot.date).toISOString().split('T')[0] : '',
        hora: updatedReserva.slot?.startTime ? 
          new Date(updatedReserva.slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
        servicio: updatedReserva.service?.name || '',
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
