// Verificar configuraciones migradas
const fs = require('fs');
const path = require('path');

const configDir = path.join(process.cwd(), 'config', 'portal');
const files = fs.readdirSync(configDir).filter(f => 
  f.startsWith('portal-config-') && 
  f.endsWith('.json') && 
  !f.includes('backup') &&
  f !== 'portal-config-.json'
);

console.log('🔍 Verificando configuraciones migradas...\n');

let totalConfigs = 0;
let validConfigs = 0;

files.forEach(file => {
  const businessId = file.replace('portal-config-', '').replace('.json', '');
  if (businessId) {
    totalConfigs++;
    const config = JSON.parse(fs.readFileSync(path.join(configDir, file), 'utf8'));
    const tarjetas = config.tarjetas || [];
    const foundLevels = tarjetas.map(t => t.nivel).filter(Boolean);
    const hasNewStructure = tarjetas.length > 0 && tarjetas[0].condiciones;
    const requiredLevels = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
    const missingLevels = requiredLevels.filter(level => !foundLevels.includes(level));
    const isValid = hasNewStructure && missingLevels.length === 0;
    
    if (isValid) validConfigs++;
    
    console.log(`📄 ${businessId}:`);
    console.log(`   Tarjetas: ${tarjetas.length}`);
    console.log(`   Niveles: [${foundLevels.join(', ')}]`);
    console.log(`   Estructura: ${hasNewStructure ? '✅ NUEVA' : '❌ ANTIGUA'}`);
    console.log(`   Jerarquía: ${missingLevels.length === 0 ? '✅ COMPLETA' : `❌ Faltan: ${missingLevels.join(', ')}`}`);
    console.log(`   Versión: ${config.version || 'N/A'}`);
    console.log(`   Estado: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    console.log('');
  }
});

console.log(`📊 Resumen Final:`);
console.log(`   Total configuraciones: ${totalConfigs}`);
console.log(`   Configuraciones válidas: ${validConfigs}`);
console.log(`   Tasa de éxito: ${Math.round((validConfigs / totalConfigs) * 100)}%`);
console.log(`   Estado: ${validConfigs === totalConfigs ? '✅ TODAS VÁLIDAS' : '⚠️ NECESITA REVISIÓN'}`);
