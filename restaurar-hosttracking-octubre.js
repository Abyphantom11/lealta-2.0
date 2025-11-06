const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restaurarHostTrackingOctubre() {
  console.log('🔄 RESTAURANDO HOSTTRACKING PARA RESERVAS DE OCTUBRE\n');
  
  const businessId = 'cmgh621rd0012lb0aixrzpvrw'; // Love Me Sky
  
  // 1. Buscar reservas de octubre sin HostTracking pero con status CHECKED_IN o COMPLETED
  const reservasSinTracking = await prisma.reservation.findMany({
    where: {
      businessId,
      reservedAt: {
        gte: new Date('2025-10-01T05:00:00Z'),
        lt: new Date('2025-11-01T05:00:00Z'),
      },
      HostTracking: null,
      OR: [
        { status: 'CHECKED_IN' },
        { status: 'COMPLETED' },
      ],
    },
    include: {
      Cliente: true,
      Promotor: true,
    },
  });

  console.log(`📊 Reservas encontradas sin HostTracking: ${reservasSinTracking.length}\n`);

  if (reservasSinTracking.length === 0) {
    console.log('✅ No hay reservas para restaurar');
    await prisma.$disconnect();
    return;
  }

  console.log('📋 DETALLE DE RESERVAS A RESTAURAR:\n');
  let totalPersonas = 0;
  
  for (const r of reservasSinTracking) {
    console.log(`• ${r.customerName} (${r.Promotor?.nombre || 'Sin promotor'})`);
    console.log(`  Fecha: ${new Date(r.reservedAt).toLocaleDateString('es-ES')}`);
    console.log(`  Personas: ${r.guestCount}`);
    console.log(`  Status: ${r.status}`);
    totalPersonas += r.guestCount;
  }

  console.log(`\n📈 Total personas a restaurar: ${totalPersonas}`);

  // Preguntar confirmación
  const confirmar = process.argv.includes('--confirmar');
  
  if (!confirmar) {
    console.log('\n⚠️  MODO SIMULACIÓN - No se crearon registros');
    console.log('   Revisa el resumen arriba y ejecuta con --confirmar para proceder:');
    console.log('   node restaurar-hosttracking-octubre.js --confirmar');
    await prisma.$disconnect();
    return;
  }

  // 2. Crear registros de HostTracking
  console.log('\n🔄 Creando registros de HostTracking...\n');
  
  let creados = 0;
  let errores = 0;

  for (const r of reservasSinTracking) {
    try {
      const { v4: uuidv4 } = await import('uuid');
      
      await prisma.hostTracking.create({
        data: {
          id: uuidv4(),
          businessId: r.businessId,
          reservationId: r.id,
          clienteId: r.clienteId || r.Cliente?.id || 'default-cliente-id',
          reservationName: r.customerName,
          tableNumber: r.tableNumber || null,
          reservationDate: r.reservedAt,
          guestCount: r.guestCount, // Asumimos que llegaron todos los esperados
          isActive: true,
          createdAt: r.checkedInAt || r.reservedAt,
          updatedAt: new Date(),
        },
      });

      creados++;
      console.log(`✅ ${r.customerName} - ${r.guestCount} personas`);
      
    } catch (error) {
      errores++;
      console.log(`❌ ${r.customerName} - Error: ${error.message}`);
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ Registros creados: ${creados}`);
  console.log(`❌ Errores: ${errores}`);
  console.log(`📈 Total personas restauradas: ${totalPersonas}`);
  console.log(`═══════════════════════════════════════`);

  await prisma.$disconnect();
}

restaurarHostTrackingOctubre().catch(console.error);
