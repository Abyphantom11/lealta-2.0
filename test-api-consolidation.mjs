// Script para verificar que las APIs consolidadas funcionan correctamente
import fetch from 'node-fetch';

const TEST_BUSINESS_ID = 'cmfnkcc1f0000eyj0dq0lcjji'; // Business ID de ejemplo

async function testApiEndpoints() {
  console.log('🧪 TESTING APIs consolidadas...');
  console.log('='.repeat(50));

  const tests = [
    {
      name: 'Portal Config API',
      url: `/api/admin/portal-config?businessId=${TEST_BUSINESS_ID}`,
      expectedStatus: 200
    },
    {
      name: 'Menu Productos API', 
      url: `/api/admin/menu/productos?businessId=${TEST_BUSINESS_ID}`,
      expectedStatus: 200
    },
    {
      name: 'QR Scan API (POST)',
      url: '/api/reservas/qr-scan',
      method: 'POST',
      body: { qrCode: 'test-qr-code', businessId: TEST_BUSINESS_ID },
      expectedStatus: [400, 404] // 400 es OK porque el QR no existe
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`📡 URL: ${test.url}`);
      
      const options = {
        method: test.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(`http://localhost:3001${test.url}`, options);
      const statusCode = response.status;
      
      if (Array.isArray(test.expectedStatus)) {
        const isExpected = test.expectedStatus.includes(statusCode);
        console.log(`📊 Status: ${statusCode} ${isExpected ? '✅' : '❌'}`);
        if (!isExpected) {
          console.log(`❌ Expected: ${test.expectedStatus.join(' or ')}, Got: ${statusCode}`);
        }
      } else {
        const isExpected = statusCode === test.expectedStatus;
        console.log(`📊 Status: ${statusCode} ${isExpected ? '✅' : '❌'}`);
        if (!isExpected) {
          console.log(`❌ Expected: ${test.expectedStatus}, Got: ${statusCode}`);
        }
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`📦 Response type: ${typeof data}`);
        if (data.success !== undefined) {
          console.log(`🎯 Success: ${data.success}`);
        }
      } else {
        const text = await response.text();
        console.log(`⚠️  Error response: ${text.substring(0, 100)}...`);
      }

    } catch (error) {
      console.log(`❌ Error testing ${test.name}:`, error.message);
    }
  }

  console.log('\n🎯 RESUMEN:');
  console.log('- Portal Config: Debe devolver configuración del portal');
  console.log('- Menu Productos: Debe devolver lista de productos'); 
  console.log('- QR Scan: Debe manejar códigos QR correctamente');
  console.log('\n✅ Test completado');
}

testApiEndpoints().catch(console.error);
