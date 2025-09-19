async function testPortalConfigGeneration() {
  console.log('🧪 PRUEBA: Generación automática de portal-config');
  console.log('===============================================\n');
  
  const businessId = 'cmfqcyml10000ey3sh0kpo4th'; // Business "arepa"
  const expectedBusinessName = 'arepa';
  
  try {
    console.log(`📊 Probando generación para business: ${businessId}`);
    console.log(`📋 Nombre esperado: ${expectedBusinessName}`);
    
    // Hacer request al endpoint admin que DEBERÍA crear el archivo
    console.log('\n🔍 Haciendo request al endpoint admin...');
    const response = await fetch('http://localhost:3001/api/admin/portal-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Simular headers de autenticación - esto normalmente vendría de la sesión
        'Cookie': 'next-auth.session-token=mock-session'
      }
    });

    console.log(`📡 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Portal config obtenido exitosamente');
      console.log(`📋 Nombre en config: ${data.config?.nombreEmpresa}`);
      
      if (data.config?.nombreEmpresa === expectedBusinessName) {
        console.log('🎯 ¡ÉXITO! Portal config usa el nombre correcto del negocio');
      } else {
        console.log(`❌ Nombre incorrecto. Esperado: ${expectedBusinessName}, Recibido: ${data.config?.nombreEmpresa}`);
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Error en response:', response.status, errorData);
    }

    // Verificar si el archivo fue creado en el sistema de archivos
    console.log('\n📁 Verificando archivo en sistema...');
    const fs = require('fs');
    const configPath = `portal-config-${businessId}.json`;
    
    if (fs.existsSync(configPath)) {
      console.log('✅ Archivo portal-config creado en sistema');
      const fileContent = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`📝 Nombre en archivo: ${fileContent.nombreEmpresa}`);
      console.log(`🏷️ Business ID en settings: ${fileContent.settings?.businessId}`);
      
      if (fileContent.nombreEmpresa === expectedBusinessName) {
        console.log('🎯 ¡PERFECTO! Archivo tiene el nombre correcto');
      } else {
        console.log(`❌ Archivo tiene nombre incorrecto: ${fileContent.nombreEmpresa}`);
      }
    } else {
      console.log('❌ Archivo NO fue creado en el sistema');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
  
  console.log('\n🎉 PRUEBA COMPLETADA');
}

testPortalConfigGeneration();
