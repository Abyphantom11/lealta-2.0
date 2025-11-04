const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarReportesNoviembre() {
  try {
    const business = await prisma.business.findFirst({
      where: {
        OR: [{ id: 'love-me-sky' }, { slug: 'love-me-sky' }]
      }
    });
    
    const businessId = business.id;
    console.log(`Business: ${business.name} (${businessId})\n`);
    
    // Fechas de noviembre 2025
    const fechaInicio = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0)); // Nov 1
    const fechaFin = new Date(Date.UTC(2025, 11, 1, 0, 0, 0, 0)); // Dec 1
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    
    console.log('🗓️  Rango completo del mes:');
    console.log(`   Desde: ${fechaInicio.toISOString()}`);
    console.log(`   Hasta: ${fechaFin.toISOString()}`);
    console.log(`   Hoy: ${hoy.toISOString()}\n`);
    
    // Obtener TODAS las reservas del mes
    const todasReservas = await prisma.reservation.findMany({
      where: {
        businessId,
        reservedAt: {
          gte: fechaInicio,
          lt: fechaFin
        }
      },
      include: {
        HostTracking: {
          select: {
            guestCount: true,
            reservationDate: true
          }
        }
      },
      orderBy: {
        reservedAt: 'asc'
      }
    });
    
    console.log(`📋 Total reservas del mes: ${todasReservas.length}\n`);
    
    // Filtrar solo reservas hasta hoy
    const reservasHastaHoy = todasReservas.filter(r => {
      if (!r.reservedAt) return false;
      return new Date(r.reservedAt) <= hoy;
    });
    
    console.log(`✅ Reservas hasta hoy: ${reservasHastaHoy.length}\n`);
    
    // Calcular asistentes
    const totalAsistentesTodas = todasReservas.reduce((sum, r) => {
      return sum + (r.HostTracking?.guestCount || 0);
    }, 0);
    
    const totalAsistentesHastaHoy = reservasHastaHoy.reduce((sum, r) => {
      return sum + (r.HostTracking?.guestCount || 0);
    }, 0);
    
    console.log('📊 COMPARACIÓN:');
    console.log('='.repeat(60));
    console.log(`❌ Si sumamos TODAS las reservas del mes: ${totalAsistentesTodas} asistentes`);
    console.log(`✅ Si sumamos SOLO hasta hoy: ${totalAsistentesHastaHoy} asistentes`);
    console.log('='.repeat(60));
    
    console.log('\n📅 Reservas futuras (después de hoy):');
    const reservasFuturas = todasReservas.filter(r => {
      if (!r.reservedAt) return false;
      return new Date(r.reservedAt) > hoy;
    });
    
    if (reservasFuturas.length > 0) {
      console.log(`   Cantidad: ${reservasFuturas.length}`);
      reservasFuturas.forEach(r => {
        const fecha = new Date(r.reservedAt).toISOString().split('T')[0];
        const asistentes = r.HostTracking?.guestCount || 0;
        console.log(`   - ${fecha}: ${r.customerName} (${asistentes} asistentes)`);
      });
    } else {
      console.log('   No hay reservas futuras');
    }
    
    console.log(`\n✅ El reporte DEBE mostrar: ${totalAsistentesHastaHoy} asistentes`);
    console.log(`   (igual que el Dashboard)`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarReportesNoviembre();
