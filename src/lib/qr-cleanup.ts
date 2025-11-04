/**
 * Sistema de Limpieza Automática de QR Codes
 * Elimina QR codes de reservas antiguas (más de 3 días)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CleanupStats {
  totalDeleted: number;
  oldestDate: Date | null;
  newestDate: Date | null;
  businesses: Record<string, number>;
}

/**
 * Elimina QR codes de reservas del mes anterior
 * IMPORTANTE: Se basa en la FECHA DE LA RESERVA, no en la fecha de creación del QR
 * Esto evita eliminar QRs de reservas futuras que fueron creadas hace tiempo
 * 
 * Ejemplo: Si estamos en noviembre, elimina QRs de octubre y anteriores
 */
export async function cleanupOldQRCodes(): Promise<CleanupStats> {
  // Calcular primer día del mes actual
  const hoy = new Date();
  const primerDiaMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  primerDiaMesActual.setHours(0, 0, 0, 0);

  console.log(`🗑️  Iniciando limpieza de QR codes de reservas anteriores a: ${primerDiaMesActual.toISOString()}`);
  console.log(`📅 Mes actual: ${hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`);

  try {
    // Obtener QRs cuyas RESERVAS son del mes anterior o anteriores
    const qrsToDelete = await prisma.reservationQRCode.findMany({
      where: {
        Reservation: {
          reservedAt: {
            lt: primerDiaMesActual
          }
        }
      },
      include: {
        Reservation: {
          select: {
            businessId: true,
            reservedAt: true,
            reservationNumber: true
          }
        }
      },
      orderBy: {
        Reservation: {
          reservedAt: 'asc'
        }
      }
    });

    if (qrsToDelete.length === 0) {
      console.log('✅ No hay QR codes antiguos para eliminar');
      return {
        totalDeleted: 0,
        oldestDate: null,
        newestDate: null,
        businesses: {}
      };
    }

    // Estadísticas por negocio
    const businessStats: Record<string, number> = {};
    qrsToDelete.forEach(qr => {
      const businessId = qr.Reservation.businessId;
      businessStats[businessId] = (businessStats[businessId] || 0) + 1;
    });

    const oldestDate = qrsToDelete[0].Reservation.reservedAt;
    const newestDate = qrsToDelete[qrsToDelete.length - 1].Reservation.reservedAt;

    console.log(`📊 Se eliminarán ${qrsToDelete.length} QR codes:`);
    console.log(`   Reserva más antigua: ${oldestDate.toISOString()}`);
    console.log(`   Reserva más reciente: ${newestDate.toISOString()}`);
    console.log(`   Negocios afectados: ${Object.keys(businessStats).length}`);

    // Eliminar los QR codes (basado en fecha de reserva del mes anterior)
    const deleteResult = await prisma.reservationQRCode.deleteMany({
      where: {
        Reservation: {
          reservedAt: {
            lt: primerDiaMesActual
          }
        }
      }
    });

    console.log(`✅ Eliminados ${deleteResult.count} QR codes exitosamente`);

    // Registrar en logs
    await logCleanup({
      totalDeleted: deleteResult.count,
      oldestDate,
      newestDate,
      businesses: businessStats,
      executedAt: new Date()
    });

    return {
      totalDeleted: deleteResult.count,
      oldestDate,
      newestDate,
      businesses: businessStats
    };

  } catch (error) {
    console.error('❌ Error durante la limpieza de QR codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Obtiene estadísticas actuales de QR codes
 */
export async function getQRStats() {
  const hoy = new Date();
  const primerDiaMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  primerDiaMesActual.setHours(0, 0, 0, 0);

  const [total, old, recent, active, used, expired] = await Promise.all([
    prisma.reservationQRCode.count(),
    // QRs de reservas del mes anterior o anteriores
    prisma.reservationQRCode.count({
      where: { 
        Reservation: {
          reservedAt: { lt: primerDiaMesActual }
        }
      }
    }),
    // QRs de reservas del mes actual
    prisma.reservationQRCode.count({
      where: { 
        Reservation: {
          reservedAt: { gte: primerDiaMesActual }
        }
      }
    }),
    prisma.reservationQRCode.count({
      where: { status: 'ACTIVE' }
    }),
    prisma.reservationQRCode.count({
      where: { status: 'USED' }
    }),
    prisma.reservationQRCode.count({
      where: { status: 'EXPIRED' }
    })
  ]);

  return {
    total,
    old, // QRs de reservas del mes anterior (candidatos a eliminar)
    recent, // QRs de reservas del mes actual
    active,
    used,
    expired,
    threshold: primerDiaMesActual,
    currentMonth: hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  };
}

/**
 * Registra la limpieza en la base de datos
 */
async function logCleanup(stats: CleanupStats & { executedAt: Date }) {
  // Si tienes una tabla de logs, úsala aquí
  // Por ahora, solo imprimimos en consola
  console.log('📝 Log de limpieza:', {
    timestamp: stats.executedAt.toISOString(),
    deleted: stats.totalDeleted,
    range: {
      oldest: stats.oldestDate?.toISOString(),
      newest: stats.newestDate?.toISOString()
    },
    businessCount: Object.keys(stats.businesses).length
  });
}

/**
 * Función de limpieza segura con dry-run
 */
export async function cleanupWithDryRun(dryRun: boolean = true): Promise<CleanupStats> {
  const hoy = new Date();
  const primerDiaMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  primerDiaMesActual.setHours(0, 0, 0, 0);

  console.log(`${dryRun ? '🔍 DRY RUN' : '🗑️  EJECUTANDO'}: Análisis de QR codes`);
  console.log(`📅 Mes actual: ${hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`);

  const qrsToDelete = await prisma.reservationQRCode.findMany({
    where: {
      Reservation: {
        reservedAt: {
          lt: primerDiaMesActual
        }
      }
    },
    include: {
      Reservation: {
        select: {
          businessId: true,
          reservedAt: true,
          reservationNumber: true
        }
      }
    }
  });

  const businessStats: Record<string, number> = {};
  qrsToDelete.forEach(qr => {
    const businessId = qr.Reservation.businessId;
    businessStats[businessId] = (businessStats[businessId] || 0) + 1;
  });

  const stats: CleanupStats = {
    totalDeleted: qrsToDelete.length,
    oldestDate: qrsToDelete[0]?.Reservation.reservedAt || null,
    newestDate: qrsToDelete[qrsToDelete.length - 1]?.Reservation.reservedAt || null,
    businesses: businessStats
  };

  if (dryRun) {
    console.log('📊 Resultados del análisis (NO SE ELIMINÓ NADA):');
    console.log(`   Total a eliminar: ${stats.totalDeleted}`);
    console.log(`   Negocios afectados: ${Object.keys(businessStats).length}`);
    if (stats.oldestDate && stats.newestDate) {
      console.log(`   Rango: ${stats.oldestDate.toISOString()} a ${stats.newestDate.toISOString()}`);
    }
    return stats;
  }

  // Si no es dry run, ejecutar la limpieza real
  return cleanupOldQRCodes();
}
