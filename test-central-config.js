// Test script para verificar configuración central
const path = require('path');
const fs = require('fs');

async function testCentralConfig() {
  try {
    // Simular la lógica de getTarjetasConfigCentral
    const businessId = 'cmfuhipwk0000eyrokxk7n89d';
    
    // Intentar leer archivo específico
    const specificPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    const defaultPath = path.join(process.cwd(), 'portal-config.json');
    
    let configPath = defaultPath;
    let source = 'default';
    
    if (fs.existsSync(specificPath)) {
      configPath = specificPath;
      source = 'specific';
    }
    
    console.log(`📂 Reading config from: ${configPath} (${source})`);
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    console.log(`📊 Found ${config.tarjetas?.length || 0} tarjetas`);
    
    if (config.tarjetas) {
      config.tarjetas.forEach((tarjeta, index) => {
        console.log(`  ${index + 1}. ${tarjeta.nivel || tarjeta.nombre}: ${tarjeta.condiciones?.puntosMinimos || tarjeta.puntosRequeridos || 'N/A'} puntos`);
      });
    }
    
    // Verificar jerarquía
    const requiredLevels = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
    const foundLevels = config.tarjetas?.map(t => t.nivel).filter(Boolean) || [];
    const missingLevels = requiredLevels.filter(level => !foundLevels.includes(level));
    
    console.log(`\n🔍 Hierarchy check:`);
    console.log(`   Found levels: [${foundLevels.join(', ')}]`);
    console.log(`   Missing levels: [${missingLevels.join(', ')}]`);
    console.log(`   Hierarchy valid: ${missingLevels.length === 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCentralConfig();
