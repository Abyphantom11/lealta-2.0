/**
 * API para estadísticas de Promotores
 * GET /api/promotores/stats?businessId=xxx&mes=10&año=2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Forzar renderizado dinámico (no estático)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const mes = searchParams.get('mes');
    const año = searchParams.get('año');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Determinar rango de fechas
    let startDate: Date;
    let endDate: Date;

    if (mes && año) {
      const mesNum = parseInt(mes);
      const añoNum = parseInt(año);
      startDate = new Date(añoNum, mesNum - 1, 1);
      endDate = new Date(añoNum, mesNum, 0, 23, 59, 59, 999);
    } else {
      // Si no se especifica, usar mes actual
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Obtener todos los promotores activos
    const promotores = await prisma.promotor.findMany({
      where: {
        businessId,
        activo: true,
      },
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
        reservations: {
          where: {
            reservedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            status: true,
            guestCount: true,
            // Asumiendo que tienes un campo para tracking de asistencia
            // Si no existe, necesitarás ajustar esto
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    // Calcular estadísticas por promotor
    const promotoresConStats = promotores.map((promotor) => {
      const reservasDelMes = promotor.reservations;
      const totalReservas = reservasDelMes.length;
      
      // Contar reservas confirmadas/completadas
      const reservasConfirmadas = reservasDelMes.filter(
        (r) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN' || r.status === 'COMPLETED'
      ).length;

      // Contar no-shows
      const noShows = reservasDelMes.filter((r) => r.status === 'NO_SHOW').length;

      // Calcular tasa de asistencia
      const tasaAsistencia = totalReservas > 0 
        ? ((reservasConfirmadas / totalReservas) * 100).toFixed(1)
        : '0.0';

      return {
        id: promotor.id,
        nombre: promotor.nombre,
        telefono: promotor.telefono,
        email: promotor.email,
        totalReservas,
        totalAsistencias: reservasConfirmadas,
        totalNoAsistencias: noShows,
        tasaAsistencia: parseFloat(tasaAsistencia),
        totalReservasHistorico: promotor._count.reservations,
      };
    });

    // Ordenar por total de reservas del mes (descendente)
    const promotoresOrdenados = promotoresConStats.sort(
      (a, b) => b.totalReservas - a.totalReservas
    );

    // Calcular totales
    const totales = {
      totalPromotores: promotoresOrdenados.length,
      totalReservasDelMes: promotoresOrdenados.reduce(
        (sum, p) => sum + p.totalReservas,
        0
      ),
      totalAsistencias: promotoresOrdenados.reduce(
        (sum, p) => sum + p.totalAsistencias,
        0
      ),
      totalNoAsistencias: promotoresOrdenados.reduce(
        (sum, p) => sum + p.totalNoAsistencias,
        0
      ),
    };

    // Calcular promedio de asistencia general
    const promedioAsistencia =
      totales.totalReservasDelMes > 0
        ? ((totales.totalAsistencias / totales.totalReservasDelMes) * 100).toFixed(1)
        : '0.0';

    // Top 5 promotores
    const top5 = promotoresOrdenados.slice(0, 5).map((p, index) => ({
      ...p,
      ranking: index + 1,
    }));

    return NextResponse.json({
      success: true,
      periodo: {
        mes: mes ? parseInt(mes) : new Date().getMonth() + 1,
        año: año ? parseInt(año) : new Date().getFullYear(),
        inicio: startDate.toISOString(),
        fin: endDate.toISOString(),
      },
      promotores: promotoresOrdenados,
      top5,
      totales: {
        ...totales,
        promedioAsistencia: parseFloat(promedioAsistencia),
      },
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de promotores:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
