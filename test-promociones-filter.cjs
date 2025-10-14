// Script para probar filtrado de promociones
const fs = require('fs');

const businessId = 'cmgf5px5f0000eyy0elci9yds';
const configPath = `config/portal/portal-config-${businessId}.json`;

console.log('🧪 Testing promociones filtering...');

try {
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const promociones = configData.promociones || [];
  
  console.log(`📋 Total promociones: ${promociones.length}`);
  
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const diaHoy = diasSemana[new Date().getDay()];
  
  console.log(`📅 Día actual: ${diaHoy}`);
  
  promociones.forEach((p, i) => {
    console.log(`  ${i+1}. "${p.titulo}" - Día: ${p.dia} - Activo: ${p.activo}`);
    
    if (p.dia === diaHoy && p.activo) {
      console.log(`    ✅ DEBE MOSTRARSE (coincide con ${diaHoy})`);
    } else if (p.dia !== diaHoy) {
      console.log(`    ❌ No se muestra (día ${p.dia} != ${diaHoy})`);
    } else if (!p.activo) {
      console.log(`    ❌ No se muestra (inactivo)`);
    }
  });
  
  const filtradas = promociones.filter(p => 
    p.activo !== false && p.dia === diaHoy
  );
  
  console.log(`\n🎯 Promociones que deberían mostrarse: ${filtradas.length}`);
  filtradas.forEach(p => {
    console.log(`  ✅ "${p.titulo}"`);
  });
  
} catch (error) {
  console.error('Error:', error);
}
