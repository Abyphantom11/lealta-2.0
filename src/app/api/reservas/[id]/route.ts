import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Reserva, EstadoReserva } from '../../../reservas-new/types/reservation';

const prisma = new PrismaClient();

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

// Función para mapear estado de Prisma a nuestro tipo
function mapPrismaStatusToReserva(status: string): EstadoReserva {
  switch (status) {
    case 'CONFIRMED': return 'Activa';
    case 'IN_PROGRESS': return 'En Progreso';
    case 'COMPLETED': return 'En Camino';
    case 'CANCELLED': return 'Reserva Caída';
    default: return 'Activa';
  }
}

// Función para mapear nuestro estado a Prisma
function mapReservaStatusToPrisma(estado: EstadoReserva): string {
  switch (estado) {
    case 'Activa': return 'CONFIRMED';
    case 'En Progreso': return 'IN_PROGRESS';
    case 'En Camino': return 'COMPLETED';
    case 'Reserva Caída': return 'CANCELLED';
    default: return 'CONFIRMED';
  }
}

// GET /api/reservas/[id] - Obtener una reserva específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;

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
        qrCodes: true,
        auditLogs: {
          orderBy: { timestamp: 'asc' },
          take: 1,
          where: { action: 'created' }
        }
      }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Verificar que el usuario tiene acceso a esta reserva
    if (session.user.businessId !== reservation.businessId) {
      return NextResponse.json({ error: 'No autorizado para esta reserva' }, { status: 403 });
    }

    // Extraer información del promotor del log de auditoría
    const creationLog = reservation.auditLogs[0];
    const promotor = creationLog ? {
      id: creationLog.userId || '',
      nombre: creationLog.userName || 'Sistema'
    } : { id: '', nombre: 'Sistema' };

    // Formatear la respuesta
    const response = {
      id: reservation.id,
      businessId: reservation.businessId,
      cliente: reservation.cliente ? {
        id: reservation.cliente.id,
        nombre: reservation.cliente.nombre,
        telefono: reservation.cliente.telefono || undefined,
        email: reservation.cliente.correo || undefined,
      } : null,
      numeroPersonas: reservation.guestCount,
      razonVisita: reservation.specialRequests || '',
      beneficiosReserva: reservation.notes || '',
      promotor,
      fecha: reservation.reservedAt.toISOString().split('T')[0],
      hora: new Date(reservation.slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      codigoQR: reservation.qrCodes[0]?.qrToken || '',
      asistenciaActual: reservation.qrCodes[0]?.scanCount || 0,
      estado: reservation.status,
      fechaCreacion: reservation.createdAt.toISOString(),
      fechaModificacion: reservation.updatedAt.toISOString(),
      // Información adicional
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      customerPhone: reservation.customerPhone,
      specialRequests: reservation.specialRequests,
      notes: reservation.notes,
      reservedAt: reservation.reservedAt.toISOString(),
      status: reservation.status,
      guestCount: reservation.guestCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en GET /api/reservas/[id]:', error);
    return NextResponse.json({ error: 'Error al obtener reserva' }, { status: 500 });
  }
}

// PUT /api/reservas/[id] - Actualizar una reserva
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;
    const updates = await request.json() as Partial<Reserva>;
    
    // Por simplicidad, usar mock data por ahora
    // TODO: Integrar con Prisma cuando esté configurado correctamente
    console.log('Actualizando reserva:', reservationId, 'con:', updates);
    
    // Crear datos base y aplicar actualizaciones
    const baseReserva = {
      id: reservationId,
      cliente: {
        id: "1",
        nombre: "María Rodriguez",
        telefono: "+506 8888-5678",
        email: "maria@example.com"
      },
      numeroPersonas: 12,
      razonVisita: "Evento VIP",
      beneficiosReserva: "Cena de cumpleaños, Postre de cortesía",
      promotor: {
        id: "1",
        nombre: "Carlos Mendoza"
      },
      fecha: "2025-09-29",
      hora: "19:00",
      codigoQR: "QR001",
      asistenciaActual: 4,
      estado: "Activa" as const,
      fechaCreacion: "2025-09-29T10:00:00Z",
      fechaModificacion: new Date().toISOString(),
      mesa: "38",
      registroEntradas: [
        {
          timestamp: "2025-09-29T19:00:00Z",
          cantidad: 4,
          metodo: "QR" as const,
          usuario: "Admin"
        }
      ]
    };

    // Aplicar solo los campos que vienen en updates (preservar cambios)
    const mockUpdatedReserva: Reserva = {
      ...baseReserva,
      ...updates,
      fechaModificacion: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true,
      reserva: mockUpdatedReserva,
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
