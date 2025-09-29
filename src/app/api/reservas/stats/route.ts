import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { DashboardStats } from '@/types/reservas';

// GET /api/reservas/stats - Obtener estadísticas del dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const today = new Date().toISOString().split('T')[0];

    // Obtener estadísticas básicas
    const [
      totalReservas,
      reservasHoy,
      reservasEnProgreso,
      reservasCompletadas,
      totalAsistencia
    ] = await Promise.all([
      // Total de reservas
      prisma.reservation.count({
        where: { businessId }
      }),
      
      // Reservas de hoy
      prisma.reservation.count({
        where: {
          businessId,
          slot: {
            date: {
              gte: new Date(today),
              lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
            }
          }
        }
      }),
      
      // Reservas en progreso
      prisma.reservation.count({
        where: {
          businessId,
          status: 'CHECKED_IN'
        }
      }),
      
      // Reservas completadas
      prisma.reservation.count({
        where: {
          businessId,
          status: 'COMPLETED'
        }
      }),
      
      // Total de asistencia (suma de scanCount de QRs)
      prisma.reservationQRCode.aggregate({
        where: {
          businessId,
          reservation: {
            businessId
          }
        },
        _sum: {
          scanCount: true
        }
      })
    ]);

    const totalAsistentes = totalAsistencia._sum.scanCount || 0;
    const promedioAsistencia = totalReservas > 0 ? totalAsistentes / totalReservas : 0;

    const stats: DashboardStats = {
      totalReservas,
      totalAsistentes,
      promedioAsistencia: Math.round(promedioAsistencia * 10) / 10,
      reservasHoy,
      reservasEnProgreso,
      reservasCompletadas
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
