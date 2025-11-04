/**
 * TOTAL CORRECTO: Asistencias de SOLO OCTUBRE (sin incluir noviembre)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function totalSoloOctubre() {
  try {
    console.log('🎯 TOTAL DE ASISTENCIAS SOLO DE OCTUBRE 2025\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' }
    });

    const primerDiaOctubre = new Date(Date.UTC(2025, 9, 1, 0, 0, 0));
    const primerDiaNoviembre = new Date(Date.UTC(2025, 10, 1, 0, 0, 0));

    // Obtener registros de HostTracking SOLO de octubre
    const hostTrackingsOctubre = await prisma.hostTracking.findMany({
      where: {
        businessId: business.id,
        reservationDate: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre  // Excluye noviembre
        }
      },
      orderBy: {
        reservationDate: 'asc'
      }
    });

    // Filtrar manualmente para excluir noviembre
    const soloOctubre = hostTrackingsOctubre.filter(tracking => {
      const fecha = new Date(tracking.reservationDate);
      return fecha.getMonth() === 9; // Octubre = mes 9
    });

    console.log(`Total de registros en HostTracking (solo octubre): ${soloOctubre.length}\n`);

    // Agrupar por día
    const asistenciasPorDia = {};
    let totalOctubre = 0;

    for (const tracking of soloOctubre) {
      const fecha = tracking.reservationDate.toISOString().split('T')[0];
      
      if (!asistenciasPorDia[fecha]) {
        asistenciasPorDia[fecha] = {
          registros: 0,
          personas: 0
        };
      }
      
      asistenciasPorDia[fecha].registros++;
      asistenciasPorDia[fecha].personas += tracking.guestCount;
    }

    console.log('═══════════════════════════════════════════════');
    console.log('📊 ASISTENCIAS POR DÍA DE OCTUBRE 2025');
    console.log('═══════════════════════════════════════════════\n');

    const fechas = Object.keys(asistenciasPorDia).sort();

    for (const fecha of fechas) {
      const data = asistenciasPorDia[fecha];
      console.log(`📅 ${fecha}: ${data.personas} personas (${data.registros} registros)`);
      totalOctubre += data.personas;
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✨ TOTAL DE ASISTENCIAS DE OCTUBRE 2025');
    console.log('═══════════════════════════════════════════════\n');
    console.log(`👥 TOTAL: ${totalOctubre} personas\n`);
    console.log(`📅 Días con actividad: ${fechas.length} días`);
    console.log(`📊 Promedio diario: ${(totalOctubre / fechas.length).toFixed(1)} personas/día\n`);

    // Top 3 días
    const diasOrdenados = Object.entries(asistenciasPorDia)
      .sort((a, b) => b[1].personas - a[1].personas)
      .slice(0, 3);

    console.log('🔝 Top 3 días con más asistencias:\n');
    diasOrdenados.forEach(([fecha, data], index) => {
      console.log(`${index + 1}. ${fecha}: ${data.personas} personas`);
    });

    console.log('\n✅ CONFIRMADO: ' + totalOctubre + ' personas asistieron en octubre 2025\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

totalSoloOctubre();
