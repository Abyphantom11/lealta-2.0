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
    console.log('🔍 DEBUG qr-info - QR recibido:', qrCode);

    let reservaId: string;
    let token: string | undefined;
    let timestamp: number | undefined;

    // Detectar si es JSON completo o solo un ID
    if (qrCode.startsWith('res-') || qrCode.startsWith('cmg')) {
      // Es un ID simple de reserva
      console.log('📝 DEBUG qr-info - Detectado ID simple de reserva');
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
      console.log('🔑 DEBUG qr-info - Token encontrado:', token);
      
    } else {
      // Es JSON completo
      console.log('📋 DEBUG qr-info - Detectado JSON completo');
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

    console.log('✅ DEBUG qr-info - Datos procesados:', { reservaId, token, timestamp });

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
    console.log('🔍 DEBUG QR Validation:', {
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

    // Obtener información actual SIN incrementar
    const currentAsistencia = qrCodeEntry.scanCount || 0;
    const maxAsistencia = reserva.guestCount || 1;
    const exceso = Math.max(0, currentAsistencia - maxAsistencia);

    // Respuesta con información actual (SIN incrementar)
    return NextResponse.json({
      success: true,
      message: 'QR válido - información obtenida',
      reservaId: reservaId,
      token: token, // Devolver el token para usar en incrementos posteriores
      incrementCount: currentAsistencia,
      maxAsistencia: maxAsistencia,
      exceso: exceso,
      clienteCliente: {
        nombre: reserva.customerName || 'Cliente',
        telefono: reserva.customerPhone || ''
      },
      reserva: {
        fecha: reserva.slot?.date ? new Date(reserva.slot.date).toISOString().split('T')[0] : '',
        hora: reserva.slot?.startTime ? 
          new Date(reserva.slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
        servicio: reserva.service?.name || '',
        observaciones: reserva.specialRequests || ''
      }
    });

  } catch (error) {
    console.error('Error al obtener información del QR:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
