const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarNoviembreActual() {
  try {
    const business = await prisma.business.findFirst({
      where: {
        OR: [{ id: 'love-me-sky' }, { slug: 'love-me-sky' }]
      }
    });
    
    const businessId = business.id;
    console.log(`Business: ${business.name} (${businessId})\n`);
    
    // Fechas de noviembre hasta hoy (4 de noviembre)
    const fechaInicio = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0)); // Nov 1
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    
    console.log('Rango: Noviembre 1 hasta hoy');
    console.log(`Desde: ${fechaInicio.toISOString()}`);
    console.log(`Hasta: ${hoy.toISOString()}\n`);
    
    // Obtener reservas de noviembre hasta hoy
    const reservas = await prisma.reservation.findMany({
      where: {
        businessId,
        reservedAt: {
          gte: fechaInicio,
          lte: hoy
        }
      },
      include: {
        HostTracking: {
          select: {
            guestCount: true,
            reservationDate: true
          }
        },
        ReservationQRCode: {
          select: {
            scanCount: true
          }
        }
      },
      orderBy: {
        reservedAt: 'asc'
      }
    });
    
    console.log(`Total reservas hasta hoy: ${reservas.length}\n`);
    
    // Agrupar por día
    const porDia = {};
    let totalHostTracking = 0;
    let totalScanCount = 0;
    
    reservas.forEach(r => {
      const fecha = new Date(r.reservedAt).toISOString().split('T')[0];
      
      if (!porDia[fecha]) {
        porDia[fecha] = {
          reservas: 0,
          hostTracking: 0,
          scanCount: 0,
          detalles: []
        };
      }
      
      const ht = r.HostTracking?.guestCount || 0;
      const sc = r.ReservationQRCode?.[0]?.scanCount || 0;
      
      porDia[fecha].reservas++;
      porDia[fecha].hostTracking += ht;
      porDia[fecha].scanCount += sc;
      porDia[fecha].detalles.push({
        cliente: r.customerName,
        HostTracking: ht,
        scanCount: sc
      });
      
      totalHostTracking += ht;
      totalScanCount += sc;
    });
    
    console.log('DETALLE POR DÍA:');
    console.log('='.repeat(80));
    
    Object.keys(porDia).sort().forEach(fecha => {
      const dia = porDia[fecha];
      console.log(`\n📅 ${fecha}`);
      console.log(`   Reservas: ${dia.reservas}`);
      console.log(`   HostTracking.guestCount: ${dia.hostTracking}`);
      console.log(`   scanCount: ${dia.scanCount}`);
      console.log(`   Detalles:`);
      dia.detalles.forEach(d => {
        console.log(`     - ${d.cliente}: HT=${d.HostTracking}, SC=${d.scanCount}`);
      });
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 TOTALES NOVIEMBRE (hasta hoy):`);
    console.log(`   Total Reservas: ${reservas.length}`);
    console.log(`   Total HostTracking.guestCount: ${totalHostTracking}`);
    console.log(`   Total scanCount: ${totalScanCount}`);
    console.log(`\n   ✅ El Dashboard debe mostrar: ${totalHostTracking} asistentes`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarNoviembreActual();
