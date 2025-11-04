const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarBorrado() {
  try {
    console.log('🔍 VERIFICANDO BORRADO DE QRs DE OCTUBRE\n');
    console.log('='.repeat(70));
    
    // Definir rango de octubre
    const inicioOctubre = new Date(Date.UTC(2025, 9, 1, 0, 0, 0, 0)); // Oct 1
    const finOctubre = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0)); // Nov 1
    
    console.log('📅 Buscando QRs de reservas de octubre...\n');
    
    // Buscar QRs de octubre (por fecha de reserva)
    const qrsOctubre = await prisma.reservationQRCode.findMany({
      where: {
        Reservation: {
          reservedAt: {
            gte: inicioOctubre,
            lt: finOctubre
          }
        }
      },
      include: {
        Reservation: {
          select: {
            customerName: true,
            reservedAt: true,
            status: true
          }
        }
      }
    });
    
    console.log(`📊 QRs de RESERVAS de octubre encontrados: ${qrsOctubre.length}\n`);
    
    if (qrsOctubre.length > 0) {
      console.log('❌ ERROR: Todavía hay QRs de octubre en la base de datos!');
      console.log('📋 Detalles:');
      qrsOctubre.forEach((qr, index) => {
        console.log(`${index + 1}. ${qr.Reservation?.customerName || 'Sin nombre'}`);
        console.log(`   Token: ${qr.qrToken}`);
        console.log(`   Reserva: ${qr.Reservation?.reservedAt?.toISOString().split('T')[0]}`);
        console.log('');
      });
    } else {
      console.log('✅ CORRECTO: No hay QRs de reservas de octubre');
      console.log('   Los QRs fueron borrados exitosamente\n');
    }
    
    // Verificar QRs de noviembre
    const inicioNoviembre = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0)); // Nov 1
    const qrsNoviembre = await prisma.reservationQRCode.findMany({
      where: {
        Reservation: {
          reservedAt: {
            gte: inicioNoviembre
          }
        }
      },
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
        Reservation: {
          reservedAt: 'asc'
        }
      }
    });
    
    console.log('='.repeat(70));
    console.log(`📊 QRs de RESERVAS de noviembre y futuras: ${qrsNoviembre.length}\n`);
    
    if (qrsNoviembre.length > 0) {
      console.log('✅ CORRECTO: QRs de noviembre se mantienen intactos');
      console.log('📋 Lista de QRs mantenidos:');
      qrsNoviembre.forEach((qr, index) => {
        const fecha = qr.Reservation?.reservedAt?.toISOString().split('T')[0];
        console.log(`${index + 1}. ${qr.Reservation?.customerName || 'Sin nombre'} - ${fecha}`);
      });
      console.log('');
    }
    
    // Estadísticas totales
    const totalQRs = await prisma.reservationQRCode.count();
    
    console.log('='.repeat(70));
    console.log('📊 RESUMEN FINAL:');
    console.log(`   Total QRs en BD: ${totalQRs}`);
    console.log(`   QRs de octubre: ${qrsOctubre.length} (deberían ser 0)`);
    console.log(`   QRs de noviembre+: ${qrsNoviembre.length}`);
    console.log('');
    
    if (qrsOctubre.length === 0 && qrsNoviembre.length > 0) {
      console.log('✅✅✅ VERIFICACIÓN EXITOSA');
      console.log('   - QRs de octubre borrados correctamente');
      console.log('   - QRs de noviembre preservados correctamente');
      console.log('   - Base de datos optimizada');
    } else if (qrsOctubre.length > 0) {
      console.log('⚠️  ADVERTENCIA: Aún hay QRs de octubre');
    } else if (qrsNoviembre.length === 0) {
      console.log('⚠️  ADVERTENCIA: No hay QRs de noviembre (verificar si es correcto)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarBorrado();
