const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Verificando estado de la base de datos...\n');

    // 1. Verificar Business
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            clientes: true,
            reservationServices: true,
            consumos: true,
            promotores: true
          }
        }
      }
    });

    console.log('📊 BUSINESSES ENCONTRADOS:', businesses.length);
    if (businesses.length > 0) {
      businesses.forEach(b => {
        console.log(`\n✅ Business: ${b.name}`);
        console.log(`   ID: ${b.id}`);
        console.log(`   Slug: ${b.slug}`);
        console.log(`   Creado: ${b.createdAt.toLocaleDateString()}`);
        console.log(`   - Clientes: ${b._count.clientes}`);
        console.log(`   - Servicios de Reserva: ${b._count.reservationServices}`);
        console.log(`   - Consumos: ${b._count.consumos}`);
        console.log(`   - Promotores: ${b._count.promotores}`);
      });
    } else {
      console.log('⚠️  No se encontraron businesses en la base de datos');
    }

    // 2. Verificar Reservas
    console.log('\n📋 VERIFICANDO RESERVAS...');
    const reservas = await prisma.reservation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reservationNumber: true,
        customerName: true,
        status: true,
        reservedAt: true,
        businessId: true
      }
    });

    console.log(`Total: ${reservas.length} reservas recientes`);
    if (reservas.length > 0) {
      reservas.forEach(r => {
        console.log(`  - #${r.reservationNumber}: ${r.customerName} (${r.status})`);
      });
    }

    // 3. Verificar Clientes
    console.log('\n👥 VERIFICANDO CLIENTES...');
    const clientesCount = await prisma.cliente.count();
    console.log(`Total clientes: ${clientesCount}`);

    // 4. Verificar Consumos
    console.log('\n💰 VERIFICANDO CONSUMOS...');
    const consumosCount = await prisma.consumo.count();
    console.log(`Total consumos: ${consumosCount}`);

    // 5. Verificar Promotores
    console.log('\n📱 VERIFICANDO PROMOTORES...');
    const promotoresCount = await prisma.promotor.count();
    console.log(`Total promotores: ${promotoresCount}`);

    // 6. Verificar ReservationServices
    console.log('\n🎯 VERIFICANDO SERVICIOS DE RESERVA...');
    const services = await prisma.reservationService.findMany({
      select: {
        id: true,
        name: true,
        businessId: true
      }
    });
    console.log(`Total servicios: ${services.length}`);

    // 7. Verificar ReservationSlots
    console.log('\n⏰ VERIFICANDO SLOTS DE RESERVA...');
    const slotsCount = await prisma.reservationSlot.count();
    console.log(`Total slots: ${slotsCount}`);

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error verificando la base de datos:', error);
    console.error('\nDetalles del error:');
    console.error('- Mensaje:', error.message);
    console.error('- Código:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();
