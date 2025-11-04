import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { Reserva, EstadoReserva } from '../../reservas/types/reservation';
import crypto from 'node:crypto';
import { emitReservationEvent } from './events/route';
import { Temporal } from '@js-temporal/polyfill';

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
    case 'CANCELLED': return 'Cancelado';        // ✅ Cliente canceló con aviso
    case 'NO_SHOW': return 'Reserva Caída';      // ❌ Cliente no se presentó / excedió tiempo
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
    // Obtener fecha/hora actual en timezone de Ecuador usando Temporal
    const now = Temporal.Now.zonedDateTimeISO('America/Guayaquil');
    
    // Si es antes de las 4 AM, usar el día anterior (día de negocio continúa)
    let fechaNegocio;
    if (now.hour < 4) {
      fechaNegocio = now.subtract({ days: 1 });
    } else {
      fechaNegocio = now;
    }
    
    // Formatear como YYYY-MM-DD
    const fechaCalculada = fechaNegocio.toPlainDate().toString();
    
    console.log('🌍 [BACKEND] Fecha actual negocio calculada:', {
      fechaEcuador: now.toPlainDate().toString(),
      horaEcuador: now.hour,
      esAntesDe4AM: now.hour < 4,
      fechaFinal: fechaCalculada,
      explicacionTemporal: 'Usando Temporal API para manejo consistente de timezone'
    });
    
    return fechaCalculada;
  } catch (error) {
    console.error('❌ Error calculando fecha negocio:', error);
    // Fallback usando Temporal Instant (UTC)
    const fallback = Temporal.Now.instant().toString().split('T')[0];
    console.warn('⚠️ Usando fallback UTC:', fallback);
    return fallback;
  }
}

// 🔥 OPTIMIZACIÓN: Función para calcular estadísticas del mes actual en memoria
// Usa la FECHA DE RESERVA (reservedAt) igual que la tabla de reservas
async function calculateStats(reservationsRaw: any[], businessId: string) {
  const hoy = getFechaActualNegocio();
  
  // Obtener mes y año actual (Ecuador timezone)
  const now = Temporal.Now.zonedDateTimeISO('America/Guayaquil');
  const mesActual = now.month; // 1-12
  const añoActual = now.year;
  
  // Rango del mes actual
  const fechaInicio = new Date(Date.UTC(añoActual, mesActual - 1, 1, 0, 0, 0, 0));
  const fechaFin = new Date(Date.UTC(añoActual, mesActual, 1, 0, 0, 0, 0));
  // Crear fecha límite: final del día de hoy en UTC
  const [añoHoy, mesHoy, diaHoy] = hoy.split('-').map(Number);
  const hoyDate = new Date(Date.UTC(añoHoy, mesHoy - 1, diaHoy, 23, 59, 59, 999));
  
  // Filtrar TODAS las reservas del mes (incluye futuras)
  const todasReservasDelMes = reservationsRaw.filter(r => {
    if (!r.reservedAt) return false;
    const fechaReserva = new Date(r.reservedAt);
    return fechaReserva >= fechaInicio && fechaReserva < fechaFin;
  });
  
  // Filtrar solo reservas hasta hoy para contar asistentes
  const reservasHastaHoy = todasReservasDelMes.filter(r => {
    const fechaReserva = new Date(r.reservedAt);
    return fechaReserva <= hoyDate;
  });
  
  // Contar reservas de hoy (por fecha de reserva)
  const reservasHoy = todasReservasDelMes.filter(r => {
    if (!r.reservedAt) return false;
    const fechaReserva = new Date(r.reservedAt).toISOString().split('T')[0];
    return fechaReserva === hoy;
  }).length;
  
  // Consultar sin reserva del mes
  const sinReservas = await prisma.sinReserva.findMany({
    where: {
      businessId,
      fecha: { gte: fechaInicio, lt: fechaFin },
    },
  });
  
  // Calcular totales usando HostTracking.guestCount (personas reales que asistieron)
  const totalAsistentesConReserva = reservasHastaHoy.reduce((acc, r) => {
    // HostTracking.guestCount = número REAL de personas que asistieron
    // NO confundir con scanCount (número de escaneos del QR)
    const asistentesReales = r.HostTracking?.guestCount || 0;
    return acc + asistentesReales;
  }, 0);
  const totalPersonasSinReserva = sinReservas.reduce((sum, sr) => sum + sr.numeroPersonas, 0);
  
  console.log('📊 [CALCULATE STATS]', {
    mes: mesActual,
    hoy,
    totalReservasMes: todasReservasDelMes.length,
    reservasHastaHoy: reservasHastaHoy.length,
    totalAsistentes: totalAsistentesConReserva,
    totalSinReserva: totalPersonasSinReserva,
    reservasHoy,
    primerasReservas: reservasHastaHoy.slice(0, 10).map(r => ({
      fecha: new Date(r.reservedAt).toISOString().split('T')[0],
      cliente: r.customerName,
      asistieron: r.HostTracking?.guestCount || 0,
      escaneos: r.ReservationQRCode?.[0]?.scanCount || 0
    }))
  });
  
  return {
    totalReservas: todasReservasDelMes.length, // TODAS las reservas del mes
    totalAsistentes: totalAsistentesConReserva, // Solo asistentes hasta hoy (HostTracking.guestCount)
    totalSinReserva: totalPersonasSinReserva,
    reservasHoy
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
          },
          HostTracking: {
            select: {
              guestCount: true,
              reservationDate: true
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
          ReservationQRCode: true,
          HostTracking: {
            select: {
              guestCount: true,
              reservationDate: true
            }
          }
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
        stats: await calculateStats(reservations, business?.id || businessIdOrSlug)
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

    // 3. Crear slot de tiempo usando timezone-utils para consistencia
    const { calcularFechasReserva } = await import('@/lib/timezone-utils');
    
    let slot;
    try {
      const { fechaReserva } = calcularFechasReserva(data.fecha, data.hora);
      
      // Calcular startTime y endTime
      const startTime = fechaReserva;
      const endTime = new Date(fechaReserva);
      endTime.setHours(endTime.getHours() + 4); // 4 horas de duración por defecto
      
      // Para el campo date, extraer solo la fecha
      const fechaSlot = new Date(fechaReserva);
      fechaSlot.setHours(0, 0, 0, 0);
      
      console.log('📅 Fechas calculadas para slot:', {
        fechaOriginal: data.fecha,
        horaOriginal: data.hora,
        fechaReserva: fechaReserva.toISOString(),
        fechaSlot: fechaSlot.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      const slotNow = new Date();
      slot = await prisma.reservationSlot.create({
        data: {
          id: generateId(),
          businessId: businessId,
          serviceId: service.id,
          date: fechaSlot,
          startTime: startTime,
          endTime: endTime,
          capacity: data.numeroPersonas,
          reservedCount: data.numeroPersonas,
          updatedAt: slotNow
        }
      });
    } catch (error) {
      console.error('❌ Error creando slot:', error);
      throw new Error(`Error al procesar fechas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

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
    
    // Reutilizar la misma lógica de calcularFechasReserva que usamos para el slot
    const { fechaReserva: reservedAtDate } = calcularFechasReserva(data.fecha, data.hora);
    const { formatearHoraMilitar } = await import('@/lib/timezone-utils');
    
    // Extraer hora correcta para mostrar en frontend
    const horaCorrecta = formatearHoraMilitar(reservedAtDate);

    console.log('📅 Fecha de reserva creada:', {
      fechaOriginal: data.fecha,
      horaOriginal: data.hora,
      reservedAtDate: reservedAtDate.toISOString(),
      horaCorrecta,
      timezone: 'America/Guayaquil'
    });
    
    const reservationNow = new Date();
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
        updatedAt: reservationNow
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

    // 6. Crear código QR con Temporal API
    const qrToken = data.codigoQR || generateQRCode();
    
    // Calcular fecha de expiración del QR (+12 horas desde la hora de reserva)
    const qrExpirationDate = new Date(reservedAtDate);
    qrExpirationDate.setHours(qrExpirationDate.getHours() + 12);
    
    console.log('🎫 CREANDO QR CODE:', {
      reservaId: reservation.id,
      fechaOriginalInput: `${data.fecha} ${data.hora}`,
      reservedAt: reservedAtDate.toISOString(),
      qrExpiresAt: qrExpirationDate.toISOString(),
      duracionValidez: '12 horas',
      timezone: 'America/Guayaquil'
    });
    
    const qrNow = new Date();
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
        updatedAt: qrNow
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
