// Script para probar el registro de cliente y debug
const fetch = require('node-fetch');

async function testClientRegistration() {
  try {
    console.log('🧪 Probando registro de cliente...\n');

    // Simular el registro como lo haría el frontend
    const registrationData = {
      cedula: 'test123',
      nombre: 'Cliente Test',
      telefono: '+1234567890',
      correo: 'test@test.com',
      businessId: 'yoyo' // Intentar con el slug directamente
    };

    console.log('📤 Enviando datos de registro:', registrationData);

    const response = await fetch('http://localhost:3000/api/cliente/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'referer': 'http://localhost:3000/yoyo/cliente/',
        'x-business-id': 'yoyo'
      },
      body: JSON.stringify(registrationData)
    });

    const result = await response.json();
    
    console.log('📥 Respuesta del servidor:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Registro exitoso!');
    } else {
      console.log('❌ Error en el registro:', result.error);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  testClientRegistration();
}

module.exports = { testClientRegistration };