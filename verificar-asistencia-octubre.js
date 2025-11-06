const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarAsistenciaOctubre() {
  try {
    console.log('🔍 VERIFICACIÓN DETALLADA DE ASISTENCIA OCTUBRE 2025\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' },
    });

    const reservations = await prisma.reservation.findMany({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
          lt: new Date('2025-11-01T00:00:00.000Z'),
        },
      },
      include: {
        HostTracking: true,
        Cliente: true,
        Promotor: true,
      },
      orderBy: {
        reservedAt: 'asc',
      },
    });

    console.log(`📊 Total reservas: ${reservations.length}\n`);

    // Categorizar
    const completadas = [];
    const sobreaforo = [];
    const parciales = [];
    const caidas = [];
    const canceladas = [];
    const sinHostTracking = [];

    for (const r of reservations) {
      const asistentesReales = r.HostTracking?.guestCount || 0;
      const esperados = r.guestCount;
      
      if (r.status === 'CANCELLED') {
        canceladas.push(r);
        continue;
      }

      if (!r.HostTracking) {
        sinHostTracking.push(r);
        caidas.push(r); // Se cuenta como caída si no hay HostTracking
        continue;
      }
      
      if (asistentesReales === 0) {
        caidas.push(r);
      } else if (asistentesReales === esperados) {
        completadas.push(r);
      } else if (asistentesReales > esperados) {
        sobreaforo.push(r);
      } else {
        parciales.push(r);
      }
    }

    console.log('📊 RESUMEN:');
    console.log(`✅ Completadas: ${completadas.length}`);
    console.log(`📈 Sobreaforo: ${sobreaforo.length}`);
    console.log(`⚠️  Parciales: ${parciales.length}`);
    console.log(`❌ Caídas: ${caidas.length} (incluye ${sinHostTracking.length} sin HostTracking)`);
    console.log(`🚫 Canceladas: ${canceladas.length}\n`);

    // Mostrar TODAS las de sobreaforo
    console.log('=' .repeat(80));
    console.log('📈 TODAS LAS RESERVAS CON SOBREAFORO:');
    console.log('=' .repeat(80));
    for (const r of sobreaforo) {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
      console.log(`\n🎯 Reserva: ${r.id.slice(0, 8)}`);
      console.log(`   Fecha: ${fecha}`);
      console.log(`   Cliente: ${r.customerName || r.Cliente?.nombre || 'Sin nombre'}`);
      console.log(`   Promotor: ${r.Promotor?.nombre || 'Sin promotor'}`);
      console.log(`   Esperados: ${r.guestCount} personas`);
      console.log(`   Asistieron: ${r.HostTracking?.guestCount} personas`);
      console.log(`   Diferencia: +${r.HostTracking?.guestCount - r.guestCount}`);
      console.log(`   Estado: ${r.status}`);
    }

    // Mostrar muestra de completadas
    console.log('\n' + '='.repeat(80));
    console.log('✅ MUESTRA DE COMPLETADAS (primeras 10):');
    console.log('=' .repeat(80));
    for (const r of completadas.slice(0, 10)) {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
      console.log(`${r.id.slice(0, 8)} | ${fecha} | ${r.customerName || r.Cliente?.nombre || 'Sin nombre'} | Esperados: ${r.guestCount} = Asistieron: ${r.HostTracking?.guestCount}`);
    }

    // Mostrar muestra de parciales
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  TODAS LAS PARCIALES:');
    console.log('=' .repeat(80));
    for (const r of parciales) {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
      console.log(`\n📊 Reserva: ${r.id.slice(0, 8)}`);
      console.log(`   Fecha: ${fecha}`);
      console.log(`   Cliente: ${r.customerName || r.Cliente?.nombre || 'Sin nombre'}`);
      console.log(`   Esperados: ${r.guestCount} personas`);
      console.log(`   Asistieron: ${r.HostTracking?.guestCount} personas`);
      console.log(`   Cumplimiento: ${((r.HostTracking?.guestCount / r.guestCount) * 100).toFixed(1)}%`);
    }

    // Mostrar muestra de caídas CON HostTracking
    const caidasConTracking = caidas.filter(r => r.HostTracking);
    console.log('\n' + '='.repeat(80));
    console.log(`❌ MUESTRA DE CAÍDAS CON HOSTTRACKING (${caidasConTracking.length} de ${caidas.length}):`);
    console.log('=' .repeat(80));
    for (const r of caidasConTracking.slice(0, 10)) {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
      console.log(`${r.id.slice(0, 8)} | ${fecha} | ${r.customerName || r.Cliente?.nombre || 'Sin nombre'} | Esperados: ${r.guestCount}, Status: ${r.status}`);
    }

    // Mostrar muestra de caídas SIN HostTracking
    console.log('\n' + '='.repeat(80));
    console.log(`❌ MUESTRA DE CAÍDAS SIN HOSTTRACKING (${sinHostTracking.length}):`);
    console.log('=' .repeat(80));
    for (const r of sinHostTracking.slice(0, 10)) {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
      console.log(`${r.id.slice(0, 8)} | ${fecha} | ${r.customerName || r.Cliente?.nombre || 'Sin nombre'} | Esperados: ${r.guestCount}, Status: ${r.status}`);
    }

    // Buscar posibles errores en los datos
    console.log('\n' + '='.repeat(80));
    console.log('🔍 ANÁLISIS DE POSIBLES INCONSISTENCIAS:');
    console.log('=' .repeat(80));

    // Verificar si hay reservas con HostTracking.guestCount muy alto
    const hostTrackingAlto = reservations.filter(r => 
      r.HostTracking && r.HostTracking.guestCount > 50
    );
    console.log(`\n⚠️  Reservas con >50 personas en HostTracking: ${hostTrackingAlto.length}`);
    for (const r of hostTrackingAlto.slice(0, 5)) {
      console.log(`   - ${r.id.slice(0, 8)}: Esperados ${r.guestCount}, HostTracking ${r.HostTracking.guestCount}`);
    }

    // Verificar reservas COMPLETED sin HostTracking
    const completedSinTracking = reservations.filter(r => 
      r.status === 'COMPLETED' && !r.HostTracking
    );
    console.log(`\n⚠️  Reservas COMPLETED sin HostTracking: ${completedSinTracking.length}`);
    for (const r of completedSinTracking.slice(0, 5)) {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
      console.log(`   - ${r.id.slice(0, 8)}: ${fecha}, ${r.customerName || 'Sin nombre'}, ${r.guestCount} personas`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarAsistenciaOctubre();
