import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QRData {
  reservaId: string;
  token: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode } = body;

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'Código QR requerido' },
        { status: 400 }
      );
    }

    // DEBUG: Log del QR recibido
    console.log('🔍 DEBUG scan-qr - QR recibido:', qrCode);

    let reservaId: string;
    let token: string | undefined;
    let timestamp: number | undefined;

    // Detectar si es JSON completo o solo un ID
    if (qrCode.startsWith('res-') || qrCode.startsWith('cmg')) {
      // Es un ID simple de reserva
      console.log('📝 DEBUG scan-qr - Detectado ID simple de reserva');
      reservaId = qrCode.replace('res-', ''); // Remover prefijo si existe
      
      // Buscar el token en la base de datos
      const reservaConQR = await prisma.reservation.findUnique({
        where: { id: reservaId },
        include: { qrCodes: true }
      });
      
      if (!reservaConQR || reservaConQR.qrCodes.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Reserva no encontrada o sin QR' },
          { status: 404 }
        );
      }
      
      token = reservaConQR.qrCodes[0].qrToken;
      timestamp = Date.now(); // Usar timestamp actual
      console.log('🔑 DEBUG scan-qr - Token encontrado:', token);
      
    } else {
      // Es JSON completo
      console.log('📋 DEBUG scan-qr - Detectado JSON completo');
      let qrData: QRData;
      try {
        qrData = JSON.parse(qrCode);
        reservaId = qrData.reservaId;
        token = qrData.token;
        timestamp = qrData.timestamp;
      } catch (parseError) {
        console.error('Error al parsear QR JSON:', parseError);
        return NextResponse.json(
          { success: false, message: 'Código QR inválido' },
          { status: 400 }
        );
      }

      if (!reservaId || !token || !timestamp) {
        return NextResponse.json(
          { success: false, message: 'Datos del QR incompletos' },
          { status: 400 }
        );
      }
    }

    console.log('✅ DEBUG scan-qr - Datos procesados:', { reservaId, token, timestamp });

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

    // Verificar que el código QR no esté expirado (12 horas después de la hora de la reserva)
    const currentTime = new Date();
    const reservationDateTime = new Date(reserva.slot.startTime);
    const expirationTime = new Date(reservationDateTime.getTime() + (12 * 60 * 60 * 1000)); // 12 horas después
    
    // DEBUG: Log de fechas para debugging
    console.log('🔍 DEBUG QR Validation (scan-qr):', {
      reservaId: reserva.id,
      customerName: reserva.customerName,
      currentTime: currentTime.toISOString(),
      reservationDateTime: reservationDateTime.toISOString(),
      expirationTime: expirationTime.toISOString(),
      isExpired: currentTime > expirationTime,
      hoursUntilExpiration: (expirationTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60)
    });
    
    if (currentTime > expirationTime) {
      console.log('❌ QR EXPIRED - Returning error');
      return NextResponse.json(
        { success: false, message: 'Código QR expirado (más de 12 horas desde la reserva)' },
        { status: 400 }
      );
    }
    
    console.log('✅ QR VALID - Continuing validation');

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

    // Incrementar la asistencia actual
    const currentAsistencia = qrCodeEntry.scanCount || 0;
    const maxAsistencia = reserva.guestCount || 1;

    // Permitir exceso - no bloquear si supera el máximo
    // Solo informar el estado actual

    // Actualizar el contador de escaneos
    const newAsistencia = currentAsistencia + 1;
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
    
    // Respuesta exitosa con información de exceso
    return NextResponse.json({
      success: true,
      message: exceso > 0 ? 
        `Entrada registrada (${exceso} persona${exceso > 1 ? 's' : ''} adicional${exceso > 1 ? 'es' : ''})` :
        'Entrada registrada exitosamente',
      reservaId: reservaId,
      incrementCount: newAsistencia,
      maxAsistencia: maxAsistencia,
      exceso: exceso,
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
    console.error('Error al procesar QR:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
