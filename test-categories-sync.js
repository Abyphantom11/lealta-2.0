// Test para verificar el fix de categorías en el cliente
const testCategoriesSync = async () => {
  console.log('🔧 === TEST DE SINCRONIZACIÓN DE CATEGORÍAS ===\n');
  
  const businessSlug = 'arepa'; // Business slug usado en las screenshots
  
  try {
    // 1. Verificar que el business existe
    console.log('1. 🔍 Verificando business...');
    const businessResponse = await fetch(`http://localhost:3001/api/businesses/${businessSlug}/validate`);
    
    if (!businessResponse.ok) {
      console.log('❌ Business no encontrado');
      return;
    }
    
    const businessData = await businessResponse.json();
    console.log(`✅ Business encontrado: ${businessData.name} (ID: ${businessData.id})\n`);
    
    // 2. Verificar categorías desde admin
    console.log('2. 📋 Verificando categorías desde admin...');
    const adminResponse = await fetch('http://localhost:3001/api/admin/menu', {
      headers: {
        'x-business-id': businessData.id
      }
    });
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log(`✅ Admin categorías: ${adminData.menu?.length || 0} encontradas`);
      if (adminData.menu) {
        adminData.menu.forEach(cat => {
          console.log(`   - ${cat.nombre} (${cat.productos?.length || 0} productos)`);
        });
      }
    } else {
      console.log('❌ Error obteniendo categorías desde admin');
    }
    console.log('');
    
    // 3. Verificar categorías desde cliente
    console.log('3. 🍽️ Verificando categorías desde cliente...');
    const clientResponse = await fetch('http://localhost:3001/api/menu/categorias', {
      headers: {
        'x-business-id': businessData.id
      }
    });
    
    if (clientResponse.ok) {
      const clientData = await clientResponse.json();
      console.log(`✅ Cliente categorías: ${clientData.length} encontradas`);
      clientData.forEach(cat => {
        console.log(`   - ${cat.nombre} (activo: ${cat.activo})`);
      });
    } else {
      console.log('❌ Error obteniendo categorías desde cliente');
      console.log('Status:', clientResponse.status);
      const errorText = await clientResponse.text();
      console.log('Error:', errorText);
    }
    console.log('');
    
    // 4. Test sin businessId (debería fallar)
    console.log('4. 🚫 Test sin businessId (debería fallar)...');
    const noBusinessResponse = await fetch('http://localhost:3001/api/menu/categorias');
    console.log(`Status sin businessId: ${noBusinessResponse.status}`);
    
    if (!noBusinessResponse.ok) {
      const errorData = await noBusinessResponse.text();
      console.log('✅ Correcto: Falla sin businessId:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
};

// Ejecutar el test
testCategoriesSync();
