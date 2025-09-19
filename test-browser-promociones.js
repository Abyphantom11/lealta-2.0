// Test rápido para verificar el flujo promociones desde admin
console.log('🧪 Verificando flujo de promociones...');

// Simular lo que hace el admin panel cuando carga
async function testAdminPromocionesLoad() {
  try {
    console.log('📋 1. Cargando configuración desde admin endpoint...');
    
    // Esto simula la carga inicial del admin panel
    const response = await fetch('/api/admin/portal-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Incluir cookies de sesión
    });
    
    if (!response.ok) {
      console.error('❌ Error al cargar desde admin:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Admin response OK');
    console.log(`📊 Promociones en admin: ${data.promociones?.length || 0}`);
    
    if (data.promociones && data.promociones.length > 0) {
      console.log('🎯 Promociones encontradas:');
      data.promociones.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.titulo} (${p.descuento || 'sin descuento'})`);
      });
    }
    
    // Ahora verificar en cliente
    console.log('\n📋 2. Verificando en cliente...');
    const clientResponse = await fetch('/api/portal/config-v2', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!clientResponse.ok) {
      console.error('❌ Error al cargar desde cliente:', clientResponse.status);
      return;
    }
    
    const clientData = await clientResponse.json();
    console.log('✅ Cliente response OK');
    console.log(`📊 Promociones en cliente: ${clientData.promotions?.length || 0}`);
    
    if (clientData.promotions && clientData.promotions.length > 0) {
      console.log('🎯 Promociones en cliente:');
      clientData.promotions.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} (${p.discount || 'sin descuento'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Solo ejecutar si estamos en el navegador
if (typeof window !== 'undefined') {
  testAdminPromocionesLoad();
}
