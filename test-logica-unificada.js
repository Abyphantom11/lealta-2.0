/**
 * TEST: Verificar que la nueva lógica unificada de actualización diaria funciona correctamente
 * Prueba banners, promociones y favoritos con horarios de 4:00 AM
 */

const { isItemVisibleInBusinessDay, getCurrentBusinessDay } = require('../src/lib/business-day-utils');

// Test data simulando configuraciones del admin
const testData = {
  banners: [
    {
      id: '1',
      dia: 'lunes',
      horaPublicacion: '04:00',
      titulo: 'Banner del Lunes',
      activo: true,
      imagenUrl: 'test.jpg'
    },
    {
      id: '2', 
      dia: 'lunes',
      horaPublicacion: '09:00',
      titulo: 'Banner de la Mañana',
      activo: true,
      imagenUrl: 'test2.jpg'
    }
  ],
  promociones: [
    {
      id: '1',
      dia: 'lunes',
      horaTermino: '04:00', // Termina a las 4:00 AM del martes
      titulo: 'Promoción Nocturna',
      activo: true
    },
    {
      id: '2',
      dia: 'lunes', 
      horaTermino: '23:59',
      titulo: 'Promoción de Día',
      activo: true
    }
  ],
  favoritos: [
    {
      id: '1',
      dia: 'lunes',
      horaPublicacion: '04:00', // Ahora unificado a 4:00 AM
      nombre: 'Favorito del Lunes',
      activo: true,
      imagenUrl: 'favorito.jpg'
    }
  ]
};

async function testScenario(descripcion, fecha, expectedResults) {
  console.log(`\n🧪 TEST: ${descripcion}`);
  console.log(`📅 Fecha de prueba: ${fecha.toLocaleString()}`);
  
  try {
    const diaComercial = await getCurrentBusinessDay('test-business', fecha);
    console.log(`🗓️ Día comercial: ${diaComercial}`);
    
    // Test banners
    console.log('\n📢 BANNERS:');
    for (const banner of testData.banners) {
      if (banner.dia === diaComercial) {
        const visible = await isItemVisibleInBusinessDay(banner, 'test-business', fecha);
        const status = visible ? '✅ VISIBLE' : '❌ OCULTO';
        console.log(`  - ${banner.titulo}: ${status}`);
        
        if (expectedResults.banners[banner.id] !== undefined) {
          const expected = expectedResults.banners[banner.id] ? '✅ VISIBLE' : '❌ OCULTO';
          const result = visible === expectedResults.banners[banner.id] ? '✅ CORRECTO' : '❌ ERROR';
          console.log(`    Esperado: ${expected} | Resultado: ${result}`);
        }
      }
    }
    
    // Test promociones  
    console.log('\n🎁 PROMOCIONES:');
    for (const promo of testData.promociones) {
      if (promo.dia === diaComercial) {
        const visible = await isItemVisibleInBusinessDay(promo, 'test-business', fecha);
        const status = visible ? '✅ VISIBLE' : '❌ OCULTA';
        console.log(`  - ${promo.titulo}: ${status}`);
        
        if (expectedResults.promociones[promo.id] !== undefined) {
          const expected = expectedResults.promociones[promo.id] ? '✅ VISIBLE' : '❌ OCULTA';
          const result = visible === expectedResults.promociones[promo.id] ? '✅ CORRECTO' : '❌ ERROR';
          console.log(`    Esperado: ${expected} | Resultado: ${result}`);
        }
      }
    }
    
    // Test favoritos
    console.log('\n⭐ FAVORITOS:');
    for (const favorito of testData.favoritos) {
      if (favorito.dia === diaComercial) {
        const visible = await isItemVisibleInBusinessDay(favorito, 'test-business', fecha);
        const status = visible ? '✅ VISIBLE' : '❌ OCULTO';
        console.log(`  - ${favorito.nombre}: ${status}`);
        
        if (expectedResults.favoritos[favorito.id] !== undefined) {
          const expected = expectedResults.favoritos[favorito.id] ? '✅ VISIBLE' : '❌ OCULTO';
          const result = visible === expectedResults.favoritos[favorito.id] ? '✅ CORRECTO' : '❌ ERROR';
          console.log(`    Esperado: ${expected} | Resultado: ${result}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

async function runTests() {
  console.log('🚀 INICIANDO TESTS DE LÓGICA UNIFICADA DE ACTUALIZACIÓN DIARIA');
  console.log('==================================================================');
  
  // Escenario 1: Lunes 23:59 - Todo visible hasta las 4:00 AM
  await testScenario(
    'Lunes 23:59 - Final del día comercial', 
    new Date(2024, 9, 14, 23, 59), // Lunes 23:59
    {
      banners: { '1': true, '2': true }, // Ambos visibles
      promociones: { '1': true, '2': true }, // Ambas visibles  
      favoritos: { '1': true } // Visible
    }
  );
  
  // Escenario 2: Martes 00:30 - Horario extendido hasta 4:00 AM
  await testScenario(
    'Martes 00:30 - Horario extendido del lunes',
    new Date(2024, 9, 15, 0, 30), // Martes 00:30
    {
      banners: { '1': true, '2': true }, // Siguen siendo del lunes comercial
      promociones: { '1': true, '2': false }, // Promoción 2 ya terminó a las 23:59
      favoritos: { '1': true } // Sigue siendo del lunes comercial
    }
  );
  
  // Escenario 3: Martes 03:59 - Un minuto antes del cambio
  await testScenario(
    'Martes 03:59 - Un minuto antes del reseteo',
    new Date(2024, 9, 15, 3, 59), // Martes 03:59
    {
      banners: { '1': true, '2': true }, // Aún del lunes comercial
      promociones: { '1': true, '2': false }, // Promoción nocturna aún activa
      favoritos: { '1': true } // Aún del lunes comercial
    }
  );
  
  // Escenario 4: Martes 04:00 - Cambio de día comercial
  await testScenario(
    'Martes 04:00 - Cambio oficial de día comercial',
    new Date(2024, 9, 15, 4, 0), // Martes 04:00
    {
      banners: { '1': false, '2': false }, // Ya no son del día comercial actual
      promociones: { '1': false, '2': false }, // Ya no son del día comercial actual
      favoritos: { '1': false } // Ya no es del día comercial actual
    }
  );
  
  // Escenario 5: Martes 04:01 - Nuevo día comercial iniciado
  await testScenario(
    'Martes 04:01 - Nuevo día comercial (martes)',
    new Date(2024, 9, 15, 4, 1), // Martes 04:01
    {
      banners: { '1': false, '2': false }, // No hay banners para martes
      promociones: { '1': false, '2': false }, // No hay promociones para martes
      favoritos: { '1': false } // No hay favoritos para martes
    }
  );
  
  console.log('\n✅ TESTS COMPLETADOS');
  console.log('====================');
  console.log('👀 Revisa los resultados arriba para verificar que la lógica sea consistente.');
  console.log('📌 Todos los elementos deben cambiar exactamente a las 4:00 AM.');
}

// Ejecutar tests
runTests().catch(console.error);
