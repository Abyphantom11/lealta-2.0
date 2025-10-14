// Test completo de filtrado por día para todos los componentes
const fs = require('fs');

const businessId = 'cmgf5px5f0000eyy0elci9yds';
const configPath = `config/portal/portal-config-${businessId}.json`;

console.log('🧪 TEST COMPLETO: Filtrado por día (domingo)');
console.log('='.repeat(50));

try {
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const diaHoy = diasSemana[new Date().getDay()];
  
  console.log(`📅 Día actual: ${diaHoy}\n`);
  
  // 1. BANNERS
  console.log('1️⃣ BANNERS:');
  const banners = configData.banners || [];
  console.log(`   Total: ${banners.length}`);
  const bannersHoy = banners.filter(b => b.activo !== false && (b.dia === diaHoy || !b.dia));
  console.log(`   Para ${diaHoy}: ${bannersHoy.length}`);
  bannersHoy.forEach(b => console.log(`   ✅ "${b.titulo}"`));
  
  // 2. PROMOCIONES
  console.log('\n2️⃣ PROMOCIONES:');
  const promociones = configData.promociones || [];
  console.log(`   Total: ${promociones.length}`);
  const promocionesHoy = promociones.filter(p => p.activo !== false && p.dia === diaHoy);
  console.log(`   Para ${diaHoy}: ${promocionesHoy.length}`);
  promocionesHoy.forEach(p => console.log(`   ✅ "${p.titulo}"`));
  
  // 3. FAVORITO DEL DÍA
  console.log('\n3️⃣ FAVORITO DEL DÍA:');
  const favoritoDelDia = configData.favoritoDelDia || {};
  if (typeof favoritoDelDia === 'object' && !Array.isArray(favoritoDelDia)) {
    const favoritoHoy = favoritoDelDia[diaHoy];
    console.log(`   Para ${diaHoy}: ${favoritoHoy ? '1' : '0'}`);
    if (favoritoHoy) {
      console.log(`   ✅ "${favoritoHoy.title || 'Sin título'}"`);
    }
  } else {
    console.log('   Formato array (no implementado aún)');
  }
  
  console.log('\n🎯 RESUMEN:');
  console.log(`   ${bannersHoy.length} banners + ${promocionesHoy.length} promociones + ${favoritoDelDia[diaHoy] ? 1 : 0} favorito`);
  console.log(`   = ${bannersHoy.length + promocionesHoy.length + (favoritoDelDia[diaHoy] ? 1 : 0)} elementos activos para ${diaHoy}`);
  
} catch (error) {
  console.error('❌ Error:', error);
}
