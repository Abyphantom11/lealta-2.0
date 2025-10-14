import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EstadoReserva } from '@/app/reservas/types/reservation';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

// Función para mapear estado de Prisma a nuestro estado en español
function mapPrismaStatusToReserva(status: string): EstadoReserva {
  switch (status) {
    case 'PENDING': return 'En Progreso';
    case 'CONFIRMED': return 'Activa';
    case 'CHECKED_IN': return 'Activa';
    case 'COMPLETED': return 'En Camino';
    case 'CANCELLED': return 'Reserva Caída';
    case 'NO_SHOW': return 'Reserva Caída';
    default: return 'En Progreso';
  }
}

// Función para mapear nuestro estado a Prisma
function mapReservaStatusToPrisma(estado: EstadoReserva): 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' {
  switch (estado) {
    case 'En Progreso': return 'PENDING';
    case 'Activa': return 'CONFIRMED';
    case 'En Camino': return 'COMPLETED';
    case 'Reserva Caída': return 'CANCELLED';
    default: return 'PENDING';
  }
}

// GET /api/reservas/[id] - Obtener una reserva específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const businessIdOrSlug = searchParams.get('businessId');

    if (!businessIdOrSlug) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Buscar el business por ID o slug
    let business;
    try {
      business = await prisma.business.findFirst({
        where: {
          OR: [
            { id: businessIdOrSlug },
            { slug: businessIdOrSlug }
          ]
        }
      });
    } catch {
      business = await prisma.business.findUnique({
        where: { slug: businessIdOrSlug }
      });
    }

    if (!business) {
      return NextResponse.json(
        { error: 'Business no encontrado' },
        { status: 404 }
      );
    }
    
    const businessId = business.id;

    // Buscar la reserva
    const reservation = await prisma.reservation.findFirst({
      where: { 
        id,
        businessId 
      },
      include: {
        service: true,
        slot: true,
        qrCodes: true,
        promotor: true // ✅ Incluir datos del promotor
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Formatear la respuesta con los datos disponibles
    const response = {
      id: reservation.id,
      businessId: reservation.businessId,
      cliente: {
        id: reservation.clienteId || '',
        nombre: reservation.customerName,
        telefono: reservation.customerPhone || undefined,
        email: reservation.customerEmail || undefined,
      },
      numeroPersonas: reservation.guestCount,
      razonVisita: reservation.specialRequests || '',
      beneficiosReserva: reservation.notes || '',
      promotor: {
        id: reservation.promotorId || '',
        nombre: reservation.promotor?.nombre || 'Sistema'
      },
      promotorId: reservation.promotorId || undefined, // ✅ Incluir promotorId
      fecha: reservation.reservedAt.toISOString().split('T')[0],
      hora: reservation.reservedAt.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      codigoQR: `res-${reservation.id}`,
      asistenciaActual: reservation.qrCodes[0]?.scanCount || 0,
      estado: mapPrismaStatusToReserva(reservation.status),
      fechaCreacion: reservation.createdAt.toISOString(),
      fechaModificacion: reservation.updatedAt.toISOString(),
      mesa: (reservation.metadata as any)?.mesa || '',
      detalles: (reservation.metadata as any)?.detalles || [],
      comprobanteSubido: !!(reservation.metadata as any)?.comprobanteUrl,
      comprobanteUrl: (reservation.metadata as any)?.comprobanteUrl || undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en GET /api/reservas/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener reserva' },
      { status: 500 }
    );
  }
}

// Helper functions for PUT request processing
async function parseRequestBody(request: NextRequest) {
  const rawBody = await request.text();
  console.log('📄 Raw body received:', rawBody);
  
  if (!rawBody || rawBody.trim() === '') {
    throw new Error('EMPTY_BODY');
  }

  try {
    const updates = JSON.parse(rawBody);
    console.log('✅ JSON parseado exitosamente:', updates);
    return updates;
  } catch (parseError) {
    console.error('❌ Error parseando JSON:', parseError);
    throw new Error('INVALID_JSON');
  }
}

async function validateRequestParams(id: string, businessIdOrSlug: string, updates: any, request: NextRequest) {
  if (!id || typeof id !== 'string') {
    throw new Error('INVALID_ID');
  }

  if (!businessIdOrSlug) {
    console.error('❌ BusinessId faltante en PUT request:', {
      url: request.url,
      method: request.method
    });
    throw new Error('MISSING_BUSINESS_ID');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('INVALID_UPDATES');
  }
}

async function findBusinessByIdOrSlug(businessIdOrSlug: string) {
  let business;
  try {
    business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: businessIdOrSlug },
          { slug: businessIdOrSlug }
        ]
      }
    });
  } catch {
    business = await prisma.business.findUnique({
      where: { slug: businessIdOrSlug }
    });
  }

  if (!business) {
    throw new Error('BUSINESS_NOT_FOUND');
  }
  
  return business.id;
}

async function validateAndGetPromotorId(updates: any, currentReservation: any) {
  let promotorId = currentReservation?.promotorId;
  const newPromotorId = updates.promotorId || updates.promotor?.id;
  
  if (newPromotorId) {
    console.log('🔍 Validando promotor:', newPromotorId);
    const promotorExists = await prisma.promotor.findUnique({
      where: { id: newPromotorId }
    });
    
    if (!promotorExists) {
      console.error('❌ Promotor no encontrado:', newPromotorId);
      throw new Error('PROMOTOR_NOT_FOUND');
    }
    console.log('✅ Promotor válido:', promotorExists.nombre);
    promotorId = newPromotorId;
  }

  return promotorId;
}

function prepareUpdateData(updates: any, currentMetadata: any, promotorId: string, currentReservation: any) {
  const newMetadata = {
    ...currentMetadata,
    ...(updates.mesa !== undefined && { mesa: updates.mesa }),
    ...(updates.detalles !== undefined && { detalles: updates.detalles }),
  };

  const updateData: any = {};
  
  if (updates.cliente?.nombre !== undefined) updateData.customerName = updates.cliente.nombre;
  if (updates.cliente?.telefono !== undefined) updateData.customerPhone = updates.cliente.telefono;
  if (updates.cliente?.email !== undefined) updateData.customerEmail = updates.cliente.email;
  if (updates.numeroPersonas !== undefined) updateData.guestCount = updates.numeroPersonas;
  if (updates.razonVisita !== undefined) updateData.specialRequests = updates.razonVisita;
  if (updates.beneficiosReserva !== undefined) updateData.notes = updates.beneficiosReserva;
  if (updates.estado !== undefined) updateData.status = mapReservaStatusToPrisma(updates.estado);
  if (Object.keys(newMetadata).length > 0) updateData.metadata = newMetadata;
  if (promotorId !== currentReservation?.promotorId) updateData.promotorId = promotorId;

  return updateData;
}

function formatReservaResponse(updatedReservation: any) {
  const metadata = updatedReservation.metadata || {};
  return {
    id: updatedReservation.id,
    businessId: updatedReservation.businessId,
    cliente: {
      id: updatedReservation.clienteId || '',
      nombre: updatedReservation.customerName,
      telefono: updatedReservation.customerPhone || undefined,
      email: updatedReservation.customerEmail || undefined,
    },
    numeroPersonas: updatedReservation.guestCount,
    razonVisita: updatedReservation.specialRequests || '',
    beneficiosReserva: updatedReservation.notes || '',
    promotor: {
      id: updatedReservation.promotorId || '',
      nombre: updatedReservation.promotor?.nombre || 'Sistema'
    },
    fecha: updatedReservation.reservedAt.toISOString().split('T')[0],
    hora: updatedReservation.reservedAt.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    codigoQR: updatedReservation.qrCodes[0]?.qrToken || '',
    asistenciaActual: updatedReservation.qrCodes[0]?.scanCount || 0,
    estado: mapPrismaStatusToReserva(updatedReservation.status),
    fechaCreacion: updatedReservation.createdAt.toISOString(),
    fechaModificacion: updatedReservation.updatedAt.toISOString(),
    mesa: metadata.mesa || '',
    detalles: metadata.detalles || [],
    comprobanteSubido: !!metadata.comprobanteUrl,
    comprobanteUrl: metadata.comprobanteUrl || undefined,
  };
}

function handlePutError(error: unknown) {
  console.error('❌ Error updating reserva:', error);
  
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    
    // Handle specific custom errors
    switch (error.message) {
      case 'EMPTY_BODY':
        return NextResponse.json(
          { error: 'Body de la petición está vacío' },
          { status: 400 }
        );
      case 'INVALID_JSON':
        return NextResponse.json(
          { error: 'JSON inválido en el body' },
          { status: 400 }
        );
      case 'INVALID_ID':
        return NextResponse.json(
          { error: 'ID de reserva inválido' },
          { status: 400 }
        );
      case 'MISSING_BUSINESS_ID':
        return NextResponse.json(
          { 
            error: 'businessId es requerido como query parameter',
            example: '/api/reservas/ID?businessId=YOUR_BUSINESS_ID'
          },
          { status: 400 }
        );
      case 'INVALID_UPDATES':
        return NextResponse.json(
          { error: 'Datos de actualización inválidos' },
          { status: 400 }
        );
      case 'BUSINESS_NOT_FOUND':
        return NextResponse.json(
          { error: 'Business no encontrado' },
          { status: 404 }
        );
      case 'PROMOTOR_NOT_FOUND':
        return NextResponse.json(
          { error: 'Promotor no encontrado' },
          { status: 400 }
        );
    }
  }
  
  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    console.error('Prisma error code:', prismaError.code);
    console.error('Prisma error meta:', prismaError.meta);
    
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Violación de restricción única' },
        { status: 400 }
      );
    }
    
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }
    
    if (prismaError.code?.startsWith('P2')) {
      return NextResponse.json(
        { success: false, error: 'Error de validación de datos', details: prismaError.message },
        { status: 400 }
      );
    }
  }
  
  return NextResponse.json(
    { success: false, error: 'Error al actualizar la reserva', details: error instanceof Error ? error.message : 'Error desconocido' },
    { status: 500 }
  );
}

// PUT /api/reservas/[id] - Actualizar una reserva
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const businessIdOrSlug = searchParams.get('businessId');
    
    // Log inicial
    console.log('🔄 PUT /api/reservas/[id] - Inicio:', {
      id,
      businessIdOrSlug,
      method: request.method,
      url: request.url
    });

    // Parse and validate request
    const updates = await parseRequestBody(request);
    await validateRequestParams(id, businessIdOrSlug!, updates, request);
    
    console.log('📝 PUT /api/reservas/[id] - Datos validados:', {
      id,
      businessIdOrSlug,
      updates: JSON.stringify(updates, null, 2)
    });

    // Find business and current reservation
    const businessId = await findBusinessByIdOrSlug(businessIdOrSlug!);
    const currentReservation = await prisma.reservation.findUnique({
      where: { id }
    });
    
    const currentMetadata = (currentReservation?.metadata as any) || {};
    
    // Validate promotor and prepare update data
    const promotorId = await validateAndGetPromotorId(updates, currentReservation);
    const updateData = prepareUpdateData(updates, currentMetadata, promotorId, currentReservation);

    console.log('📝 Datos a actualizar:', JSON.stringify(updateData, null, 2));
    console.log('💾 Actualizando reserva con promotorId:', promotorId);

    // Update reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id, businessId },
      data: updateData,
      include: { qrCodes: true, promotor: true }
    });

    // Format and return response
    const reserva = formatReservaResponse(updatedReservation);

    return NextResponse.json({ 
      success: true,
      reserva,
      message: 'Reserva actualizada exitosamente'
    });

  } catch (error) {
    return handlePutError(error);
  }
}

// DELETE /api/reservas/[id] - Eliminar una reserva
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;
    
    console.log('🗑️ Eliminando reserva:', reservationId);

    // Buscar la reserva primero para verificar que existe
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        qrCodes: true
      }
    });

    if (!reservation) {
      console.log('❌ Reserva no encontrada:', reservationId);
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar en el orden correcto (por las foreign keys)
    // 1. Eliminar códigos QR asociados
    if (reservation.qrCodes.length > 0) {
      await prisma.reservationQRCode.deleteMany({
        where: { reservationId: reservationId }
      });
      console.log(`✅ ${reservation.qrCodes.length} códigos QR eliminados`);
    }

    // 2. Eliminar la reserva
    await prisma.reservation.delete({
      where: { id: reservationId }
    });

    console.log('✅ Reserva eliminada exitosamente:', reservationId);

    return NextResponse.json({
      success: true,
      message: 'Reserva eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando reserva:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la reserva' },
      { status: 500 }
    );
  }
}
