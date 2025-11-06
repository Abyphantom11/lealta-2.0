const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarMetadataComprobantes() {
  try {
    console.log('🔍 VERIFICANDO METADATA Y COMPROBANTES\n');

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
    });

    console.log(`📊 Total reservas octubre: ${reservations.length}\n`);

    // Verificar metadata
    console.log('🔍 VERIFICANDO CAMPO METADATA:');
    const conMetadata = reservations.filter(r => r.metadata && r.metadata !== null);
    console.log(`  Reservas con metadata: ${conMetadata.length}\n`);

    if (conMetadata.length > 0) {
      console.log('📌 EJEMPLOS DE METADATA:');
      for (const r of conMetadata.slice(0, 5)) {
        console.log(`\n  Reserva: ${r.id.slice(0, 8)}`);
        console.log(`  Metadata:`, JSON.stringify(r.metadata, null, 2));
      }
    }

    // Verificar paidAmount
    console.log('\n🔍 VERIFICANDO CAMPO paidAmount:');
    const conPaidAmount = reservations.filter(r => r.paidAmount && r.paidAmount > 0);
    console.log(`  Reservas con paidAmount > 0: ${conPaidAmount.length}\n`);

    if (conPaidAmount.length > 0) {
      console.log('📌 EJEMPLOS CON paidAmount:');
      for (const r of conPaidAmount.slice(0, 5)) {
        const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
        console.log(`  - ${r.id.slice(0, 8)} | ${fecha} | ${r.customerName} | Pagó: $${r.paidAmount}`);
      }
    }

    // Verificar totalPrice
    console.log('\n🔍 VERIFICANDO CAMPO totalPrice:');
    const conTotalPrice = reservations.filter(r => r.totalPrice && r.totalPrice > 0);
    console.log(`  Reservas con totalPrice > 0: ${conTotalPrice.length}\n`);

    if (conTotalPrice.length > 0) {
      console.log('📌 EJEMPLOS CON totalPrice:');
      for (const r of conTotalPrice.slice(0, 5)) {
        const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
        console.log(`  - ${r.id.slice(0, 8)} | ${fecha} | ${r.customerName} | Precio: $${r.totalPrice}`);
      }
    }

    // Buscar si hay una tabla de pagos separada
    console.log('\n🔍 VERIFICANDO SI HAY TABLA DE PAGOS SEPARADA:');
    try {
      const payments = await prisma.payment.findMany({
        where: {
          Reservation: {
            businessId: business.id,
            reservedAt: {
              gte: new Date('2025-10-01T00:00:00.000Z'),
              lt: new Date('2025-11-01T00:00:00.000Z'),
            },
          },
        },
        include: {
          Reservation: {
            select: {
              customerName: true,
              reservedAt: true,
            },
          },
        },
      });
      console.log(`  ✅ Tabla Payment existe. Pagos encontrados: ${payments.length}`);
      
      if (payments.length > 0) {
        console.log('\n📌 EJEMPLOS DE PAGOS:');
        for (const p of payments.slice(0, 5)) {
          const fecha = new Date(p.Reservation.reservedAt).toLocaleDateString('es-ES');
          console.log(`  - ${p.id.slice(0, 8)} | ${fecha} | ${p.Reservation.customerName} | $${p.amount}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Tabla Payment no existe o error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarMetadataComprobantes();
