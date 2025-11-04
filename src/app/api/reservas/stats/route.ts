import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DashboardStats } from '@/app/reservas/types/reservation';
import { Temporal } from '@js-temporal/polyfill';

export const dynamic = 'force-dynamic';

function getFechaActualNegocio(): string {
  try {
    const now = Temporal.Now.zonedDateTimeISO('America/Guayaquil');
    let fechaNegocio;
    if (now.hour < 4) {
      fechaNegocio = now.subtract({ days: 1 });
    } else {
      fechaNegocio = now;
    }
    const fechaCalculada = fechaNegocio.toPlainDate().toString();
    console.log('�� [BACKEND STATS] Fecha actual negocio calculada:', {
      fechaEcuador: now.toPlainDate().toString(),
      horaEcuador: now.hour,
      esAntesDe4AM: now.hour < 4,
      fechaFinal: fechaCalculada
    });
    return fechaCalculada;
  } catch (error) {
    console.error('❌ Error calculando fecha negocio:', error);
    const fallback = Temporal.Now.instant().toString().split('T')[0];
    console.warn('⚠️ Usando fallback UTC:', fallback);
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json({ error: 'BusinessId es requerido' }, { status: 400 });
    }

    const now = Temporal.Now.zonedDateTimeISO('America/Guayaquil');
    const mes = now.month;
    const año = now.year;
    const hoy = getFechaActualNegocio();
    
    console.log('📊 [STATS API] Calculando estadísticas:', { mes, año, hoy, businessId });

    const fechaInicio = new Date(Date.UTC(año, mes - 1, 1, 0, 0, 0, 0));
    const fechaFin = new Date(Date.UTC(año, mes, 1, 0, 0, 0, 0));

    const reservations = await prisma.reservation.findMany({
      where: { businessId },
      include: {
        HostTracking: {
          select: {
            guestCount: true,
            reservationDate: true
          }
        }
      }
    });

    const reservasConAsistenciaDelMes = reservations.filter(r => {
      if (!r.HostTracking?.reservationDate) return false;
      const fechaAsistencia = r.HostTracking.reservationDate;
      return fechaAsistencia >= fechaInicio && fechaAsistencia < fechaFin;
    });

    console.log('✅ [STATS API] Total asistencias del mes:', reservasConAsistenciaDelMes.length);

    const sinReservas = await prisma.sinReserva.findMany({
      where: {
        businessId,
        fecha: { gte: fechaInicio, lt: fechaFin }
      }
    });

    console.log('✅ [STATS API] Total sin reserva del mes:', sinReservas.length);

    const totalReservas = reservasConAsistenciaDelMes.length;
    const totalAsistentes = reservasConAsistenciaDelMes.reduce((sum, r) => sum + (r.HostTracking?.guestCount || 0), 0);
    const totalSinReserva = sinReservas.reduce((sum, sr) => sum + sr.numeroPersonas, 0);

    const reservasHoy = reservasConAsistenciaDelMes.filter(r => {
      if (!r.HostTracking?.reservationDate) return false;
      const fechaAsistencia = r.HostTracking.reservationDate.toISOString().split('T')[0];
      return fechaAsistencia === hoy;
    }).length;

    const stats: DashboardStats = {
      totalReservas,
      totalAsistentes,
      totalSinReserva,
      reservasHoy
    };

    console.log('📈 [STATS API] RESULTADO:', {
      ...stats,
      detalleAsistencias: reservasConAsistenciaDelMes.map(r => ({
        fecha: r.HostTracking?.reservationDate.toISOString().split('T')[0],
        personas: r.HostTracking?.guestCount
      }))
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ [STATS API] Error:', error);
    return NextResponse.json({ error: 'Error al calcular estadísticas' }, { status: 500 });
  }
}
