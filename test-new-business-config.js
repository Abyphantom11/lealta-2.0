// Test script para verificar la nueva función createDefaultPortalConfig
const { createDefaultPortalConfig } = require('./src/lib/portal-config-utils.ts');
const fs = require('fs');
const path = require('path');

async function testNewBusinessConfig() {
  try {
    const testBusinessId = 'test-new-business-' + Date.now();
    const testBusinessName = 'Negocio de Prueba';
    
    console.log('🧪 Testing new business config creation...');
    console.log(`📊 Business ID: ${testBusinessId}`);
    console.log(`🏢 Business Name: ${testBusinessName}`);
    
    // Crear configuración usando la nueva función
    const config = await createDefaultPortalConfig(testBusinessId, testBusinessName);
    
    console.log('\n✅ Config created successfully!');
    console.log(`📈 Tarjetas count: ${config.tarjetas?.length || 0}`);
    
    if (config.tarjetas) {
      console.log('\n🎯 Hierarchy check:');
      config.tarjetas.forEach((tarjeta, index) => {
        console.log(`  ${index + 1}. ${tarjeta.nivel}: ${tarjeta.condiciones.puntosMinimos} puntos (${tarjeta.textoCalidad})`);
      });
      
      // Verificar jerarquía
      const requiredLevels = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
      const foundLevels = config.tarjetas.map(t => t.nivel);
      const missingLevels = requiredLevels.filter(level => !foundLevels.includes(level));
      
      console.log(`\n🔍 Validation:`);
      console.log(`   Found levels: [${foundLevels.join(', ')}]`);
      console.log(`   Missing levels: [${missingLevels.join(', ')}]`);
      console.log(`   Hierarchy valid: ${missingLevels.length === 0 ? '✅ YES' : '❌ NO'}`);
      console.log(`   Structure: ${config.tarjetas[0].condiciones ? '✅ NEW FORMAT' : '❌ OLD FORMAT'}`);
    }
    
    // Limpiar archivo de prueba
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${testBusinessId}.json`);
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log(`\n🧹 Test file cleaned up: ${configPath}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNewBusinessConfig();
