// Test SuperAdmin API endpoints
const fetch = require('node-fetch');

async function testAPI() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🔍 Testing SuperAdmin API endpoints...\n');
  
  // Test estadísticas endpoint
  try {
    console.log('Testing /api/admin/estadisticas...');
    const response = await fetch(`${baseURL}/api/admin/estadisticas`);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.text();
      console.log('Response:', data.substring(0, 200) + '...');
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
    console.log('');
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('');
  }
  
  // Test historial specific client
  try {
    console.log('Testing /api/admin/clientes/1762075776/historial...');
    const response = await fetch(`${baseURL}/api/admin/clientes/1762075776/historial`);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.text();
      console.log('Response:', data.substring(0, 200) + '...');
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
    console.log('');
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('');
  }
}

testAPI();
