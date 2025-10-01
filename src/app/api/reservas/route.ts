import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { Reserva, EstadoReserva } from '../../reservas/types/reservation';
import crypto from 'crypto';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

// Función para generar código QR único
function generateQRCode(): string {
  return `QR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// Función para generar número de reserva único
// Función para mapear estado de Prisma a nuestro tipo
function mapPrismaStatusToReserva(status: string): EstadoReserva {
  switch (status) {
    case 'PENDING': return 'Activa';
    case 'CONFIRMED': return 'Activa';
    case 'CHECKED_IN': return 'En Espera';
    case 'COMPLETED': return 'En Camino';
    case 'CANCELLED': return 'Reserva Caída';
    case 'NO_SHOW': return 'Reserva Caída';
    default: return 'Activa';
  }
}

// Función para mapear nuestro estado a Prisma
function mapReservaStatusToPrisma(estado: EstadoReserva): 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' {
  switch (estado) {
    case 'Activa': return 'CONFIRMED';
    case 'En Espera': return 'CHECKED_IN';
    case 'En Camino': return 'COMPLETED';
    case 'Reserva Caída': return 'CANCELLED';
    default: return 'CONFIRMED';
  }
}

// GET - Obtener todas las reservas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId') || 'default-business-id';
    
    // Buscar reservas en la base de datos
    const reservations = await prisma.reservation.findMany({
      where: {
        businessId: businessId
      },
      include: {
        cliente: true,
        service: true,
        slot: true,
        qrCodes: true
      },
      orderBy: {
        reservedAt: 'asc' // ✅ Ordenar por hora de llegada (ascendente = primero las más tempranas)
      }
    });

    // Mapear a nuestro formato de Reserva
    const reservas: Reserva[] = reservations.map(reservation => {
      const metadata = (reservation.metadata as any) || {};
      
      return {
        id: reservation.id,
        cliente: {
          id: reservation.cliente?.id || `temp-${Date.now()}`,
          nombre: reservation.customerName,
          telefono: reservation.customerPhone || undefined,
          email: reservation.customerEmail || undefined
        },
        numeroPersonas: reservation.guestCount,
        razonVisita: reservation.specialRequests || 'Reserva general',
        beneficiosReserva: reservation.notes || 'Sin beneficios especiales',
        promotor: {
          id: reservation.serviceId,
          nombre: reservation.service?.name || 'Servicio General'
        },
        fecha: reservation.slot?.date ? new Date(reservation.slot.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        hora: reservation.slot?.startTime ? 
          new Date(reservation.slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '19:00',
        codigoQR: reservation.qrCodes[0]?.qrToken || generateQRCode(),
        asistenciaActual: reservation.qrCodes[0]?.scanCount || 0,
        estado: mapPrismaStatusToReserva(reservation.status),
        fechaCreacion: reservation.createdAt.toISOString(),
        fechaModificacion: reservation.updatedAt.toISOString(),
        mesa: metadata.mesa || '', // ✅ Leer mesa desde metadata JSON
        registroEntradas: []
      };
    });

    return NextResponse.json({ 
      success: true, 
      reservas 
    });

  } catch (error) {
    console.error('Error fetching reservas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva reserva
export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as Omit<Reserva, 'id'>;
    
    // Obtener businessId del query parameter o usar default
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId') || 'default-business-id';
    
    console.log('🏢 BusinessId para crear reserva:', businessId);

    // Asegurar que el business existe
    let business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      console.log('⚠️ Business no encontrado, creando uno por defecto...');
      // Crear business por defecto
      business = await prisma.business.create({
        data: {
          id: businessId,
          name: 'Negocio de Prueba',
          slug: 'negocio-prueba',
          subdomain: 'negocio-prueba'
        }
      });
      console.log('✅ Business creado:', business.id);
    }

    // Validaciones básicas
    if (!data.cliente?.nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre del cliente es obligatorio' },
        { status: 400 }
      );
    }

    if (!data.fecha || !data.hora) {
      return NextResponse.json(
        { success: false, error: 'La fecha y hora son obligatorias' },
        { status: 400 }
      );
    }

    if (!data.numeroPersonas || data.numeroPersonas < 1) {
      return NextResponse.json(
        { success: false, error: 'El número de personas debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // 1. Crear o buscar el cliente
    let cliente;
    if (data.cliente.email) {
      // Buscar cliente existente por correo
      cliente = await prisma.cliente.findFirst({
        where: {
          businessId: businessId,
          correo: data.cliente.email
        }
      });
      
      if (!cliente) {
        // Crear nuevo cliente
        cliente = await prisma.cliente.create({
          data: {
            businessId: businessId,
            cedula: `temp-${Date.now()}`, // Temporal hasta que tengamos el campo correcto
            nombre: data.cliente.nombre,
            telefono: data.cliente.telefono || '',
            correo: data.cliente.email,
            puntos: 0
          }
        });
      } else {
        // Actualizar cliente existente
        cliente = await prisma.cliente.update({
          where: { id: cliente.id },
          data: {
            nombre: data.cliente.nombre,
            telefono: data.cliente.telefono || ''
          }
        });
      }
    } else {
      // Cliente temporal sin email
      cliente = await prisma.cliente.create({
        data: {
          businessId: businessId,
          cedula: `temp-${Date.now()}`,
          nombre: data.cliente.nombre,
          telefono: data.cliente.telefono || '',
          correo: `temp-${Date.now()}@temp.com`,
          puntos: 0
        }
      });
    }

    // 2. Crear o buscar el servicio
    let service = await prisma.reservationService.findFirst({
      where: {
        businessId: businessId,
        name: data.promotor.nombre
      }
    });
    
    // Usar nullish coalescing operator para simplificar
    service ??= await prisma.reservationService.create({
      data: {
        businessId: businessId,
        name: data.promotor.nombre,
        description: 'Servicio de reserva',
        capacity: 100,
        duration: 240
      }
    });

    // 3. Crear slot de tiempo
    const fechaSlot = new Date(data.fecha);
    const [horasSlot, minutosSlot] = data.hora.split(':').map(Number);
    const startTime = new Date(fechaSlot);
    startTime.setHours(horasSlot, minutosSlot, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 4); // 4 horas de duración por defecto

    const slot = await prisma.reservationSlot.create({
      data: {
        businessId: businessId,
        serviceId: service.id,
        date: fechaSlot,
        startTime: startTime,
        endTime: endTime,
        capacity: data.numeroPersonas,
        reservedCount: data.numeroPersonas
      }
    });

    // 4. Crear la reserva
    const reservationNumber = `RES-${Date.now()}`;
    
    // Crear fecha/hora de reserva para reservedAt
    // Importante: Parsear correctamente la fecha en zona horaria local, no UTC
    const [horasReserva, minutosReserva] = data.hora.split(':').map(Number);
    
    // Parsear fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = data.fecha.split('-').map(Number);
    const reservedAtDate = new Date(year, month - 1, day, horasReserva, minutosReserva, 0, 0);
    
    console.log('📅 Fecha de reserva creada:', {
      fechaOriginal: data.fecha,
      horaOriginal: data.hora,
      reservedAtDate: reservedAtDate.toISOString(),
      reservedAtDateLocal: reservedAtDate.toString()
    });
    
    const reservation = await prisma.reservation.create({
      data: {
        businessId: businessId,
        clienteId: cliente.id,
        serviceId: service.id,
        slotId: slot.id,
        reservationNumber: reservationNumber,
        status: mapReservaStatusToPrisma(data.estado || 'Activa'),
        customerName: data.cliente.nombre,
        customerEmail: data.cliente.email || `temp-${Date.now()}@temp.com`,
        customerPhone: data.cliente.telefono,
        guestCount: data.numeroPersonas,
        specialRequests: data.razonVisita,
        notes: data.beneficiosReserva,
        reservedAt: reservedAtDate
      }
    });

    // 5. Crear código QR con expiración de 12 horas después de la hora de llegada de la reserva
    const qrToken = data.codigoQR || generateQRCode();
    
    // Calcular fecha de expiración: 12 horas después de la hora específica de la reserva
    const qrExpirationDate = new Date(reservedAtDate.getTime() + (12 * 60 * 60 * 1000)); // +12 horas desde la hora de llegada
    
    await prisma.reservationQRCode.create({
      data: {
        businessId: businessId,
        reservationId: reservation.id,
        qrToken: qrToken,
        qrData: JSON.stringify({
          reservationId: reservation.id,
          token: qrToken,
          timestamp: Date.now(),
          cliente: data.cliente.nombre,
          fecha: data.fecha,
          hora: data.hora
        }),
        expiresAt: qrExpirationDate,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Reserva creada exitosamente:', reservation.id);

    // Retornar la reserva creada
    const reservaCreada: Reserva = {
      id: reservation.id,
      cliente: {
        id: cliente.id,
        nombre: data.cliente.nombre,
        telefono: data.cliente.telefono,
        email: data.cliente.email
      },
      numeroPersonas: data.numeroPersonas,
      razonVisita: data.razonVisita,
      beneficiosReserva: data.beneficiosReserva,
      promotor: data.promotor,
      fecha: data.fecha,
      hora: data.hora,
      codigoQR: qrToken,
      asistenciaActual: 0,
      estado: data.estado,
      fechaCreacion: reservation.createdAt.toISOString(),
      fechaModificacion: reservation.updatedAt.toISOString(),
      registroEntradas: []
    };

    return NextResponse.json({ 
      success: true, 
      reserva: reservaCreada 
    });

  } catch (error) {
    console.error('Error creating reserva:', error);
    
    // Obtener mensaje de error más específico
    let errorMessage = 'Error al crear la reserva';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
