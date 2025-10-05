// Test para verificar la actualización de promotor en reservas
const businessId = 'golom';

async function testPromotorUpdate() {
  console.log('🧪 Iniciando test de actualización de promotor...\n');

  try {
    // 1. Obtener promotores disponibles
    console.log('1️⃣ Obteniendo promotores disponibles...');
    const promotoresRes = await fetch(`http://localhost:3001/api/promotores?businessId=${businessId}&activo=true`);
    const promotoresData = await promotoresRes.json();
    console.log(`✅ Promotores encontrados: ${promotoresData.promotores.length}`);
    promotoresData.promotores.forEach(p => {
      console.log(`   - ${p.nombre} (ID: ${p.id})`);
    });

    if (promotoresData.promotores.length === 0) {
      console.error('❌ No hay promotores disponibles para el test');
      return;
    }

    // 2. Obtener reservas
    console.log('\n2️⃣ Obteniendo reservas...');
    const reservasRes = await fetch(`http://localhost:3001/api/reservas?businessId=${businessId}`);
    const reservasData = await reservasRes.json();
    console.log(`✅ Reservas encontradas: ${reservasData.reservas.length}`);

    if (reservasData.reservas.length === 0) {
      console.error('❌ No hay reservas para actualizar');
      return;
    }

    const primeraReserva = reservasData.reservas[0];
    console.log(`   Reserva a actualizar: ${primeraReserva.id}`);
    console.log(`   Cliente: ${primeraReserva.cliente.nombre}`);
    console.log(`   Promotor actual: ${primeraReserva.promotor?.nombre || 'Sin promotor'}`);

    // 3. Actualizar promotor
    const nuevoPromotor = promotoresData.promotores[0];
    console.log(`\n3️⃣ Actualizando promotor a: ${nuevoPromotor.nombre} (${nuevoPromotor.id})...`);
    
    const updateRes = await fetch(
      `http://localhost:3001/api/reservas/${primeraReserva.id}?businessId=${businessId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promotor: {
            id: nuevoPromotor.id,
            nombre: nuevoPromotor.nombre
          }
        })
      }
    );

    if (!updateRes.ok) {
      const error = await updateRes.json();
      console.error('❌ Error al actualizar:', error);
      return;
    }

    const updateData = await updateRes.json();
    console.log('✅ Actualización exitosa!');
    console.log(`   Nuevo promotor asignado: ${updateData.reserva.promotor?.nombre || 'ERROR'}`);

    // 4. Verificar actualización
    console.log('\n4️⃣ Verificando actualización...');
    const verificarRes = await fetch(`http://localhost:3001/api/reservas?businessId=${businessId}`);
    const verificarData = await verificarRes.json();
    const reservaActualizada = verificarData.reservas.find(r => r.id === primeraReserva.id);
    
    if (reservaActualizada.promotor?.id === nuevoPromotor.id) {
      console.log('✅ Verificación exitosa! El promotor se actualizó correctamente');
      console.log(`   Promotor final: ${reservaActualizada.promotor.nombre} (${reservaActualizada.promotor.id})`);
    } else {
      console.error('❌ ERROR: El promotor no se actualizó correctamente');
      console.log(`   Esperado: ${nuevoPromotor.id}`);
      console.log(`   Actual: ${reservaActualizada.promotor?.id || 'null'}`);
    }

    console.log('\n✅ Test completado exitosamente!');

  } catch (error) {
    console.error('\n❌ Error durante el test:', error);
    process.exit(1);
  }
}

testPromotorUpdate();
