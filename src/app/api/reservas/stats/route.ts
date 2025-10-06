import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthConfigs } from '@/middleware/requireAuth';
import { DashboardStats } from '@/types/reservas';

// GET /api/reservas/stats - Obtener estadísticas del dashboard
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const businessId = session.businessId;
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
  }, AuthConfigs.READ_ONLY);
}
