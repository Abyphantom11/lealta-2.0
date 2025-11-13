import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * CRON JOB: Cierre automático de días comerciales
 * 
 * Se ejecuta todos los días a las 4:00 AM (Ecuador)
 * Cambia TODAS las reservas PENDING/CONFIRMED viejas → NO_SHOW
 * 
 * Configurado en vercel.json: "0 9 * * *" (9 AM UTC = 4 AM Ecuador)
 */
export async function GET() {
  try {
    console.log('🔄 Cerrando días comerciales automáticamente...');
    console.log('⏰', new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }));

    // Calcular límite: 4 AM de hoy
    // Todo antes de las 4 AM ya pasó
    const ahora = new Date();
    const limiteDiaComercial = new Date();
    limiteDiaComercial.setHours(4, 0, 0, 0);
    
    if (ahora.getHours() < 4) {
      limiteDiaComercial.setDate(limiteDiaComercial.getDate() - 1);
    }
    
    console.log('📅 Cerrando reservas antes de:', limiteDiaComercial.toLocaleString('es-EC'));

    // Actualizar TODAS las reservas PENDING/CONFIRMED viejas → NO_SHOW
    const resultado = await prisma.reservation.updateMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        reservedAt: {
          lt: limiteDiaComercial
        }
      },
      data: {
        status: 'NO_SHOW',
        guestCount: 0
      }
    });

    console.log(`✅ ${resultado.count} reservas actualizadas a NO_SHOW`);

    return NextResponse.json({
      success: true,
      mensaje: `${resultado.count} reservas actualizadas a NO_SHOW`,
      reservasActualizadas: resultado.count,
      limiteDiaComercial: limiteDiaComercial.toISOString()
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Error en el cierre automático' },
      { status: 500 }
    );
  }
}
