// Script de prueba para verificar autenticación de cliente
const fetch = require('node-fetch');

async function testClientAuth() {
  console.log('🧪 Testing client authentication...');
  
  try {
    // 1. Primero obtener el business ID real desde el slug "arepa"
    console.log('\n1. 📍 Getting business ID from slug "arepa"...');
    const businessResponse = await fetch('http://localhost:3001/api/businesses/arepa/validate');
    
    if (!businessResponse.ok) {
      console.error('❌ Failed to validate business:', businessResponse.status);
      return;
    }
    
    const businessData = await businessResponse.json();
    console.log('✅ Business data:', businessData);
    
    // 2. Probar verificación de cliente con business ID real
    console.log('\n2. 🔍 Testing client verification...');
    const clientResponse = await fetch('http://localhost:3001/api/cliente/verificar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessData.id // Usar el ID real, no el slug
      },
      body: JSON.stringify({
        cedula: '1727328734', // Cédula de jose
        businessId: businessData.id
      })
    });
    
    const clientData = await clientResponse.json();
    console.log('📋 Client verification response:', clientData);
    
    if (clientResponse.ok && clientData.existe) {
      console.log('✅ SUCCESS: Client found!', clientData.cliente.nombre);
    } else {
      console.log('❌ FAILED: Client not found or error:', clientData);
    }
    
    // 3. Probar con la otra cédula (la que aparece en la captura)
    console.log('\n3. 🔍 Testing second client...');
    const client2Response = await fetch('http://localhost:3001/api/cliente/verificar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessData.id
      },
      body: JSON.stringify({
        cedula: '1762075776', // Cédula de abraham según la captura
        businessId: businessData.id
      })
    });
    
    const client2Data = await client2Response.json();
    console.log('📋 Second client verification response:', client2Data);
    
    if (client2Response.ok && client2Data.existe) {
      console.log('✅ SUCCESS: Second client found!', client2Data.cliente.nombre);
    } else {
      console.log('❌ FAILED: Second client not found. Let\'s try a different approach...');
      
      // 4. Listar todos los clientes del business para ver qué hay
      console.log('\n4. 📋 Listing all clients in business...');
      const allClientsResponse = await fetch(`http://localhost:3001/api/admin/clients/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': businessData.id
        },
        body: JSON.stringify({
          query: '',
          businessId: businessData.id
        })
      });
      
      if (allClientsResponse.ok) {
        const allClients = await allClientsResponse.json();
        console.log('📋 All clients in business:', allClients);
      } else {
        console.log('❌ Failed to list clients:', allClientsResponse.status);
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

testClientAuth();
