const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPromotorReferences() {
  try {
    console.log('🔍 Verificando referencias de promotorId...\n');

    // 1. Obtener todas las reservas con promotorId no nulo
    const reservasConPromotor = await prisma.reservation.findMany({
      where: {
        promotorId: {
          not: null
        }
      },
      select: {
        id: true,
        promotorId: true,
        reservationNumber: true
      }
    });

    console.log(`📊 Total de reservas con promotorId: ${reservasConPromotor.length}`);

    // 2. Obtener todos los IDs de promotores válidos
    const promotoresValidos = await prisma.promotor.findMany({
      select: {
        id: true,
        nombre: true
      }
    });

    const promotorIdsValidos = new Set(promotoresValidos.map(p => p.id));
    console.log(`✅ Total de promotores válidos: ${promotoresValidos.length}`);
    console.log('   Promotores:');
    promotoresValidos.forEach(p => {
      console.log(`   - ${p.nombre} (${p.id})`);
    });

    // 3. Encontrar reservas con promotorId inválido
    const reservasInvalidas = reservasConPromotor.filter(r => 
      !promotorIdsValidos.has(r.promotorId)
    );

    if (reservasInvalidas.length === 0) {
      console.log('\n✅ ¡Todas las referencias de promotorId son válidas!');
      return;
    }

    console.log(`\n⚠️  Encontradas ${reservasInvalidas.length} reservas con promotorId inválido:`);
    reservasInvalidas.forEach(r => {
      console.log(`   - Reserva ${r.reservationNumber}: promotorId = ${r.promotorId}`);
    });

    // 4. Verificar si existe un promotor por defecto
    let promotorDefault = await prisma.promotor.findFirst({
      where: {
        OR: [
          { nombre: { contains: 'WhatsApp', mode: 'insensitive' } },
          { nombre: { contains: 'Sistema', mode: 'insensitive' } },
          { nombre: { contains: 'Default', mode: 'insensitive' } }
        ]
      }
    });

    // 5. Si no existe, usar el primer promotor disponible o crear uno
    if (!promotorDefault && promotoresValidos.length > 0) {
      promotorDefault = promotoresValidos[0];
      console.log(`\n📌 Usando promotor existente como default: ${promotorDefault.nombre}`);
    } else if (!promotorDefault) {
      // Crear un promotor por defecto
      const business = await prisma.business.findFirst();
      if (!business) {
        console.error('❌ No se encontró ningún business para crear el promotor');
        return;
      }

      promotorDefault = await prisma.promotor.create({
        data: {
          nombre: 'Sistema - WhatsApp',
          telefono: '+57 000 000 0000',
          businessId: business.id
        }
      });
      console.log(`\n✨ Promotor por defecto creado: ${promotorDefault.nombre}`);
    } else {
      console.log(`\n✅ Promotor por defecto encontrado: ${promotorDefault.nombre}`);
    }

    // 6. Actualizar las reservas inválidas
    console.log(`\n🔧 Actualizando ${reservasInvalidas.length} reservas...`);
    
    for (const reserva of reservasInvalidas) {
      await prisma.reservation.update({
        where: { id: reserva.id },
        data: { promotorId: promotorDefault.id }
      });
      console.log(`   ✓ Actualizada reserva ${reserva.reservationNumber}`);
    }

    console.log(`\n✅ ¡Corrección completada! ${reservasInvalidas.length} reservas actualizadas.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPromotorReferences();
