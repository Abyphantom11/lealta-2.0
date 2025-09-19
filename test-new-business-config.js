const { createDefaultPortalConfig } = require('./src/lib/portal-config-utils.ts');

async function testNewBusiness() {
  console.log('🧪 PRUEBA: Crear portal-config para business nuevo');
  console.log('=================================================\n');
  
  // Usar el business "Café Central" que creamos
  const businessId = 'cafe-central';
  const businessName = 'Café Central';
  
  try {
    console.log(`📊 Creando portal config para: ${businessName} (${businessId})`);
    
    const { createDefaultPortalConfig } = await import('./src/lib/portal-config-utils.js');
    const config = await createDefaultPortalConfig(businessId, businessName);
    
    console.log('✅ Portal config creado exitosamente!');
    console.log(`📋 Nombre de empresa: ${config.nombreEmpresa}`);
    console.log(`🏷️ Business ID: ${config.settings?.businessId}`);
    
    // Verificar archivo
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    
    if (fs.existsSync(configPath)) {
      console.log('✅ Archivo creado en:', configPath);
      
      const fileContent = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(fileContent);
      
      console.log(`📝 Contenido verificado:`);
      console.log(`   📛 Nombre: ${fileConfig.nombreEmpresa}`);
      console.log(`   🎫 Tarjetas: ${fileConfig.tarjetas?.length || 0}`);
      console.log(`   🎁 Recompensas: ${fileConfig.rewards?.length || 0}`);
      console.log(`   📅 Creado: ${fileConfig.settings?.lastUpdated}`);
      
      if (fileConfig.nombreEmpresa === businessName) {
        console.log('🎯 ¡ÉXITO! Nombre personalizado correcto');
      } else {
        console.log('❌ Nombre incorrecto:', fileConfig.nombreEmpresa);
      }
      
    } else {
      console.log('❌ Archivo NO fue creado');
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error(error.stack);
  }
}

testNewBusiness();
