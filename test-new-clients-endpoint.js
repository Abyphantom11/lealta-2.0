/**
 * Test del nuevo endpoint /api/admin/clients/lista
 * que usa el middleware withAuth robusto
 */

async function testNewClientesEndpoint() {
    try {
        console.log('🧪 TESTING NEW ENDPOINT: /api/admin/clients/lista\n');
        
        const response = await fetch('http://localhost:3001/api/admin/clients/lista', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Response Status:', response.status);
        
        const data = await response.json();
        console.log('\n📋 Response Data:', JSON.stringify(data, null, 2));
        
        if (response.status === 401) {
            console.log('\n🔐 EXPECTED: Endpoint requires authentication');
            console.log('✅ Security working correctly - no anonymous access');
        } else if (data.success) {
            console.log(`\n✅ SUCCESS: Found ${data.totalCount} clientes`);
        }
        
    } catch (error) {
        console.error('❌ Error testing endpoint:', error);
    }
}

testNewClientesEndpoint();
