#!/usr/bin/env node

/**
 * 🔍 VERIFICAR: ¿Qué día comercial está calculando exactamente?
 */

async function debugBusinessDay() {
  console.log('🔍 DEBUG: DÍA COMERCIAL CALCULADO');
  console.log('='.repeat(50));
  
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  
  try {
    // 1. Simular exactamente la lógica de business-day-utils
    const now = new Date();
    const DEFAULT_RESET_HOUR = 4;
    
    console.log('📅 INFORMACIÓN ACTUAL:');
    console.log(`   Hora UTC: ${now.toISOString()}`);
    console.log(`   Hora local: ${now.toLocaleString()}`);
    console.log(`   Hora actual: ${now.getHours()}:${now.getMinutes()}`);
    console.log(`   Día de la semana (0=dom): ${now.getDay()}`);
    
    // 2. Simular lógica de getCurrentBusinessDay
    let businessDay;
    
    if (now.getHours() < DEFAULT_RESET_HOUR) {
      // Antes de las 4 AM - usar día anterior
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      businessDay = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][yesterday.getDay()];
      console.log('\n⏰ ANTES de las 4 AM:');
      console.log(`   → Usando día anterior: ${businessDay}`);
    } else {
      // Después de las 4 AM - usar día actual
      businessDay = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
      console.log('\n⏰ DESPUÉS de las 4 AM:');
      console.log(`   → Usando día actual: ${businessDay}`);
    }
    
    console.log(`\n🎯 DÍA COMERCIAL CALCULADO: "${businessDay}"`);
    
    // 3. Comparar con datos de BD
    console.log('\n📊 COMPARACIÓN CON DATOS DE BD:');
    const datosEnBD = [
      { tipo: 'Banner', nombre: 'dfsf', dia: 'lunes' },
      { tipo: 'Promoción', nombre: 'asd', dia: 'lunes' },
      { tipo: 'Favorito', nombre: 'fsdf', dia: 'lunes' }
    ];
    
    datosEnBD.forEach(item => {
      const coincide = !item.dia || item.dia === businessDay || item.dia === 'todos';
      console.log(`   ${item.tipo} "${item.nombre}" (día: ${item.dia}) → ${coincide ? '✅ VISIBLE' : '❌ OCULTO'}`);
    });
    
    // 4. PROBLEMA IDENTIFICADO
    if (businessDay !== 'lunes') {
      console.log('\n🚨 PROBLEMA ENCONTRADO:');
      console.log(`   BD tiene elementos para "lunes"`);
      console.log(`   Pero día comercial calculado es "${businessDay}"`);
      console.log('   → Por eso no se muestran elementos');
      
      console.log('\n🔧 SOLUCIONES:');
      console.log('   1. Cambiar día en BD de "lunes" a "todos"');
      console.log(`   2. Cambiar día en BD de "lunes" a "${businessDay}"`);
      console.log('   3. Verificar zona horaria del servidor');
    } else {
      console.log('\n✅ DÍA COINCIDE: El problema debe estar en otro lado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugBusinessDay().catch(console.error);
