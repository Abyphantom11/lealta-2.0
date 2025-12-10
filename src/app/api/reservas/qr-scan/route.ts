import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { emitReservationEvent } from '../events/route';
import { BUSINESS_TIMEZONE } from '../../../../lib/timezone-utils';
import crypto from 'node:crypto';

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

interface EventQRResult {
  type: 'EVENT_GUEST';
  qrToken: string;
}

interface TimeValidationResult {
  isValid: boolean;
  message?: string;
}

export const dynamic = 'force-dynamic';

// Función auxiliar: Parsear el código QR
async function parseQRCode(qrCode: string): Promise<ParsedQRResult | EventQRResult | NextResponse> {
  // Check if it's a simple event guest token (not JSON, not reservation ID)
  // Event tokens are typically 12-character nanoid strings
  if (!qrCode.startsWith('res-') && !qrCode.startsWith('cmg') && !qrCode.startsWith('{')) {
    // Could be an event guest token - check if it exists
    console.log('🎟️ Checking if this is an event guest token:', qrCode);
    
    const eventGuest = await prisma.eventGuest.findUnique({
      where: { qrToken: qrCode }
    });
    
    if (eventGuest) {
      console.log('✅ Found event guest:', eventGuest.name);
      return {
        type: 'EVENT_GUEST',
        qrToken: qrCode
      } as EventQRResult;
    }
    
    // Not an event token, continue with other checks
    console.log('ℹ️ Not an event token, trying other formats...');
  }
  
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
  const qrExpiresAt = new Date(reservationDateTime.getTime() + (24 * 60 * 60 * 1000)); // 24h después
  
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
      message: `Código QR expirado hace ${hoursExpired} horas (más de 24 horas desde la hora de tu reserva)`
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

  // 🔥 CRÍTICO: Actualizar HostTracking.guestCount para sincronizar con scanCount
  // El API /api/reservas usa HostTracking.guestCount para mostrar asistenciaActual
  const hostTracking = await prisma.hostTracking.findFirst({
    where: { reservationId: reservaId }
  });

  if (hostTracking) {
    // Si existe HostTracking, actualizarlo con el nuevo valor
    await prisma.hostTracking.update({
      where: { id: hostTracking.id },
      data: {
        guestCount: newAsistencia,
        updatedAt: new Date()
      }
    });
    console.log(`✅ HostTracking actualizado: guestCount = ${newAsistencia}`);
  } else {
    // Si no existe HostTracking, crearlo SIEMPRE (para cualquier cantidad de personas)
    // Esto es necesario porque el API usa HostTracking.guestCount para mostrar asistencia
    
    // 🔍 Verificar que clienteId existe, si no, buscar o crear uno
    let clienteIdFinal = reserva.clienteId;
    
    if (!clienteIdFinal) {
      console.warn('⚠️ Reserva sin clienteId, buscando o creando cliente...');
      
      // Buscar cliente existente por teléfono
      let clienteExistente = null;
      if (reserva.customerPhone) {
        clienteExistente = await prisma.cliente.findFirst({
          where: { 
            telefono: reserva.customerPhone,
            businessId: reserva.businessId
          }
        });
      }
      
      if (clienteExistente) {
        clienteIdFinal = clienteExistente.id;
        console.log(`✅ Cliente encontrado: ${clienteExistente.nombre}`);
        
        // Actualizar la reserva con el clienteId
        await prisma.reservation.update({
          where: { id: reservaId },
          data: { clienteId: clienteIdFinal }
        });
      } else {
        // Crear cliente nuevo con todos los campos requeridos
        const cedulaTemporal = reserva.customerPhone || `TEMP-${Date.now()}`;
        const nuevoCliente = await prisma.cliente.create({
          // @ts-ignore - Prisma types issue with nested create, works at runtime
          data: {
            businessId: reserva.businessId,
            cedula: cedulaTemporal,
            nombre: reserva.customerName || 'Cliente',
            telefono: reserva.customerPhone || cedulaTemporal,
            correo: reserva.customerEmail || `temp-${Date.now()}@lealta.app`
          }
        });
        clienteIdFinal = nuevoCliente.id;
        console.log(`✅ Cliente creado: ${nuevoCliente.nombre} (${cedulaTemporal})`);
        
        // Actualizar la reserva con el clienteId
        await prisma.reservation.update({
          where: { id: reservaId },
          data: { clienteId: clienteIdFinal }
        });
      }
    }
    
    if (!clienteIdFinal) {
      throw new Error('No se pudo obtener o crear clienteId para HostTracking');
    }
    
    try {
      const newHostTracking = await prisma.hostTracking.create({
        data: {
          id: crypto.randomBytes(16).toString('hex'),
          businessId: reserva.businessId,
          reservationId: reservaId,
          clienteId: clienteIdFinal,
          reservationName: reserva.customerName || 'Cliente',
          tableNumber: null,
          reservationDate: reserva.reservedAt,
          guestCount: newAsistencia,
          isActive: true
        }
      });
      console.log(`✅ HostTracking creado: ID=${newHostTracking.id}, guestCount=${newAsistencia}`);
    } catch (createError) {
      console.error('❌ ERROR CRÍTICO creando HostTracking:');
      console.error('  Reserva ID:', reservaId);
      console.error('  Cliente ID:', clienteIdFinal);
      console.error('  Error:', createError);
      
      if (createError instanceof Error) {
        console.error('  Message:', createError.message);
        console.error('  Stack:', createError.stack);
      }
      
      // NO capturar el error, dejarlo propagarse
      throw createError;
    }
  }

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

    // 🎟️ Handle Event Guest QR
    if ('type' in parseResult && parseResult.type === 'EVENT_GUEST') {
      console.log('🎟️ Processing event guest check-in:', parseResult.qrToken);
      
      // Call the event check-in logic
      const eventGuest = await prisma.eventGuest.findUnique({
        where: { qrToken: parseResult.qrToken },
        include: { Event: true }
      });

      if (!eventGuest) {
        return NextResponse.json(
          { success: false, message: 'Entrada de evento no válida' },
          { status: 404 }
        );
      }

      // If action is 'info', just return the guest information without checking in
      if (action === 'info') {
        return NextResponse.json({
          success: true,
          type: 'EVENT_GUEST',
          alreadyCheckedIn: eventGuest.status === 'CHECKED_IN',
          guest: {
            id: eventGuest.id,
            name: eventGuest.name,
            guestCount: eventGuest.guestCount,
            status: eventGuest.status,
            checkedInAt: eventGuest.checkedInAt
          },
          event: {
            name: eventGuest.Event.name
          },
          message: eventGuest.status === 'CHECKED_IN' 
            ? `⚠️ Código ya canjeado - ${eventGuest.name} ya registró entrada`
            : `${eventGuest.name} - Listo para check-in`
        });
      }

      // Check if already checked in (for actual check-in action)
      if (eventGuest.status === 'CHECKED_IN') {
        return NextResponse.json({
          success: false,
          type: 'EVENT_GUEST',
          alreadyCheckedIn: true,
          canjeado: true,
          guest: {
            id: eventGuest.id,
            name: eventGuest.name,
            checkedInAt: eventGuest.checkedInAt
          },
          event: {
            name: eventGuest.Event.name
          },
          message: `⚠️ Código ya canjeado - ${eventGuest.name} ya registró entrada el ${eventGuest.checkedInAt?.toLocaleString('es-EC')}`
        });
      }

      // Perform check-in
      const updatedGuest = await prisma.eventGuest.update({
        where: { id: eventGuest.id },
        data: {
          status: 'CHECKED_IN',
          checkedInAt: new Date(),
          checkedInBy: 'scanner'
        }
      });

      return NextResponse.json({
        success: true,
        type: 'EVENT_GUEST',
        guest: {
          id: updatedGuest.id,
          name: updatedGuest.name,
          guestCount: updatedGuest.guestCount,
          checkedInAt: updatedGuest.checkedInAt
        },
        event: {
          name: eventGuest.Event.name
        },
        message: `✅ Bienvenido ${updatedGuest.name}!`
      });
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
