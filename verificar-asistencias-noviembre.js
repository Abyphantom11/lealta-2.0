const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarAsistencias() {
  try {
    // Primero buscar el business correcto
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: 'love-me-sky' },
          { slug: 'love-me-sky' }
        ]
      }
    });
    
    if (!business) {
      console.error('❌ Business no encontrado');
      return;
    }
    
    console.log(`✅ Business encontrado: ${business.name} (ID: ${business.id})\n`);
    const businessId = business.id;
    
    // Fechas de noviembre
    const fechaInicio = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0)); // Nov 1
    const fechaFin = new Date(Date.UTC(2025, 10, 4, 0, 0, 0, 0)); // Nov 4
    
    console.log('Buscando asistencias de noviembre 1-3...');
    console.log('fechaInicio:', fechaInicio.toISOString());
    console.log('fechaFin:', fechaFin.toISOString());
    console.log('');
    
    // Obtener todas las reservas con HostTracking
    const todasReservas = await prisma.reservation.findMany({
      where: {
        businessId
      },
      include: {
        HostTracking: {
          select: {
            reservationDate: true,
            guestCount: true
          }
        },
        ReservationQRCode: {
          select: {
            scanCount: true
          }
        }
      }
    });
    
    console.log(`Total reservas en BD: ${todasReservas.length}`);
    console.log(`Reservas con HostTracking: ${todasReservas.filter(r => r.HostTracking).length}`);
    
    // Filtrar solo las que tienen asistencia en el rango
    const reservas = todasReservas.filter(r => {
      if (!r.HostTracking?.reservationDate) return false;
      const fecha = r.HostTracking.reservationDate;
      return fecha >= fechaInicio && fecha < fechaFin;
    });
    
    console.log(`Reservas en rango Nov 1-3: ${reservas.length}\n`);
    
    // Agrupar por día
    const porDia = {};
    
    reservas.forEach(r => {
      if (r.HostTracking?.reservationDate) {
        const fecha = r.HostTracking.reservationDate.toISOString().split('T')[0];
        if (!porDia[fecha]) {
          porDia[fecha] = {
            reservas: 0,
            personasEsperadas: 0,
            personasReales: 0,
            detalles: []
          };
        }
        const asistentesReales = r.ReservationQRCode?.[0]?.scanCount || 0;
        porDia[fecha].reservas++;
        porDia[fecha].personasEsperadas += r.HostTracking.guestCount;
        porDia[fecha].personasReales += asistentesReales;
        porDia[fecha].detalles.push({
          hora: r.HostTracking.reservationDate.toISOString().split('T')[1].substring(0, 5),
          esperadas: r.HostTracking.guestCount,
          asistieron: asistentesReales
        });
      }
    });
    
    console.log('ASISTENCIAS POR DÍA:');
    console.log('='.repeat(60));
    
    let totalReservasMes = 0;
    let totalPersonasEsperadas = 0;
    let totalPersonasReales = 0;
    
    Object.keys(porDia).sort().forEach(fecha => {
      const dia = porDia[fecha];
      console.log(`\n📅 ${fecha}`);
      console.log(`   Reservas: ${dia.reservas}`);
      console.log(`   Personas Esperadas: ${dia.personasEsperadas}`);
      console.log(`   Personas que Asistieron: ${dia.personasReales}`);
      console.log(`   Detalle:`);
      dia.detalles.forEach(d => {
        console.log(`     - ${d.hora}: ${d.asistieron}/${d.esperadas} personas`);
      });
      
      totalReservasMes += dia.reservas;
      totalPersonasEsperadas += dia.personasEsperadas;
      totalPersonasReales += dia.personasReales;
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 RESUMEN DEL MES:`);
    console.log(`   Total Reservas: ${totalReservasMes}`);
    console.log(`   Total Personas Esperadas: ${totalPersonasEsperadas}`);
    console.log(`   Total Asistentes Reales: ${totalPersonasReales}`);
    console.log(`\n   ✅ El Dashboard debe mostrar: ${totalPersonasReales} asistentes`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarAsistencias();
