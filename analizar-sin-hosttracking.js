const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizarSinHostTracking() {
  try {
    console.log('🔍 ANÁLISIS DE RESERVAS SIN HOSTTRACKING\n');

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
        ReservationQRCode: true,
      },
      orderBy: {
        reservedAt: 'asc',
      },
    });

    const sinHostTracking = reservations.filter(r => !r.HostTracking);
    const conHostTracking = reservations.filter(r => r.HostTracking);

    console.log(`📊 Total reservas: ${reservations.length}`);
    console.log(`✅ Con HostTracking: ${conHostTracking.length}`);
    console.log(`❌ Sin HostTracking: ${sinHostTracking.length}\n`);

    // Analizar por status
    console.log('📊 DISTRIBUCIÓN POR STATUS (sin HostTracking):');
    const porStatus = sinHostTracking.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    for (const [status, count] of Object.entries(porStatus)) {
      console.log(`  ${status}: ${count}`);
    }

    // Verificar si tienen QR escaneado
    console.log('\n📊 ¿TIENEN QR ESCANEADO? (sin HostTracking):');
    const conQREscaneado = sinHostTracking.filter(r => 
      r.ReservationQRCode.length > 0 && r.ReservationQRCode[0].scanCount > 0
    );
    console.log(`  Con QR escaneado: ${conQREscaneado.length}`);
    console.log(`  Sin QR escaneado: ${sinHostTracking.length - conQREscaneado.length}`);

    if (conQREscaneado.length > 0) {
      console.log('\n  Ejemplos con QR escaneado pero sin HostTracking:');
      for (const r of conQREscaneado.slice(0, 5)) {
        const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
        const scanCount = r.ReservationQRCode[0]?.scanCount || 0;
        console.log(`    - ${r.id.slice(0, 8)} | ${fecha} | ${r.customerName} | Scans: ${scanCount}, Status: ${r.status}`);
      }
    }

    // Verificar fechas
    console.log('\n📊 DISTRIBUCIÓN POR DÍA (sin HostTracking):');
    const porDia = sinHostTracking.reduce((acc, r) => {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
      acc[fecha] = (acc[fecha] || 0) + 1;
      return acc;
    }, {});
    
    const diasOrdenados = Object.entries(porDia)
      .sort((a, b) => new Date(a[0].split('/').reverse().join('-')) - new Date(b[0].split('/').reverse().join('-')));
    
    for (const [fecha, count] of diasOrdenados) {
      console.log(`  ${fecha}: ${count} reservas`);
    }

    // Comparar con las que SÍ tienen HostTracking
    console.log('\n📊 RESERVAS CON HOSTTRACKING:');
    console.log(`  Total: ${conHostTracking.length}`);
    
    const primeraConTracking = conHostTracking[0];
    const ultimaConTracking = conHostTracking[conHostTracking.length - 1];
    
    if (primeraConTracking) {
      console.log(`  Primera: ${new Date(primeraConTracking.reservedAt).toLocaleDateString('es-ES')}`);
    }
    if (ultimaConTracking) {
      console.log(`  Última: ${new Date(ultimaConTracking.reservedAt).toLocaleDateString('es-ES')}`);
    }

    console.log('\n📊 HIPÓTESIS:');
    console.log('  ¿Cuándo se implementó HostTracking?');
    
    // Ver si hay un patrón de fecha
    const fechasConTracking = conHostTracking.map(r => new Date(r.reservedAt));
    const fechaMinima = new Date(Math.min(...fechasConTracking));
    console.log(`  Fecha mínima con HostTracking: ${fechaMinima.toLocaleDateString('es-ES')}`);

    const fechasSinTracking = sinHostTracking.map(r => new Date(r.reservedAt));
    const fechaMaximaSin = new Date(Math.max(...fechasSinTracking));
    console.log(`  Fecha máxima sin HostTracking: ${fechaMaximaSin.toLocaleDateString('es-ES')}`);

    if (fechaMaximaSin < fechaMinima) {
      console.log('\n  ✅ CONCLUSIÓN: HostTracking se implementó después de algunas reservas.');
      console.log('     Las reservas "sin tracking" son anteriores a la implementación.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analizarSinHostTracking();
