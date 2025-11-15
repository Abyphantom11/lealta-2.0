const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corregirEstados() {
  console.log('🔄 Corrigiendo estados de reservas de octubre según guestCount actual...\n');
  
  const business = await prisma.business.findFirst({
    where: {
      name: {
        contains: 'Love Me',
        mode: 'insensitive'
      }
    }
  });

  if (!business) {
    console.log('❌ No se encontró el negocio');
    return;
  }

  console.log(`✅ Negocio: ${business.name}\n`);

  // Obtener todas las reservas de octubre
  const reservas = await prisma.reservation.findMany({
    where: {
      businessId: business.id,
      reservedAt: {
        gte: new Date('2025-10-01T00:00:00Z'),
        lte: new Date('2025-10-31T23:59:59Z')
      }
    },
    orderBy: {
      reservedAt: 'asc'
    }
  });

  console.log(`📊 Total reservas octubre: ${reservas.length}\n`);

  let conAsistencia = 0;
  let sinAsistencia = 0;
  let actualizadas = 0;

  for (const reserva of reservas) {
    const guestCount = reserva.guestCount || 0;
    let nuevoEstado;
    let cambio = false;

    if (guestCount > 0) {
      nuevoEstado = 'CHECKED_IN';
      if (reserva.status !== 'CHECKED_IN') {
        cambio = true;
      }
      conAsistencia++;
    } else {
      nuevoEstado = 'NO_SHOW';
      if (reserva.status !== 'NO_SHOW') {
        cambio = true;
      }
      sinAsistencia++;
    }

    if (cambio) {
      await prisma.reservation.update({
        where: { id: reserva.id },
        data: { status: nuevoEstado }
      });
      
      console.log(`🔄 ${reserva.customerName}: guestCount=${guestCount}, ${reserva.status} → ${nuevoEstado}`);
      actualizadas++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(60));
  console.log(`Total reservas: ${reservas.length}`);
  console.log(`✅ Con asistencia (CHECKED_IN): ${conAsistencia}`);
  console.log(`❌ Sin asistencia (NO_SHOW): ${sinAsistencia}`);
  console.log(`🔄 Actualizadas: ${actualizadas}`);
  console.log('='.repeat(60));
}

corregirEstados()
  .then(() => {
    console.log('\n✨ Proceso completado!');
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
