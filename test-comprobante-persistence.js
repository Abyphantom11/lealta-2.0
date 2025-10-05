/**
 * Test de persistencia del comprobante
 */

const BASE_URL = 'http://localhost:3001';
const SUBDOMAIN = 'golom';

async function testComprobantePersistence() {
  console.log('\n🧪 === TEST: PERSISTENCIA DEL COMPROBANTE ===\n');

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Host': `${SUBDOMAIN}.localhost:3001`
    };

    // 1. Obtener lista de reservas para encontrar una con comprobante
    console.log('1️⃣ Obteniendo reservas...');
    const listResponse = await fetch(`${BASE_URL}/api/reservas?businessId=${SUBDOMAIN}`, {
      headers: { 'Host': `${SUBDOMAIN}.localhost:3001` }
    });

    if (!listResponse.ok) {
      throw new Error('Error al obtener reservas');
    }

    const listData = await listResponse.json();
    const reservas = listData.reservas || [];
    
    console.log(`📊 Total de reservas: ${reservas.length}`);
    
    // Buscar una reserva con comprobante
    const reservaConComprobante = reservas.find(r => r.comprobanteSubido || r.comprobanteUrl);
    
    if (reservaConComprobante) {
      console.log('\n✅ Reserva con comprobante encontrada:');
      console.log({
        id: reservaConComprobante.id,
        cliente: reservaConComprobante.cliente.nombre,
        comprobanteSubido: reservaConComprobante.comprobanteSubido,
        comprobanteUrl: reservaConComprobante.comprobanteUrl?.substring(0, 50) + '...'
      });

      // 2. Hacer GET individual para verificar
      console.log('\n2️⃣ Verificando GET individual...');
      const getResponse = await fetch(
        `${BASE_URL}/api/reservas/${reservaConComprobante.id}?businessId=${SUBDOMAIN}`,
        { headers: { 'Host': `${SUBDOMAIN}.localhost:3001` } }
      );

      if (getResponse.ok) {
        const reservaIndividual = await getResponse.json();
        console.log('✅ GET individual:');
        console.log({
          id: reservaIndividual.id,
          comprobanteSubido: reservaIndividual.comprobanteSubido,
          comprobanteUrl: reservaIndividual.comprobanteUrl?.substring(0, 50) + '...'
        });
      }
    } else {
      console.log('\n⚠️  No se encontró ninguna reserva con comprobante subido');
      console.log('   Sube un comprobante primero desde la interfaz y vuelve a ejecutar este test');
    }

    // 3. Verificar estructura de todas las reservas
    console.log('\n3️⃣ Verificando estructura de respuesta...');
    const primeraReserva = reservas[0];
    if (primeraReserva) {
      console.log('📋 Campos de reserva:');
      console.log({
        tieneComprobanteSubido: 'comprobanteSubido' in primeraReserva,
        tieneComprobanteUrl: 'comprobanteUrl' in primeraReserva,
        valorComprobanteSubido: primeraReserva.comprobanteSubido,
        valorComprobanteUrl: primeraReserva.comprobanteUrl
      });
    }

    console.log('\n✅ === TEST COMPLETADO ===');

  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error.message);
    console.error(error);
  }
}

// Ejecutar test
testComprobantePersistence();
