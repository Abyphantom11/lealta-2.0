// Script para probar la API by-name
async function probarApiByName() {
  console.log('🧪 Probando API /api/businesses/by-name...\n');
  
  const baseUrl = 'http://localhost:3000';
  const businessName = 'casa-sabor-demo';
  
  try {
    console.log(`📡 Llamando: ${baseUrl}/api/businesses/by-name/${businessName}`);
    
    const response = await fetch(`${baseUrl}/api/businesses/by-name/${businessName}`);
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Status Text: ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta exitosa:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success && data.data?.id) {
        console.log(`\n🎯 ID del negocio: ${data.data.id}`);
        console.log(`🎯 Nombre del negocio: ${data.data.name}`);
        console.log(`🎯 Subdomain: ${data.data.subdomain}`);
      } else {
        console.log('⚠️ Estructura de respuesta inesperada');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error:');
      console.log(errorText);
    }
    
  } catch (error) {
    console.error('❌ Error de red:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 El servidor no está corriendo. Para probar:');
      console.log('   npm run dev');
      console.log('   Y luego ejecuta este script nuevamente');
    }
  }
}

// Función adicional para probar directamente con el ID conocido
async function probarConIdConocido() {
  console.log('\n🔍 Probando con ID conocido...\n');
  
  const baseUrl = 'http://localhost:3000';
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  
  try {
    console.log(`📡 Probando API admin con ID: ${businessId}`);
    
    const response = await fetch(`${baseUrl}/api/admin/portal-config?businessId=${businessId}`);
    
    console.log(`📊 Admin API Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ API admin responde correctamente');
    } else {
      const errorText = await response.text();
      console.log('❌ Error en API admin:');
      console.log(errorText);
    }
    
  } catch (error) {
    console.error('❌ Error probando API admin:', error.message);
  }
}

// Ejecutar ambas pruebas
probarApiByName().then(() => {
  return probarConIdConocido();
});
