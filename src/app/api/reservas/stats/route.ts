import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DashboardStats, EstadoReserva } from '@/app/reservas/types/reservation';

// Configurar como ruta dinámica para evitar errores de prerendimiento
export const dynamic = 'force-dynamic';

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
    const year = Number.parseInt(parts.find(p => p.type === 'year')?.value || '2025');
    const month = Number.parseInt(parts.find(p => p.type === 'month')?.value || '1');
    const day = Number.parseInt(parts.find(p => p.type === 'day')?.value || '1');
    const hour = Number.parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    
    const currentDate = new Date(year, month - 1, day);
    
    // Si es antes de las 4 AM, usar el día anterior (día de negocio continúa)
    if (hour < 4) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Formatear como YYYY-MM-DD
    const fechaCalculada = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    console.log('🌍 [BACKEND STATS] Fecha actual negocio calculada:', {
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

// GET /api/reservas/stats - Obtener estadísticas del dashboard
export async function GET(request: NextRequest) {
  try {
    // Para simplificar, vamos a obtener todas las reservas y calcular stats en memoria
    // Esto es consistente con el patrón del endpoint principal
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json({ error: 'BusinessId es requerido' }, { status: 400 });
    }

    // Obtener todas las reservas del negocio (usando el mismo patrón que el endpoint principal)
    const reservations = await prisma.reservation.findMany({
      where: { businessId },
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
      orderBy: { createdAt: 'desc' }
    });

    // Transformar a nuestro formato y calcular estadísticas
    const today = getFechaActualNegocio(); // 🌍 Usar fecha de negocio con corte 4 AM
    let reservasHoy = 0;
    let totalAsistentes = 0;
    let totalReservados = 0;

    for (const reservation of reservations) {
      // Procesar fecha (misma lógica que el endpoint principal)
      let fecha = new Date().toISOString().split('T')[0];
      if (reservation.reservedAt) {
        try {
          fecha = reservation.reservedAt.toISOString().split('T')[0];
        } catch {
          if (reservation.ReservationSlot?.date) {
            try {
              fecha = new Date(reservation.ReservationSlot.date).toISOString().split('T')[0];
            } catch {
              // usar fecha por defecto
            }
          }
        }
      } else if (reservation.ReservationSlot?.date) {
        try {
          fecha = new Date(reservation.ReservationSlot.date).toISOString().split('T')[0];
        } catch {
          // usar fecha por defecto
        }
      }

      // Contar reservas de hoy
      if (fecha === today) {
        reservasHoy++;
      }

      // Mapear estado de Prisma a nuestro tipo
      const estado = mapPrismaStatusToReserva(reservation.status);
      
      // Contar asistentes y reservados
      const asistenciaActual = reservation.ReservationQRCode?.reduce((sum: number, qr: any) => sum + (qr.scanCount || 0), 0) || 0;
      totalAsistentes += asistenciaActual;

      if (estado === 'Activa' || estado === 'En Camino') {
        totalReservados += reservation.guestCount || 0;
      }
    }

    const promedioAsistencia = totalReservados > 0 ? (totalAsistentes / totalReservados) * 100 : 0;
    
    const stats: DashboardStats = {
      totalReservas: reservations.length,
      totalAsistentes,
      promedioAsistencia: Math.round(promedioAsistencia),
      reservasHoy
    };

    console.log('📊 [BACKEND STATS] Estadísticas calculadas:', {
      totalReservas: stats.totalReservas,
      reservasHoy: stats.reservasHoy,
      fechaHoy: today,
      totalAsistentes: stats.totalAsistentes
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ Error en stats endpoint:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
