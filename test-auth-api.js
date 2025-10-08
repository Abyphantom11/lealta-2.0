/**
 * Script para probar la autenticación de la API de clientes
 * Simula una llamada autenticada
 */

const businessId = 'cmgf5px5f0000eyy0elci9yds';

// Test básico - sin autenticación
fetch(`http://localhost:3001/api/cliente/lista?businessId=${businessId}`)
  .then(res => {
    console.log('📊 Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    if (data.clientes) {
      console.log(`\n✅ ${data.clientes.length} clientes encontrados`);
      data.clientes.slice(0, 3).forEach(c => {
        console.log(`  - ${c.nombre} (${c.cedula}) - ${c.puntos} pts`);
      });
    }
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });
