import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

interface QRData {
  reservaId: string;
  token: string;
  timestamp: number;
  cliente: string;
  fecha: string;
  hora: string;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode, action, increment, businessId } = body;

    console.log('🔍 qr-scan endpoint - Recibido:', { 
      action, 
      businessId, 
      qrCodeLength: qrCode?.length,
      qrCodePreview: qrCode?.substring(0, 50) + (qrCode?.length > 50 ? '...' : '')
    });

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'Código QR requerido' },
        { status: 400 }
      );
    }

    let reservaId: string;
    let token: string | undefined;

    // Parsear el QR (puede ser JSON completo o ID simple)
    if (qrCode.startsWith('res-') || qrCode.startsWith('cmg')) {
      console.log('📝 Detectado ID simple de reserva');
      reservaId = qrCode.replace('res-', '');
      
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
      
    } else {
      console.log('📋 Detectado JSON completo');
      let qrData: QRData;
      try {
        qrData = JSON.parse(qrCode);
        reservaId = qrData.reservaId;
        token = qrData.token;
      } catch (parseError) {
        console.error('❌ Error al parsear QR JSON:', parseError);
        return NextResponse.json(
          { success: false, message: 'Código QR inválido o corrupto' },
          { status: 400 }
        );
      }

      if (!reservaId || !token) {
        return NextResponse.json(
          { success: false, message: 'Datos del QR incompletos' },
          { status: 400 }
        );
      }
    }

    console.log('✅ Datos procesados:', { reservaId, token });

    // Buscar la reserva
    const reserva = await prisma.reservation.findUnique({
      where: { id: reservaId },
      include: {
        cliente: true,
        service: true,
        slot: true,
        qrCodes: true
      }
    });

    if (!reserva) {
      console.log('❌ Reserva no encontrada:', reservaId);
      return NextResponse.json(
        { success: false, message: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    console.log('📋 Reserva encontrada:', {
      id: reserva.id,
      customerName: reserva.customerName,
      reservedAt: reserva.reservedAt,
      status: reserva.status,
      qrCodesCount: reserva.qrCodes.length
    });

    // Verificar el token QR
    const qrCodeEntry = reserva.qrCodes.find(qr => qr.qrToken === token);
    
    console.log('🔑 Validación de token:', {
      tokenBuscado: token,
      tokensDisponibles: reserva.qrCodes.map(qr => qr.qrToken),
      tokenEncontrado: !!qrCodeEntry
    });
    
    if (!qrCodeEntry) {
      console.log('❌ Token QR no coincide con ninguno de la reserva');
      return NextResponse.json(
        { success: false, message: 'Token QR inválido' },
        { status: 404 }
      );
    }

    // Verificar que la reserva tenga fecha válida
    if (!reserva.reservedAt) {
      return NextResponse.json(
        { success: false, message: 'Reserva sin fecha válida' },
        { status: 400 }
      );
    }

    // Validación de ventana de tiempo del QR:
    // - QR válido desde: 24 horas ANTES de la hora de reserva
    // - QR válido hasta: 12 horas DESPUÉS de la hora de reserva
    const currentTime = new Date();
    const reservationDateTime = new Date(reserva.reservedAt);
    
    // Calcular ventana de validez
    const qrValidFrom = new Date(reservationDateTime.getTime() - (24 * 60 * 60 * 1000)); // 24h antes
    const qrExpiresAt = new Date(reservationDateTime.getTime() + (12 * 60 * 60 * 1000)); // 12h después
    
    // DEBUG: Logs de validación de expiración
    console.log('🕐 Validación de expiración:', {
      currentTime: currentTime.toISOString(),
      reservedAt: reserva.reservedAt,
      reservationDateTime: reservationDateTime.toISOString(),
      qrValidFrom: qrValidFrom.toISOString(),
      qrExpiresAt: qrExpiresAt.toISOString(),
      isTooEarly: currentTime < qrValidFrom,
      isExpired: currentTime > qrExpiresAt,
      hoursUntilReservation: ((reservationDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60)).toFixed(2),
      hoursUntilExpiration: ((qrExpiresAt.getTime() - currentTime.getTime()) / (1000 * 60 * 60)).toFixed(2)
    });
    
    // Verificar si el QR aún no es válido (más de 24h antes de la reserva)
    if (currentTime < qrValidFrom) {
      const hoursUntilValid = Math.ceil((qrValidFrom.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
      return NextResponse.json(
        { 
          success: false, 
          message: `Código QR aún no es válido. Será válido ${hoursUntilValid} horas antes de tu reserva.` 
        },
        { status: 400 }
      );
    }
    
    // Verificar si el QR ya expiró (más de 12h después de la reserva)
    if (currentTime > qrExpiresAt) {
      return NextResponse.json(
        { success: false, message: 'Código QR expirado (más de 12 horas desde la hora de tu reserva)' },
        { status: 400 }
      );
    }

    // ✅ FLUJO DE ESTADOS CORRECTO:
    // - PENDING: Reserva confirmada, esperando llegada del cliente
    // - CHECKED_IN: Cliente llegó (primer escaneo realizado)
    // - COMPLETED: Reserva finalizada
    // 
    // NO rechazamos reservas PENDING, el primer escaneo las activa automáticamente

    // ACCIÓN: INFO (obtener información sin incrementar)
    if (action === 'info') {
      const currentAsistencia = qrCodeEntry.scanCount || 0;
      const maxAsistencia = reserva.guestCount || 1;
      const exceso = Math.max(0, currentAsistencia - maxAsistencia);

      console.log('ℹ️ Retornando información de reserva');

      return NextResponse.json({
        success: true,
        message: 'QR válido - información obtenida',
        reservaId: reservaId,
        token: token,
        incrementCount: currentAsistencia,
        maxAsistencia: maxAsistencia,
        exceso: exceso,
        cliente: {
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
    }

    // ACCIÓN: INCREMENT (incrementar asistencia)
    if (action === 'increment') {
      if (!increment || increment < 1) {
        return NextResponse.json(
          { success: false, message: 'Incremento debe ser mayor a 0' },
          { status: 400 }
        );
      }

      const currentAsistencia = qrCodeEntry.scanCount || 0;
      const newAsistencia = currentAsistencia + increment;
      const maxAsistencia = reserva.guestCount || 1;
      const esPrimerEscaneo = currentAsistencia === 0;

      // Actualizar el contador de escaneos
      await prisma.reservationQRCode.update({
        where: { id: qrCodeEntry.id },
        data: {
          scanCount: newAsistencia,
          lastScannedAt: new Date(),
        }
      });

      // ✅ Si es el primer escaneo, cambiar el estado de PENDING a CHECKED_IN
      // Esto marca que el cliente ya llegó al local
      if (esPrimerEscaneo) {
        await prisma.reservation.update({
          where: { id: reservaId },
          data: { 
            status: 'CHECKED_IN',
            updatedAt: new Date() 
          }
        });
        console.log('✅ Primer escaneo - Estado cambiado de PENDING a CHECKED_IN');
      } else {
        // Actualizar solo la fecha de modificación
        await prisma.reservation.update({
          where: { id: reservaId },
          data: { updatedAt: new Date() }
        });
      }

      const exceso = Math.max(0, newAsistencia - maxAsistencia);
      
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

      console.log('✅ Asistencia incrementada:', { newAsistencia, maxAsistencia, exceso });

      return NextResponse.json({
        success: true,
        message: message,
        reservaId: reservaId,
        incrementCount: newAsistencia,
        maxAsistencia: maxAsistencia,
        exceso: exceso,
        increment: increment,
        cliente: {
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
    }

    // Acción no válida
    return NextResponse.json(
      { success: false, message: 'Acción no válida. Use "info" o "increment"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error en qr-scan:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
