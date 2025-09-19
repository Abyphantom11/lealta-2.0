/**
 * Script de prueba para verificar acceso público a rutas cliente
 * Simula un dispositivo móvil sin cookies de sesión
 */

const baseUrl = 'http://localhost:3002'; // Cambiar puerto según necesidad
const businessId = 'arepa'; // Cambiar según tu business

async function testPublicAccess() {
  console.log('🧪 PROBANDO ACCESO PÚBLICO DESDE DISPOSITIVO DESAFILIADO\n');

  // Test 1: Portal Config API
  try {
    console.log('1️⃣ Probando /api/portal/config...');
    const configResponse = await fetch(`${baseUrl}/api/portal/config?businessId=${businessId}`);
    const configData = await configResponse.json();
    console.log(`✅ Portal Config: ${configResponse.status}`, configData.businessName || 'Sin nombre');
  } catch (error) {
    console.log(`❌ Portal Config Error:`, error.message);
  }

  // Test 2: Branding API
  try {
    console.log('2️⃣ Probando /api/branding...');
    const brandingResponse = await fetch(`${baseUrl}/api/branding?businessId=${businessId}`);
    const brandingData = await brandingResponse.json();
    console.log(`✅ Branding: ${brandingResponse.status}`, brandingData.businessName || 'Sin nombre');
  } catch (error) {
    console.log(`❌ Branding Error:`, error.message);
  }

  // Test 3: Cliente Registration API
  try {
    console.log('3️⃣ Probando /api/cliente/registro...');
    const registroResponse = await fetch(`${baseUrl}/api/cliente/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cedula: '12345678',
        nombre: 'Test Usuario',
        telefono: '3001234567',
        correo: 'test@test.com',
        businessId: businessId
      })
    });
    const registroData = await registroResponse.json();
    console.log(`✅ Cliente Registro: ${registroResponse.status}`, registroData.message || registroData.error);
  } catch (error) {
    console.log(`❌ Cliente Registro Error:`, error.message);
  }

  // Test 4: Ruta Cliente Frontend
  try {
    console.log('4️⃣ Probando ruta frontend /arepa/cliente...');
    const clienteResponse = await fetch(`${baseUrl}/${businessId}/cliente`);
    console.log(`✅ Ruta Cliente: ${clienteResponse.status}`);
  } catch (error) {
    console.log(`❌ Ruta Cliente Error:`, error.message);
  }

  console.log('\n🏁 Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testPublicAccess().catch(console.error);
}

module.exports = { testPublicAccess };
