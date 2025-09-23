/**
 * Test directo de la API de clientes para el business arepa
 */

async function testClientesAPI() {
    try {
        console.log('🧪 TESTING API: /api/cliente/lista\n');
        
        // Business ID de arepa
        const businessId = 'cmfw0fujf0000eyv8eyhgfzja';
        
        // Test con businessId como query parameter
        const url = `http://localhost:3001/api/cliente/lista?businessId=${businessId}`;
        console.log('📞 Llamando:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-business-id': businessId,
                // Simular referer desde el admin de arepa
                'referer': 'http://localhost:3001/arepa/admin'
            }
        });
        
        console.log('📊 Response Status:', response.status);
        console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Response:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log('\n✅ Response Data:', JSON.stringify(data, null, 2));
        
        if (data.success && data.clientes) {
            console.log(`\n📋 CLIENTES ENCONTRADOS: ${data.clientes.length}`);
            data.clientes.forEach((cliente, index) => {
                console.log(`\n  Cliente ${index + 1}:`);
                console.log(`    ID: ${cliente.id}`);
                console.log(`    Nombre: ${cliente.nombre}`);
                console.log(`    Cédula: ${cliente.cedula}`);
                console.log(`    Email: ${cliente.correo}`);
                console.log(`    Puntos: ${cliente.puntos}`);
                console.log(`    Visitas: ${cliente.totalVisitas}`);
                console.log(`    Business ID: ${cliente.businessId}`);
                console.log(`    Tarjeta: ${cliente.tarjetaLealtad?.nivel || 'Sin tarjeta'}`);
                console.log(`    Registrado: ${cliente.registeredAt || 'No definido'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error en test API:', error);
    }
}

testClientesAPI();
