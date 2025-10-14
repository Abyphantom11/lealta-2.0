// Simular el comportamiento de AdminV2Page.tsx
async function simularAdminV2() {
  console.log('🎭 Simulando comportamiento de AdminV2Page...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // 1. Simular getCurrentBusinessFromUrl()
  const businessNameFromUrl = 'casa-sabor-demo'; // Lo que extraería de la URL
  console.log(`🌐 BusinessName desde URL: ${businessNameFromUrl}`);
  
  // 2. Simular getBusinessIdFromName()
  console.log('\n📡 Paso 1: Convertir businessName a businessId...');
  
  try {
    const response = await fetch(`${baseUrl}/api/businesses/by-name/${encodeURIComponent(businessNameFromUrl)}`);
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   Respuesta recibida:', JSON.stringify(data, null, 2));
      
      // Esto es lo que está haciendo AdminV2Page después del fix
      const businessId = data.data?.id || null;
      
      if (businessId) {
        console.log(`✅ ID obtenido: ${businessId}`);
        
        // 3. Simular validateBusinessAccess()
        console.log('\n🔐 Paso 2: Validar acceso al negocio...');
        
        const validateResponse = await fetch(`${baseUrl}/api/businesses/${businessId}/validate`);
        console.log(`   Validación Status: ${validateResponse.status}`);
        
        if (validateResponse.ok) {
          console.log('✅ Acceso validado correctamente');
          
          // 4. Probar cargar configuración del portal
          console.log('\n⚙️ Paso 3: Cargar configuración del portal...');
          
          const configResponse = await fetch(`${baseUrl}/api/admin/portal-config?businessId=${businessId}`);
          console.log(`   Config Status: ${configResponse.status}`);
          
          if (configResponse.ok) {
            console.log('✅ Configuración cargada correctamente');
            console.log('\n🎉 ÉXITO: Todos los pasos funcionan correctamente');
            console.log('   AdminV2Page debería funcionar ahora');
          } else {
            const configError = await configResponse.text();
            console.log('❌ Error cargando configuración:');
            console.log(configError);
          }
        } else {
          const validateError = await validateResponse.text();
          console.log('❌ Error validando acceso:');
          console.log(validateError);
        }
      } else {
        console.log('❌ No se pudo obtener el businessId');
        console.log('   Estructura de respuesta:', data);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error en API by-name:');
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

simularAdminV2();
