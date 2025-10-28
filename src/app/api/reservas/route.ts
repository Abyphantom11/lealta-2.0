import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { Reserva, EstadoReserva } from '../../reservas/types/reservation';
import crypto from 'node:crypto';
import { emitReservationEvent } from './events/route';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

// Función para generar código QR único
function generateQRCode(): string {
  return `QR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// Función para generar ID único
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Función para generar número de reserva único
// Función para mapear estado de Prisma a nuestro tipo
function mapPrismaStatusToReserva(status: string): EstadoReserva {
  switch (status) {
    case 'PENDING': return 'En Progreso';        // Reserva confirmada, esperando llegada
    case 'CONFIRMED': return 'Activa';           // Usado para reservas manuales
    case 'CHECKED_IN': return 'Activa';          // ✅ Cliente llegó (primer escaneo QR)
    case 'COMPLETED': return 'En Camino';        // Reserva finalizada
    case 'CANCELLED': return 'Reserva Caída';    // Cancelada
    case 'NO_SHOW': return 'Reserva Caída';      // Cliente no se presentó
    default: return 'En Progreso';
  }
}

// Función para mapear nuestro estado a Prisma
function mapReservaStatusToPrisma(estado: EstadoReserva): 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' {
  switch (estado) {
    case 'En Progreso': return 'PENDING';      // Estado inicial al crear reserva
    case 'Activa': return 'CONFIRMED';         // Reserva manual confirmada
    case 'En Camino': return 'COMPLETED';      // Finalizada
    case 'Reserva Caída': return 'CANCELLED';  // Cancelada
    case 'Cancelado': return 'CANCELLED';      // Cancelada manualmente
    default: return 'PENDING';
  }
}

// 🌍 UTILIDAD: Obtener fecha actual del negocio (con corte 4 AM Ecuador)
function getFechaActualNegocio(): string {
  try {
    const now = new Date();
    
    // Obtener componentes de fecha/hora en Ecuador
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Guayaquil',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '2025');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    
    const currentDate = new Date(year, month - 1, day);
    
    // Si es antes de las 4 AM, usar el día anterior (día de negocio continúa)
    if (hour < 4) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Formatear como YYYY-MM-DD
    const fechaCalculada = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    console.log('🌍 [BACKEND] Fecha actual negocio calculada:', {
      fechaEcuador: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      horaEcuador: hour,
      esAntesDe4AM: hour < 4,
      fechaFinal: fechaCalculada
    });
    
    return fechaCalculada;
  } catch (error) {
    console.error('❌ Error calculando fecha negocio:', error);
    // Fallback a fecha UTC simple
    return new Date().toISOString().split('T')[0];
  }
}

// 🔥 OPTIMIZACIÓN: Función para calcular estadísticas en memoria (evita query separada)
function calculateStats(reservas: Reserva[]) {
  const hoy = getFechaActualNegocio(); // 🌍 Usar fecha de negocio con corte 4 AM
  const reservasHoy = reservas.filter(r => r.fecha === hoy);
  
  // Calcular totales
  const totalAsistentes = reservas.reduce((acc, r) => acc + (r.asistenciaActual || 0), 0);
  const reservasCompletadas = reservas.filter(r => r.estado === 'Activa' || r.estado === 'En Camino');
  const totalReservados = reservasCompletadas.reduce((acc, r) => acc + r.numeroPersonas, 0);
  const promedioAsistencia = totalReservados > 0 ? (totalAsistentes / totalReservados) * 100 : 0;
  
  return {
    totalReservas: reservas.length,
    totalAsistentes,
    promedioAsistencia: Math.round(promedioAsistencia),
    reservasHoy: reservasHoy.length
  };
}

// 🔥 OPTIMIZACIÓN: Función para extraer clientes únicos (evita query separada)
function extractUniqueClients(reservas: Reserva[]) {
  const clientesMap = new Map();
  
  for (const reserva of reservas) {
    if (reserva.cliente?.id) {
      clientesMap.set(reserva.cliente.id, {
        id: reserva.cliente.id,
        nombre: reserva.cliente.nombre,
        telefono: reserva.cliente.telefono,
        email: reserva.cliente.email,
        totalReservas: (clientesMap.get(reserva.cliente.id)?.totalReservas || 0) + 1,
        ultimaReserva: reserva.fecha
      });
    }
  }
  
  return Array.from(clientesMap.values());
}

// GET - Obtener todas las reservas + datos adicionales opcionales
export async function GET(request: NextRequest) {
  // ✅ IMPORTAR UTILIDADES DE TIMEZONE AL INICIO
  const { formatearHoraMilitar } = await import('@/lib/timezone-utils');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessIdOrSlug = searchParams.get('businessId') || 'default-business-id';
    
    // 🔥 OPTIMIZACIÓN: Parámetros para combinar múltiples endpoints
    const includeStats = searchParams.get('include')?.includes('stats') || false;
    const includeClients = searchParams.get('include')?.includes('clients') || false;
    
    console.log('📥 GET /api/reservas - businessId:', businessIdOrSlug, 'include:', { stats: includeStats, clients: includeClients });
    
    // Intentar buscar el business por ID o por slug
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
      console.log('⚠️ Error buscando business, intentando solo por slug');
      business = await prisma.business.findUnique({
        where: { slug: businessIdOrSlug }
      });
    }
    
    if (!business) {
      console.error('❌ Business no encontrado:', businessIdOrSlug);
      return NextResponse.json(
        { error: 'Business no encontrado' },
        { status: 404 }
      );
    }
    
    console.log('✅ Business encontrado:', business.name, '(ID:', business.id + ')');
    
    // Obtener parámetros de filtro opcionales
    const cedula = searchParams.get('cedula');
    const statusFilter = searchParams.get('status');
    
    // Construir filtros dinámicos
    const whereClause: any = {
      businessId: business.id
    };
    
    // Filtrar por cédula si se proporciona
    if (cedula) {
      whereClause.customerPhone = cedula; // Asumimos que la cédula está en customerPhone
    }
    
    // Filtrar por status si se proporciona (puede ser múltiple: "CONFIRMED,SEATED")
    if (statusFilter) {
      const statuses = statusFilter.split(',');
      whereClause.status = {
        in: statuses
      };
    }
    
    console.log('🔍 Filtros aplicados:', whereClause);
    
    // Buscar reservas en la base de datos usando el ID real
    let reservations;
    try {
      reservations = await prisma.reservation.findMany({
        where: whereClause,
        include: {
          Cliente: true,
          ReservationService: true,
          ReservationSlot: true,
          ReservationQRCode: true,
          Promotor: {
            select: {
              id: true,
              nombre: true,
              telefono: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc' // ✅ Ordenar por orden de creación (más antiguas primero)
        }
      });
    } catch (includeError) {
      console.error('❌ Error con includes, intentando sin promotor:', includeError);
      // Intentar sin el include del promotor
      reservations = await prisma.reservation.findMany({
        where: whereClause,
        include: {
          Cliente: true,
          ReservationService: true,
          ReservationSlot: true,
          ReservationQRCode: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
    }
    
    console.log(`✅ ${reservations.length} reservas encontradas`);

    // Mapear a nuestro formato de Reserva
    const reservas: Reserva[] = reservations.map(reservation => {
      try {
        const metadata = (reservation.metadata as any) || {};
        
        // Extraer nombre del promotor de forma segura
        const promotorNombre = (reservation as any).Promotor?.nombre || 
                              reservation.ReservationService?.name || 
                              'Sistema';
        
        // Procesar fecha de forma segura - USAR reservedAt como fuente principal
        let fecha = new Date().toISOString().split('T')[0];
        if (reservation.reservedAt) {
          try {
            // 🎯 USAR reservedAt que es la fecha actualizada
            fecha = reservation.reservedAt.toISOString().split('T')[0];
          } catch (e) {
            console.warn('⚠️ Error parseando fecha de reservedAt:', e);
            // Fallback a ReservationSlot.date solo si reservedAt falla
            if (reservation.ReservationSlot?.date) {
              try {
                fecha = new Date(reservation.ReservationSlot.date).toISOString().split('T')[0];
              } catch (error_) {
                console.warn('⚠️ Error parseando fecha del slot también:', error_);
              }
            }
          }
        } else if (reservation.ReservationSlot?.date) {
          try {
            fecha = new Date(reservation.ReservationSlot.date).toISOString().split('T')[0];
          } catch (e) {
            console.warn('⚠️ Error parseando fecha del slot:', e);
          }
        }
        
        // Procesar hora de forma segura - USAR reservedAt con timezone correcto
        let hora = '19:00';
        if (reservation.reservedAt) {
          try {
            // ✅ USAR NUESTRA FUNCIÓN DE FORMATO MILITAR para consistencia
            hora = formatearHoraMilitar(reservation.reservedAt);
          } catch (e) {
            console.warn('⚠️ Error parseando hora de reservedAt:', e);
            // Fallback a ReservationSlot.startTime solo si reservedAt falla
            if (reservation.ReservationSlot?.startTime) {
              try {
                hora = formatearHoraMilitar(new Date(reservation.ReservationSlot.startTime));
              } catch (error_) {
                console.warn('⚠️ Error parseando hora del slot también:', error_);
              }
            }
          }
        } else if (reservation.ReservationSlot?.startTime) {
          try {
            hora = new Date(reservation.ReservationSlot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          } catch (e) {
            console.warn('⚠️ Error parseando hora del slot:', e);
          }
        }
        
        return {
          id: reservation.id,
          cliente: {
            id: reservation.Cliente?.id || `temp-${Date.now()}`,
            // 🔄 PRIORIDAD: usar customerName (nombre específico de esta reserva) antes que Cliente.nombre
            nombre: reservation.customerName || reservation.Cliente?.nombre || 'Sin nombre',
            telefono: reservation.customerPhone || reservation.Cliente?.telefono || undefined,
            email: reservation.customerEmail || reservation.Cliente?.correo || undefined
          },
          numeroPersonas: reservation.guestCount || 1,
          razonVisita: reservation.specialRequests || 'Reserva general',
          beneficiosReserva: reservation.notes || 'Sin beneficios especiales',
          promotor: {
            id: reservation.promotorId || reservation.serviceId,
            nombre: promotorNombre
          },
          promotorId: reservation.promotorId || undefined,
          fecha,
          hora,
          codigoQR: `res-${reservation.id}`,
          asistenciaActual: reservation.ReservationQRCode?.[0]?.scanCount || 0,
          estado: mapPrismaStatusToReserva(reservation.status),
          fechaCreacion: reservation.createdAt?.toISOString() || new Date().toISOString(),
          fechaModificacion: reservation.updatedAt?.toISOString() || new Date().toISOString(),
          mesa: metadata.mesa || '',
          detalles: metadata.detalles || [],
          comprobanteSubido: !!metadata.comprobanteUrl,
          comprobanteUrl: metadata.comprobanteUrl || undefined,
          registroEntradas: []
        };
      } catch (mapError) {
        console.error('❌ Error mapeando reserva:', reservation.id, mapError);
        // Retornar una reserva mínima en caso de error
        return {
          id: reservation.id,
          cliente: {
            id: `temp-${Date.now()}`,
            nombre: reservation.customerName || 'Error al cargar',
            telefono: undefined,
            email: undefined
          },
          numeroPersonas: reservation.guestCount || 1,
          razonVisita: 'Error al cargar',
          beneficiosReserva: 'Error al cargar',
          promotor: {
            id: reservation.serviceId,
            nombre: 'Sistema'
          },
          promotorId: undefined,
          fecha: new Date().toISOString().split('T')[0],
          hora: '19:00',
          codigoQR: `res-${reservation.id}`,
          asistenciaActual: 0,
          estado: 'En Progreso' as EstadoReserva,
          fechaCreacion: new Date().toISOString(),
          fechaModificacion: new Date().toISOString(),
          mesa: '',
          detalles: [],
          comprobanteSubido: false,
          comprobanteUrl: undefined,
          registroEntradas: []
        };
      }
    });

    return NextResponse.json({ 
      success: true, 
      reservas,
      // 🔥 OPTIMIZACIÓN: Incluir stats en la misma respuesta si se solicita
      ...(includeStats && {
        stats: calculateStats(reservas)
      }),
      // 🔥 OPTIMIZACIÓN: Incluir datos de clientes únicos si se solicita
      ...(includeClients && {
        clients: extractUniqueClients(reservas)
      })
    });

  } catch (error) {
    console.error('❌❌❌ Error fetching reservas:', error);
    console.error('Error name:', (error as any)?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error stack:', (error as any)?.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: (error as any)?.message || 'Error desconocido'
      },
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
    const businessIdOrSlug = searchParams.get('businessId') || 'default-business-id';
    
    console.log('📥 POST /api/reservas - businessId recibido:', businessIdOrSlug);

    // Intentar buscar el business por ID o por slug
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
      console.log('⚠️ Error buscando business, intentando solo por slug');
      business = await prisma.business.findUnique({
        where: { slug: businessIdOrSlug }
      });
    }

    if (!business) {
      console.error('❌ Business no encontrado:', businessIdOrSlug);
      return NextResponse.json(
        { error: 'Business no encontrado' },
        { status: 404 }
      );
    }
    
    console.log('✅ Business encontrado:', business.name, '(ID:', business.id + ')');
    const businessId = business.id;

    // Validaciones básicas
    if (!data.cliente?.nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre del cliente es obligatorio' },
        { status: 400 }
      );
    }

    // ✅ Email es OPCIONAL - solo validar formato si se proporciona
    const isExpressReservation = data.cliente?.id === 'EXPRESS';
    
    if (!isExpressReservation) {
      // ✅ Validar formato de email SOLO si se proporciona
      if (data.cliente?.email && data.cliente.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.cliente.email)) {
          return NextResponse.json(
            { success: false, error: 'El email del cliente no tiene un formato válido' },
            { status: 400 }
          );
        }
      }

      // ✅ Validar teléfono obligatorio
      if (!data.cliente?.telefono || data.cliente.telefono.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'El teléfono del cliente es obligatorio' },
          { status: 400 }
        );
      }

      // ✅ Validar que teléfono tenga al menos 8 dígitos
      // NOSONAR - replaceAll no disponible en esta versión de TypeScript
      const digitosEnTelefono = data.cliente.telefono.replace(/\D/g, '').length;
      if (digitosEnTelefono < 8) {
        return NextResponse.json(
          { success: false, error: 'El teléfono debe tener al menos 8 dígitos' },
          { status: 400 }
        );
      }
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
    
    // ✅ Manejar cliente EXPRESS (reservas rápidas)
    if (isExpressReservation) {
      // Buscar o crear cliente EXPRESS único para este business
      cliente = await prisma.cliente.findFirst({
        where: {
          businessId: businessId,
          cedula: 'EXPRESS'
        }
      });
      
      if (cliente === null) {
        const now = new Date();
        cliente = await prisma.cliente.create({
          data: {
            id: generateId(),
            businessId: businessId,
            cedula: 'EXPRESS',
            nombre: 'Cliente Express',
            telefono: 'N/A',
            correo: 'express@reserva.local',
            puntos: 0,
            registeredAt: now
          }
        });
        console.log('✅ Cliente EXPRESS creado para business:', businessId);
      } else {
        console.log('✅ Usando cliente EXPRESS existente:', cliente.id);
      }
    } else {
      // ✅ MEJORADO: Buscar cliente por múltiples criterios para evitar duplicados
      // Prioridad: 1) Email, 2) Cédula, 3) Teléfono
      if (data.cliente.email) {
        // Buscar por email primero
        cliente = await prisma.cliente.findFirst({
          where: {
            businessId: businessId,
            correo: data.cliente.email
          }
        });
      }
    
      // Si no se encontró por email y hay cédula, buscar por cédula
      if (!cliente && data.cliente.id && data.cliente.id !== `c-${Date.now()}`) {
        cliente = await prisma.cliente.findFirst({
          where: {
            businessId: businessId,
            cedula: data.cliente.id
          }
        });
      }
      
      // Si no se encontró y hay teléfono, buscar por teléfono (última opción)
      if (!cliente && data.cliente.telefono) {
        cliente = await prisma.cliente.findFirst({
          where: {
            businessId: businessId,
            telefono: data.cliente.telefono
          }
        });
      }
      
      if (cliente === null) {
        // ✅ MEJORADO: Crear nuevo cliente usando cédula real si está disponible
        const cedulaReal = data.cliente.id && data.cliente.id !== `c-${Date.now()}` 
          ? data.cliente.id 
          : `temp-${Date.now()}`;
        
        const now = new Date();
        cliente = await prisma.cliente.create({
          data: {
            id: generateId(),
            businessId: businessId,
            cedula: cedulaReal, // ✅ Usar cédula real del formulario
            nombre: data.cliente.nombre,
            telefono: data.cliente.telefono || '',
            correo: data.cliente.email || 'noemail@reserva.local',
            puntos: 0,
            registeredAt: now
          }
        });
        console.log('✅ Cliente nuevo creado:', { id: cliente.id, cedula: cedulaReal, nombre: cliente.nombre });
      } else if (cliente) {
        // ✅ Cliente existente encontrado - NO actualizamos el nombre para preservar reservas anteriores
        // Solo actualizamos datos de contacto si mejoramos la información
        const clienteActual = cliente;
        
        const shouldUpdateEmail = data.cliente.email && 
                                  data.cliente.email !== clienteActual.correo && 
                                  !clienteActual.correo.includes('temp-') &&
                                  clienteActual.correo !== 'noemail@reserva.local';
        
        const shouldUpdatePhone = data.cliente.telefono && 
                                  data.cliente.telefono !== clienteActual.telefono;
        
        const shouldUpdateCedula = data.cliente.id && 
                                   data.cliente.id !== `c-${Date.now()}` && 
                                   clienteActual.cedula.startsWith('temp-');
        
        // Solo actualizar si hay datos nuevos que agregar
        if (shouldUpdateEmail || shouldUpdatePhone || shouldUpdateCedula) {
          cliente = await prisma.cliente.update({
            where: { id: clienteActual.id },
            data: {
              // NO actualizamos nombre para preservar reservas anteriores
              ...(shouldUpdatePhone && { telefono: data.cliente.telefono }),
              ...(shouldUpdateEmail && { correo: data.cliente.email }),
              ...(shouldUpdateCedula && { cedula: data.cliente.id })
            }
          });
          console.log('✅ Cliente existente actualizado (solo contacto):', { 
            id: cliente.id, 
            nombre: cliente.nombre,
            emailActualizado: shouldUpdateEmail,
            telefonoActualizado: shouldUpdatePhone
          });
        } else {
          console.log('✅ Usando cliente existente sin cambios:', { id: cliente.id, nombre: cliente.nombre });
        }
      }
    }

    // Verificar que cliente fue creado/encontrado
    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'No se pudo crear o encontrar el cliente' },
        { status: 500 }
      );
    }

    // 2. Crear o buscar el servicio
    let service = await prisma.reservationService.findFirst({
      where: {
        businessId: businessId,
        name: data.promotor.nombre
      }
    });
    
    // Usar nullish coalescing operator para simplificar
    if (!service) {
      const now = new Date();
      service = await prisma.reservationService.create({
        data: {
          id: generateId(),
          businessId: businessId,
          name: data.promotor.nombre,
          description: 'Servicio de reserva',
          capacity: 100,
          duration: 240,
          updatedAt: now
        }
      });
    }

    // 3. Crear slot de tiempo
    const fechaSlot = new Date(data.fecha);
    const [horasSlot, minutosSlot] = data.hora.split(':').map(Number);
    const startTime = new Date(fechaSlot);
    startTime.setHours(horasSlot, minutosSlot, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 4); // 4 horas de duración por defecto

    const now = new Date();
    const slot = await prisma.reservationSlot.create({
      data: {
        id: generateId(),
        businessId: businessId,
        serviceId: service.id,
        date: fechaSlot,
        startTime: startTime,
        endTime: endTime,
        capacity: data.numeroPersonas,
        reservedCount: data.numeroPersonas,
        updatedAt: now
      }
    });

    // 4. Verificar/validar promotor si se proporciona
    let promotorId: string | null = null;
    console.log('🔍 Datos del promotor recibidos:', {
      promotorData: data.promotor,
      promotorId: data.promotor?.id,
      promotorNombre: data.promotor?.nombre,
      dataPromotorId: data.promotorId
    });
    
    if (data.promotor?.id || data.promotorId) {
      const idToCheck = data.promotor?.id || data.promotorId;
      console.log('🔍 Buscando promotor con ID:', idToCheck);
      
      const promotorExists = await prisma.promotor.findUnique({
        where: { id: idToCheck }
      });
      
      if (promotorExists === null) {
        console.error('❌ Promotor ID proporcionado NO existe en DB:', idToCheck);
        console.error('❌ Nombre del promotor recibido:', data.promotor?.nombre);
        console.error('❌ BusinessId:', businessId);
        
        // 🔍 Buscar promotores disponibles para este business
        const promotoresDisponibles = await prisma.promotor.findMany({
          where: { businessId: businessId, activo: true },
          select: { id: true, nombre: true }
        });
        console.log('📋 Promotores disponibles para este business:', promotoresDisponibles);
        
        // ✅ NUEVO: Si hay promotores disponibles, asignar el primero automáticamente
        if (promotoresDisponibles.length > 0) {
          promotorId = promotoresDisponibles[0].id;
          console.log('⚠️ Asignando primer promotor disponible:', promotoresDisponibles[0].nombre);
        } else {
          console.error('❌ No hay promotores disponibles para este business');
        }
      } else {
        promotorId = idToCheck || null; // ✅ Convertir undefined a null para TypeScript
        console.log('✅ Promotor encontrado y asignado:', promotorExists.nombre);
      }
    }
    
    // 5. Crear la reserva
    const reservationNumber = `RES-${Date.now()}`;
    
    // Crear fecha/hora de reserva para reservedAt
    // ✅ SOLUCIÓN DEFINITIVA: Usar utilidad robusta de timezone
    const { calcularFechasReserva, formatearHoraMilitar } = await import('@/lib/timezone-utils');
    
    const fechasCalculadas = calcularFechasReserva(data.fecha, data.hora);
    const reservedAtDate = fechasCalculadas.fechaReserva;
    
    // ✅ CORREGIR: Extraer hora correcta para mostrar en frontend
    const horaCorrecta = formatearHoraMilitar(reservedAtDate);
    
    // Validar que la fecha sea válida
    if (!fechasCalculadas.esValida) {
      console.warn('⚠️ Reserva creada en el pasado. Revisar si es intencional.');
    }

    console.log('📅 Fecha de reserva creada (MÉTODO DEFINITIVO):', {
      ...fechasCalculadas.debug,
      horaOriginal: data.hora,
      horaCorrecta: horaCorrecta
    });
    
    const nowReservation = new Date();
    const reservation = await prisma.reservation.create({
      data: {
        id: generateId(),
        businessId: businessId,
        clienteId: cliente.id,
        serviceId: service.id,
        slotId: slot.id,
        reservationNumber: reservationNumber,
        // ✅ Estado inicial: PENDING (esperando llegada del cliente)
        // Al primer escaneo del QR cambiará a CHECKED_IN automáticamente
        status: mapReservaStatusToPrisma(data.estado || 'En Progreso'),
        customerName: data.cliente.nombre,
        customerEmail: data.cliente.email || 'noemail@reserva.local',
        customerPhone: data.cliente.telefono,
        guestCount: data.numeroPersonas,
        specialRequests: data.razonVisita,
        notes: data.beneficiosReserva,
        reservedAt: reservedAtDate,
        promotorId: promotorId,
        updatedAt: nowReservation
      },
      include: {
        Promotor: {
          select: {
            id: true,
            nombre: true,
            telefono: true
          }
        }
      }
    });

    // 6. Crear código QR usando la utilidad definitiva
    const qrToken = data.codigoQR || generateQRCode();
    
    // ✅ USAR FECHA DE EXPIRACIÓN CALCULADA POR LA UTILIDAD ROBUSTA
    const qrExpirationDate = fechasCalculadas.fechaExpiracionQR;
    
    console.log('🎫 CREANDO QR CODE (MÉTODO DEFINITIVO):', {
      reservaId: reservation.id,
      fechaOriginalInput: `${data.fecha} ${data.hora}`,
      reservedAt: reservedAtDate.toISOString(),
      reservedAtEcuador: reservedAtDate.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }),
      qrExpiresAt: qrExpirationDate.toISOString(),
      qrExpiresAtEcuador: qrExpirationDate.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }),
      duracionValidez: '12 horas',
      metodo: 'timezone-utils.js (robusto)',
      garantiaDeCalidad: 'NO se puede desconfigurar'
    });
    
    const nowQR = new Date();
    await prisma.reservationQRCode.create({
      data: {
        id: generateId(),
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
        status: 'ACTIVE',
        updatedAt: nowQR
      }
    });

    console.log('✅ Reserva creada exitosamente:', reservation.id);

    // 🔥 EMITIR EVENTO SSE: Nueva reserva creada
    const businessIdNum = Number.parseInt(businessId);
    if (!Number.isNaN(businessIdNum)) {
      emitReservationEvent(businessIdNum, {
        type: 'reservation-created',
        reservationId: reservation.id,
        customerName: data.cliente.nombre,
        guestCount: data.numeroPersonas,
        reservedAt: reservedAtDate.toISOString(),
        status: reservation.status
      });
    }

    // 🏠 AUTO-ACTIVAR TRACKING DE ANFITRIÓN para reservas grandes
    const MIN_GUESTS_FOR_HOST_TRACKING = 4; // Umbral: 4+ invitados
    if (data.numeroPersonas >= MIN_GUESTS_FOR_HOST_TRACKING && !isExpressReservation) {
      try {
        const nowHost = new Date();
        await prisma.hostTracking.create({
          data: {
            id: generateId(),
            businessId: businessId,
            reservationId: reservation.id,
            clienteId: cliente.id,
            reservationName: data.cliente.nombre,
            tableNumber: data.mesa || null, // Si se proporciona mesa en el futuro
            reservationDate: reservedAtDate,
            guestCount: data.numeroPersonas,
            isActive: true,
            updatedAt: nowHost
          },
        });
        console.log(`🏠 [HOST TRACKING] Auto-activado para ${data.cliente.nombre} (${data.numeroPersonas} invitados)`);
      } catch (hostTrackingError) {
        // No bloquear la reserva si falla el tracking
        console.error('⚠️ [HOST TRACKING] Error al auto-activar:', hostTrackingError);
      }
    }

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
      // ✅ Devolver datos reales del promotor desde la DB
      promotor: (reservation as any).Promotor 
        ? { id: (reservation as any).Promotor.id, nombre: (reservation as any).Promotor.nombre }
        : { id: '', nombre: 'Sistema' },
      promotorId: reservation.promotorId || undefined, // ✅ Incluir el promotorId que se guardó en la DB
      fecha: data.fecha,
      hora: horaCorrecta, // ✅ USAR HORA CORREGIDA EN FORMATO MILITAR
      // ✅ CORREGIDO: Retornar formato correcto res-{id} en lugar del qrToken
      // El qrToken se guarda en la DB pero NO se usa para el QR visual
      codigoQR: `res-${reservation.id}`,
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
