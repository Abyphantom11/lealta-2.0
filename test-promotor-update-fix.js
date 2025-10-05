// Test de actualización de promotor en reserva
const businessId = 'golom';

async function testPromotorUpdate() {
  console.log('🧪 Test de Actualización de Promotor\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Obtener reservas
    console.log('1️⃣ Obteniendo reservas...');
    const reservasRes = await fetch(`http://localhost:3001/api/reservas?businessId=${businessId}`);
    if (!reservasRes.ok) {
      throw new Error(`Error al obtener reservas: ${reservasRes.status}`);
    }
    const reservasData = await reservasRes.json();
    
    if (reservasData.reservas.length === 0) {
      console.error('❌ No hay reservas para probar');
      return;
    }

    const reserva = reservasData.reservas[0];
    console.log(`✅ Reserva obtenida: ${reserva.id}`);
    console.log(`   Cliente: ${reserva.cliente.nombre}`);
    console.log(`   Promotor actual: ${reserva.promotor?.nombre || 'Sin promotor'} (ID: ${reserva.promotor?.id || 'null'})\n`);

    // 2. Obtener promotores
    console.log('2️⃣ Obteniendo promotores disponibles...');
    const promotoresRes = await fetch(`http://localhost:3001/api/promotores?businessId=${businessId}&activo=true`);
    if (!promotoresRes.ok) {
      throw new Error(`Error al obtener promotores: ${promotoresRes.status}`);
    }
    const promotoresData = await promotoresRes.json();
    
    if (promotoresData.promotores.length === 0) {
      console.error('❌ No hay promotores disponibles');
      return;
    }

    console.log(`✅ Promotores disponibles: ${promotoresData.promotores.length}`);
    promotoresData.promotores.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.nombre} (ID: ${p.id})`);
    });

    // Seleccionar un promotor diferente al actual
    const nuevoPromotor = promotoresData.promotores.find(p => p.id !== reserva.promotor?.id) 
      || promotoresData.promotores[0];
    
    console.log(`\n3️⃣ Actualizando a promotor: ${nuevoPromotor.nombre} (${nuevoPromotor.id})...`);

    // 3. Actualizar reserva con nuevo promotor
    const updateRes = await fetch(
      `http://localhost:3001/api/reservas/${reserva.id}?businessId=${businessId}`,
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
      const errorData = await updateRes.json();
      console.error('❌ Error al actualizar:', errorData);
      console.error(`   Status: ${updateRes.status}`);
      console.error(`   Error: ${errorData.error || 'Unknown error'}`);
      return;
    }

    const updateData = await updateRes.json();
    console.log('✅ Actualización exitosa!');
    console.log(`   Promotor actualizado: ${updateData.reserva.promotor?.nombre || 'ERROR'}`);
    console.log(`   Promotor ID: ${updateData.reserva.promotor?.id || 'ERROR'}\n`);

    // 4. Verificar actualización
    console.log('4️⃣ Verificando actualización...');
    const verificarRes = await fetch(`http://localhost:3001/api/reservas?businessId=${businessId}`);
    const verificarData = await verificarRes.json();
    const reservaActualizada = verificarData.reservas.find(r => r.id === reserva.id);
    
    if (reservaActualizada.promotor?.id === nuevoPromotor.id) {
      console.log('✅ ¡ÉXITO! El promotor se actualizó correctamente en la base de datos');
      console.log(`   Promotor en BD: ${reservaActualizada.promotor.nombre} (${reservaActualizada.promotor.id})\n`);
    } else {
      console.error('❌ ERROR: El promotor NO se actualizó en la base de datos');
      console.log(`   Esperado: ${nuevoPromotor.id}`);
      console.log(`   Actual: ${reservaActualizada.promotor?.id || 'null'}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Test completado\n');

  } catch (error) {
    console.error('\n❌ Error durante el test:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar test
testPromotorUpdate();
