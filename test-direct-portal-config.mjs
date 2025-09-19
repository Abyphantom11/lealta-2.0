import { createDefaultPortalConfig } from './src/lib/portal-config-utils.js';

async function testDirectly() {
  console.log('🧪 PRUEBA DIRECTA: Portal Config Utils');
  console.log('=====================================\n');
  
  try {
    // Probar la función directamente
    const businessId = 'test-business-123';
    const businessName = 'Café de Prueba Real';
    
    console.log(`📊 Creando portal config para: ${businessName} (${businessId})`);
    
    const config = await createDefaultPortalConfig(businessId, businessName);
    
    console.log('✅ Portal config creado exitosamente!');
    console.log(`📋 Nombre de empresa: ${config.nombreEmpresa}`);
    console.log(`🏷️ Business ID: ${config.settings?.businessId}`);
    console.log(`📅 Fecha creación: ${config.settings?.lastUpdated}`);
    
    // Verificar archivo
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.join(process.cwd(), `portal-config-${businessId}.json`);
    
    if (fs.existsSync(configPath)) {
      console.log('✅ Archivo creado correctamente en:', configPath);
      
      // Leer y verificar contenido
      const fileContent = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(fileContent);
      
      if (fileConfig.nombreEmpresa === businessName) {
        console.log('🎯 ¡ÉXITO! Nombre personalizado correcto en archivo');
      } else {
        console.log('❌ Nombre en archivo incorrecto:', fileConfig.nombreEmpresa);
      }
      
      // Limpiar archivo de prueba
      fs.unlinkSync(configPath);
      console.log('🧹 Archivo de prueba eliminado');
      
    } else {
      console.log('❌ Archivo NO fue creado');
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testDirectly();
