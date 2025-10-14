// Script de prueba para verificar la lógica del día comercial corregida
const { isItemVisibleInBusinessDay } = require('./src/lib/business-day-utils.ts');

async function testBusinessDayLogic() {
  console.log('🧪 PROBANDO LÓGICA DEL DÍA COMERCIAL CORREGIDA\n');
  
  // Simular un banner del lunes con hora de publicación 04:00
  const bannerLunes = {
    id: 'banner-lunes',
    dia: 'lunes',
    activo: true,
    horaPublicacion: '04:00'
    // Sin horaTermino - debería durar todo el día
  };
  
  // Crear varias fechas de prueba para un lunes
  const testDates = [
    new Date(2025, 9, 13, 2, 0),   // Lunes 2:00 AM (antes de reseteo - día domingo)
    new Date(2025, 9, 13, 4, 0),   // Lunes 4:00 AM (hora de reseteo - inicio día lunes)
    new Date(2025, 9, 13, 8, 0),   // Lunes 8:00 AM (mañana lunes)
    new Date(2025, 9, 13, 12, 0),  // Lunes 12:00 PM (medio día lunes) ⭐ TU CASO
    new Date(2025, 9, 13, 18, 0),  // Lunes 6:00 PM (tarde lunes)
    new Date(2025, 9, 13, 23, 59), // Lunes 11:59 PM (final del día lunes)
    new Date(2025, 9, 14, 2, 0),   // Martes 2:00 AM (aún día lunes comercial)
    new Date(2025, 9, 14, 4, 0),   // Martes 4:00 AM (reseteo - fin día lunes, inicio martes)
  ];
  
  console.log('📅 Probando banner del LUNES:');
  console.log('   - Hora publicación: 04:00');
  console.log('   - Sin hora de término (debería durar todo el día)\n');
  
  for (const testDate of testDates) {
    try {
      const isVisible = await isItemVisibleInBusinessDay(bannerLunes, 'test-business', testDate);
      const dayName = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][testDate.getDay()];
      const timeStr = testDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      
      console.log(`   ${dayName} ${timeStr}: ${isVisible ? '✅ VISIBLE' : '❌ OCULTO'}`);
      
      // Tu caso específico (lunes 12:00 PM)
      if (testDate.getHours() === 12 && dayName === 'lunes') {
        if (isVisible) {
          console.log('   🎉 ¡CORRECTO! El banner del lunes SÍ aparece a las 12:00 PM');
        } else {
          console.log('   ❌ ERROR: El banner del lunes NO aparece a las 12:00 PM (debería aparecer)');
        }
      }
    } catch (error) {
      console.error(`   Error en ${testDate}: ${error.message}`);
    }
  }
  
  console.log('\n📊 RESULTADO ESPERADO:');
  console.log('   - 2:00 AM lunes: ❌ (aún es domingo comercial)');
  console.log('   - 4:00 AM lunes: ✅ (inicia día lunes)');
  console.log('   - 8:00 AM lunes: ✅ (día lunes activo)');
  console.log('   - 12:00 PM lunes: ✅ (día lunes activo) ⭐ TU PROBLEMA');
  console.log('   - 6:00 PM lunes: ✅ (día lunes activo)');
  console.log('   - 11:59 PM lunes: ✅ (día lunes activo)');
  console.log('   - 2:00 AM martes: ✅ (aún día lunes comercial)');
  console.log('   - 4:00 AM martes: ❌ (inicia día martes, termina lunes)');
}

testBusinessDayLogic().catch(console.error);
