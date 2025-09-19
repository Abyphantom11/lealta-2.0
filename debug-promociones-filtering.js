const fetch = require('node-fetch');

async function debugPromocionesFiltering() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🔍 DEBUG: Filtrado de Promociones en Cliente');
    console.log('============================================');
    
    // 1. Obtener datos del API
    const response = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${businessId}`);
    const data = await response.json();
    
    console.log(`\n📊 Promociones del API: ${data.promotions?.length || 0}`);
    
    if (data.promotions) {
      data.promotions.forEach((p, i) => {
        console.log(`\n${i + 1}. "${p.title}"`);
        console.log(`   - activo: ${p.isActive}`);
        console.log(`   - dia: ${p.dia || 'undefined'}`);
        console.log(`   - descuento: ${p.discount}`);
        console.log(`   - descripcion: ${p.description}`);
      });
    }
    
    // 2. Simular el filtrado que hace el componente
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const ahora = new Date();
    const diaActual = diasSemana[ahora.getDay()];
    
    console.log(`\n🗓️ Día actual: ${diaActual} (${ahora.getDay()})`);
    
    // Filtrar como lo hace el componente
    const todasActivas = (data.promotions || []).filter(p => p.isActive !== false);
    console.log(`\n📋 Promociones activas: ${todasActivas.length}`);
    
    const promocionesDelDia = todasActivas.filter(p => {
      // Verificar si es el día de la promoción
      const esDiaValido = p.dia === diaActual;
      console.log(`   - "${p.title}": dia="${p.dia}", diaActual="${diaActual}", válida=${esDiaValido}`);
      return esDiaValido;
    });
    
    console.log(`\n🎯 Promociones válidas para hoy: ${promocionesDelDia.length}`);
    promocionesDelDia.forEach(p => {
      console.log(`   ✅ "${p.title}" (${p.discount})`);
    });
    
    // 3. Análisis del problema
    if (todasActivas.length > 0 && promocionesDelDia.length === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO:');
      console.log('   Las promociones están activas pero no tienen el campo "dia" configurado');
      console.log('   o no coincide con el día actual.');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   1. Las promociones necesitan tener el campo "dia" configurado');
      console.log('   2. O el filtro de día debe ser más flexible para promociones sin día específico');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPromocionesFiltering();
