const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function contarQRs() {
  try {
    console.log('🔍 CONTANDO QRs EN LA BASE DE DATOS\n');
    console.log('='.repeat(70));
    
    // Contar QRs de reservas
    const qrsReservas = await prisma.reservationQRCode.count();
    console.log(`📱 QRs de Reservas: ${qrsReservas}`);
    
    // Contar QRs de reservas con detalles
    const qrsReservasConDetalles = await prisma.reservationQRCode.findMany({
      include: {
        Reservation: {
          select: {
            customerName: true,
            reservedAt: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`\n📊 Últimos 10 QRs generados:`);
    console.log('-'.repeat(70));
    qrsReservasConDetalles.forEach((qr, index) => {
      console.log(`${index + 1}. ${qr.Reservation?.customerName || 'Sin nombre'}`);
      console.log(`   Token: ${qr.qrToken}`);
      console.log(`   Escaneos: ${qr.scanCount}`);
      console.log(`   Estado: ${qr.Reservation?.status || 'N/A'}`);
      console.log(`   Creado: ${qr.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // Estadísticas adicionales
    const qrsEscaneados = await prisma.reservationQRCode.count({
      where: {
        scanCount: {
          gt: 0
        }
      }
    });
    
    const qrsNoEscaneados = qrsReservas - qrsEscaneados;
    
    console.log('='.repeat(70));
    console.log('📈 ESTADÍSTICAS:');
    console.log(`   Total QRs: ${qrsReservas}`);
    console.log(`   QRs escaneados: ${qrsEscaneados} (${((qrsEscaneados/qrsReservas)*100).toFixed(1)}%)`);
    console.log(`   QRs sin escanear: ${qrsNoEscaneados} (${((qrsNoEscaneados/qrsReservas)*100).toFixed(1)}%)`);
    
    // Total de escaneos
    const totalEscaneos = await prisma.reservationQRCode.aggregate({
      _sum: {
        scanCount: true
      }
    });
    
    console.log(`   Total escaneos realizados: ${totalEscaneos._sum.scanCount || 0}`);
    
    // QRs por mes
    const hoy = new Date();
    const inicioMes = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), 1));
    const qrsEsteMes = await prisma.reservationQRCode.count({
      where: {
        createdAt: {
          gte: inicioMes
        }
      }
    });
    
    console.log(`   QRs generados este mes: ${qrsEsteMes}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

contarQRs();
