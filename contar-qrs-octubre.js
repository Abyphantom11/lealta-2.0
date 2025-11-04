const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function contarQRsOctubre() {
  try {
    console.log('🔍 BUSCANDO QRs DE OCTUBRE 2025\n');
    console.log('='.repeat(70));
    
    // Definir rango de octubre
    const inicioOctubre = new Date(Date.UTC(2025, 9, 1, 0, 0, 0, 0)); // Oct 1
    const finOctubre = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0)); // Nov 1
    
    console.log(`📅 Rango: ${inicioOctubre.toISOString().split('T')[0]} - ${finOctubre.toISOString().split('T')[0]}\n`);
    
    // Contar QRs de octubre
    const qrsOctubre = await prisma.reservationQRCode.findMany({
      where: {
        createdAt: {
          gte: inicioOctubre,
          lt: finOctubre
        }
      },
      include: {
        Reservation: {
          select: {
            customerName: true,
            reservedAt: true,
            status: true,
            guestCount: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`📱 Total QRs generados en octubre: ${qrsOctubre.length}\n`);
    
    if (qrsOctubre.length > 0) {
      console.log('📋 DETALLE DE QRs DE OCTUBRE:');
      console.log('-'.repeat(70));
      
      qrsOctubre.forEach((qr, index) => {
        const fecha = qr.createdAt.toISOString().split('T')[0];
        console.log(`${index + 1}. ${qr.Reservation?.customerName || 'Sin nombre'}`);
        console.log(`   Token: ${qr.qrToken}`);
        console.log(`   Fecha creación: ${fecha}`);
        console.log(`   Fecha reserva: ${qr.Reservation?.reservedAt?.toISOString().split('T')[0] || 'N/A'}`);
        console.log(`   Escaneos: ${qr.scanCount}`);
        console.log(`   Personas: ${qr.Reservation?.guestCount || 0}`);
        console.log(`   Estado: ${qr.Reservation?.status || 'N/A'}`);
        console.log('');
      });
      
      // Estadísticas de octubre
      const qrsEscaneados = qrsOctubre.filter(qr => qr.scanCount > 0).length;
      const totalEscaneos = qrsOctubre.reduce((sum, qr) => sum + qr.scanCount, 0);
      
      console.log('='.repeat(70));
      console.log('📊 ESTADÍSTICAS DE OCTUBRE:');
      console.log(`   Total QRs: ${qrsOctubre.length}`);
      console.log(`   QRs escaneados: ${qrsEscaneados} (${((qrsEscaneados/qrsOctubre.length)*100).toFixed(1)}%)`);
      console.log(`   QRs sin escanear: ${qrsOctubre.length - qrsEscaneados}`);
      console.log(`   Total escaneos: ${totalEscaneos}`);
      console.log(`   Promedio escaneos por QR: ${(totalEscaneos/qrsOctubre.length).toFixed(1)}`);
      
      // Agrupar por día
      const porDia = {};
      qrsOctubre.forEach(qr => {
        const dia = qr.createdAt.toISOString().split('T')[0];
        if (!porDia[dia]) {
          porDia[dia] = 0;
        }
        porDia[dia]++;
      });
      
      console.log('\n📅 QRs por día:');
      Object.keys(porDia).sort().forEach(dia => {
        console.log(`   ${dia}: ${porDia[dia]} QRs`);
      });
      
    } else {
      console.log('❌ No se encontraron QRs generados en octubre 2025');
      
      // Buscar el QR más antiguo
      const qrMasAntiguo = await prisma.reservationQRCode.findFirst({
        orderBy: {
          createdAt: 'asc'
        },
        include: {
          Reservation: {
            select: {
              customerName: true
            }
          }
        }
      });
      
      if (qrMasAntiguo) {
        console.log(`\n📌 QR más antiguo en la base de datos:`);
        console.log(`   Cliente: ${qrMasAntiguo.Reservation?.customerName || 'Sin nombre'}`);
        console.log(`   Fecha: ${qrMasAntiguo.createdAt.toISOString().split('T')[0]}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

contarQRsOctubre();
