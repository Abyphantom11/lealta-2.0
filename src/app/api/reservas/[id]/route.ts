import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

// GET /api/reservas/[id] - Obtener una reserva específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

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
      promotor: { id: '', nombre: 'Sistema' },
      fecha: reservation.reservedAt.toISOString().split('T')[0],
      hora: reservation.reservedAt.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      codigoQR: reservation.qrCodes[0]?.qrToken || '',
      asistenciaActual: reservation.qrCodes[0]?.scanCount || 0,
      estado: reservation.status,
      fechaCreacion: reservation.createdAt.toISOString(),
      fechaModificacion: reservation.updatedAt.toISOString(),
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

// PUT /api/reservas/[id] - Actualizar una reserva
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Preparar metadata para campos adicionales (mesa, etc.)
    const currentReservation = await prisma.reservation.findUnique({
      where: { id }
    });
    
    const currentMetadata = (currentReservation?.metadata as any) || {};
    const newMetadata = {
      ...currentMetadata,
      ...(updates.mesa !== undefined && { mesa: updates.mesa }),
    };

    // Actualizar la reserva en Prisma
    const updatedReservation = await prisma.reservation.update({
      where: {
        id,
        businessId
      },
      data: {
        // Campos que se pueden actualizar
        customerName: updates.cliente?.nombre,
        customerPhone: updates.cliente?.telefono,
        customerEmail: updates.cliente?.email,
        guestCount: updates.numeroPersonas,
        specialRequests: updates.razonVisita,
        notes: updates.beneficiosReserva,
        status: updates.estado,
        metadata: newMetadata, // ✅ Guardar mesa en metadata
      },
      include: {
        qrCodes: true,
      }
    });

    // Formatear respuesta
    const metadata = (updatedReservation.metadata as any) || {};
    const reserva = {
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
      promotor: { id: '', nombre: 'Sistema' },
      fecha: updatedReservation.reservedAt.toISOString().split('T')[0],
      hora: updatedReservation.reservedAt.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      codigoQR: updatedReservation.qrCodes[0]?.qrToken || '',
      asistenciaActual: updatedReservation.qrCodes[0]?.scanCount || 0,
      estado: updatedReservation.status,
      fechaCreacion: updatedReservation.createdAt.toISOString(),
      fechaModificacion: updatedReservation.updatedAt.toISOString(),
      mesa: metadata.mesa || '', // ✅ Leer mesa desde metadata
    };

    return NextResponse.json({ 
      success: true,
      reserva,
      message: 'Reserva actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating reserva:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la reserva' },
      { status: 500 }
    );
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
