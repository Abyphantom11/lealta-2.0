import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { emitReservationEvent } from '../events/route';
import { BUSINESS_TIMEZONE } from '../../../../lib/timezone-utils';

interface QRData {
  reservaId: string;
  token: string;
  timestamp: number;
  cliente: string;
  fecha: string;
  hora: string;
}

interface ParsedQRResult {
  reservaId: string;
  token: string | undefined;
}

interface TimeValidationResult {
  isValid: boolean;
  message?: string;
}

export const dynamic = 'force-dynamic';

// Función auxiliar: Parsear el código QR
async function parseQRCode(qrCode: string): Promise<ParsedQRResult | NextResponse> {
  if (qrCode.startsWith('res-') || qrCode.startsWith('cmg')) {
    console.log('📝 Detectado ID simple de reserva');
    const reservaId = qrCode.replace('res-', '');
    
    const reservaConQR = await prisma.reservation.findUnique({
      where: { id: reservaId },
      include: { ReservationQRCode: true }
    });
    
    if (!reservaConQR || !reservaConQR.ReservationQRCode || reservaConQR.ReservationQRCode.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Reserva no encontrada o sin QR' },
        { status: 404 }
      );
    }
    
    return {
      reservaId,
      token: reservaConQR.ReservationQRCode[0].qrToken
    };
  }
  
  console.log('📋 Detectado JSON completo');
  try {
    const qrData: QRData = JSON.parse(qrCode);
    return {
      reservaId: qrData.reservaId,
      token: qrData.token
    };
  } catch (parseError) {
    console.error('❌ Error al parsear QR JSON:', parseError);
    return NextResponse.json(
      { success: false, message: 'Código QR inválido o corrupto' },
      { status: 400 }
    );
  }
}

// Función auxiliar: Validar ventana de tiempo del QR (CON TIMEZONE CORRECTO)
function validateQRTimeWindow(reservedAt: Date): TimeValidationResult {
  // 🌍 USAR TIMEZONE DEL NEGOCIO para validación consistente
  const ahora = new Date();
  const ahoraEnNegocio = new Date(ahora.toLocaleString('en-US', { timeZone: BUSINESS_TIMEZONE }));
  const reservationDateTime = new Date(reservedAt);
  
  // 🕐 Calcular ventanas usando timezone del negocio
  const qrValidFrom = new Date(reservationDateTime.getTime() - (24 * 60 * 60 * 1000)); // 24h antes
  const qrExpiresAt = new Date(reservationDateTime.getTime() + (12 * 60 * 60 * 1000)); // 12h después
  
  console.log('🕐 Validación de expiración (TIMEZONE AWARE):', {
    currentTimeUTC: ahora.toISOString(),
    currentTimeNegocio: ahoraEnNegocio.toLocaleString('es-CO', { timeZone: BUSINESS_TIMEZONE }),
    reservedAt: reservedAt.toISOString(),
    reservationDateTime: reservationDateTime.toISOString(),
    qrValidFrom: qrValidFrom.toISOString(),
    qrExpiresAt: qrExpiresAt.toISOString(),
    timezone: BUSINESS_TIMEZONE,
    isTooEarly: ahora < qrValidFrom,
    isExpired: ahora > qrExpiresAt,
    hoursUntilReservation: ((reservationDateTime.getTime() - ahora.getTime()) / (1000 * 60 * 60)).toFixed(2),
    hoursUntilExpiration: ((qrExpiresAt.getTime() - ahora.getTime()) / (1000 * 60 * 60)).toFixed(2),
    metodo: 'timezone-aware (NO más desfases)'
  });
  
  if (ahora < qrValidFrom) {
    const hoursUntilValid = Math.ceil((qrValidFrom.getTime() - ahora.getTime()) / (1000 * 60 * 60));
    return {
      isValid: false,
      message: `Código QR aún no es válido. Será válido ${hoursUntilValid} horas antes de tu reserva.`
    };
  }
  
  if (ahora > qrExpiresAt) {
    const hoursExpired = Math.ceil((ahora.getTime() - qrExpiresAt.getTime()) / (1000 * 60 * 60));
    return {
      isValid: false,
      message: `Código QR expirado hace ${hoursExpired} horas (más de 12 horas desde la hora de tu reserva)`
    };
  }
  
  return { isValid: true };
}

// Función auxiliar: Construir respuesta de información de reserva
function buildReservationInfoResponse(
  reserva: any,
  qrCodeEntry: any,
  reservaId: string,
  token: string | undefined
) {
  const currentAsistencia = qrCodeEntry.scanCount || 0;
  const maxAsistencia = reserva.guestCount || 1;
  const exceso = Math.max(0, currentAsistencia - maxAsistencia);

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
      fecha: reserva.ReservationSlot?.date ? new Date(reserva.ReservationSlot.date).toISOString().split('T')[0] : '',
      hora: reserva.ReservationSlot?.startTime ? 
        new Date(reserva.ReservationSlot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
      servicio: reserva.ReservationService?.name || '',
      observaciones: reserva.specialRequests || ''
    }
  });
}

// Función auxiliar: Emitir evento SSE de forma segura
function emitSSEEvent(businessId: string, eventData: any) {
  try {
    const businessIdNum = Number.parseInt(businessId);
    if (!Number.isNaN(businessIdNum)) {
      emitReservationEvent(businessIdNum, eventData);
      console.log('📡 Evento SSE emitido:', eventData.type);
    }
  } catch (sseError) {
    console.error('⚠️ Error emitiendo evento SSE:', sseError);
  }
}

// Función auxiliar: Manejar incremento de asistencia
async function handleIncrementAction(
  increment: number,
  qrCodeEntry: any,
  reserva: any,
  reservaId: string
) {
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

  // Si es el primer escaneo, cambiar el estado a CHECKED_IN
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
    await prisma.reservation.update({
      where: { id: reservaId },
      data: { updatedAt: new Date() }
    });
  }

  const exceso = Math.max(0, newAsistencia - maxAsistencia);
  
  // Emitir evento SSE para sincronización en tiempo real
  emitSSEEvent(reserva.businessId, {
    type: 'asistencia_updated',
    reservaId: reservaId,
    asistenciaActual: newAsistencia,
    increment: increment,
    isFirstCheckIn: esPrimerEscaneo,
    newStatus: esPrimerEscaneo ? 'CHECKED_IN' : reserva.status
  });
  
  const message = buildIncrementMessage(increment, exceso);
  console.log('✅ Asistencia incrementada:', { newAsistencia, maxAsistencia, exceso });

  // Emitir evento SSE: QR escaneado
  emitSSEEvent(reserva.businessId, {
    type: 'qr-scanned',
    reservationId: reservaId,
    customerName: reserva.customerName || 'Cliente',
    scanCount: newAsistencia,
    maxGuests: maxAsistencia,
    increment: increment,
    isFirstScan: esPrimerEscaneo,
    newStatus: esPrimerEscaneo ? 'CHECKED_IN' : reserva.status
  });

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
      fecha: reserva.ReservationSlot?.date ? new Date(reserva.ReservationSlot.date).toISOString().split('T')[0] : '',
      hora: reserva.ReservationSlot?.startTime ? 
        new Date(reserva.ReservationSlot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
      servicio: reserva.ReservationService?.name || '',
      observaciones: reserva.specialRequests || ''
    }
  });
}

// Función auxiliar: Construir mensaje de incremento
function buildIncrementMessage(increment: number, exceso: number): string {
  if (increment === 1) {
    return exceso > 0 ? 
      `Entrada registrada (1 persona adicional sobre el límite)` :
      'Entrada registrada exitosamente';
  }
  return exceso > 0 ? 
    `Registradas ${increment} personas (${exceso} adicionales sobre el límite)` :
    `Registradas ${increment} personas exitosamente`;
}

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

    // Parsear el QR
    const parseResult = await parseQRCode(qrCode);
    if (parseResult instanceof NextResponse) {
      return parseResult; // Error en el parsing
    }

    const { reservaId, token } = parseResult;

    if (!reservaId || !token) {
      return NextResponse.json(
        { success: false, message: 'Datos del QR incompletos' },
        { status: 400 }
      );
    }

    console.log('✅ Datos procesados:', { reservaId, token });

    // Buscar la reserva
    const reserva = await prisma.reservation.findUnique({
      where: { id: reservaId },
      include: {
        Cliente: true,
        ReservationService: true,
        ReservationSlot: true,
        ReservationQRCode: true
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
      qrCodesCount: reserva.ReservationQRCode?.length || 0
    });

    // Verificar el token QR
    const qrCodeEntry = reserva.ReservationQRCode?.find(qr => qr.qrToken === token);
    
    console.log('🔑 Validación de token:', {
      tokenBuscado: token,
      tokensDisponibles: reserva.ReservationQRCode?.map(qr => qr.qrToken) || [],
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

    // Validar ventana de tiempo del QR
    const timeValidation = validateQRTimeWindow(reserva.reservedAt);
    if (!timeValidation.isValid) {
      return NextResponse.json(
        { success: false, message: timeValidation.message || 'QR fuera de ventana de validez' },
        { status: 400 }
      );
    }

    // Manejar acción INFO
    if (action === 'info') {
      console.log('ℹ️ Retornando información de reserva');
      return buildReservationInfoResponse(reserva, qrCodeEntry, reservaId, token);
    }

    // Manejar acción INCREMENT
    if (action === 'increment') {
      return await handleIncrementAction(increment, qrCodeEntry, reserva, reservaId);
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
