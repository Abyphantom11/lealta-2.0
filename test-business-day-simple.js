// Script de prueba directo para verificar la lógica del día comercial
console.log('🧪 PROBANDO LÓGICA DEL DÍA COMERCIAL CORREGIDA\n');

// Recrear la lógica corregida aquí
const DEFAULT_RESET_HOUR = 4;
const DAYS_OF_WEEK = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function getCurrentBusinessDaySync(customDate) {
  const now = customDate || new Date();
  const currentHour = now.getHours();
  const resetHour = DEFAULT_RESET_HOUR;
  
  let businessDay;
  if (currentHour < resetHour) {
    // Antes de las 4 AM = día anterior
    businessDay = new Date(now);
    businessDay.setDate(businessDay.getDate() - 1);
  } else {
    // Después de las 4 AM = día actual
    businessDay = new Date(now);
  }
  
  return DAYS_OF_WEEK[businessDay.getDay()];
}

function timeStringToMinutes(timeString) {
  const [horas, minutos] = timeString.split(':').map(Number);
  return horas * 60 + minutos;
}

function isAfterEndTimeFixed(item, currentTimeInMinutes) {
  // Si no tiene hora de término, dura todo el día comercial (hasta 4:00 AM del siguiente día)
  if (!item.horaTermino) return false;
  
  const horaTerminoMinutos = timeStringToMinutes(item.horaTermino);
  
  // Si horaTermino es temprano (como 02:00), es del día siguiente
  if (horaTerminoMinutos < 6 * 60) {
    // Si estamos antes de las 6 AM (temprano), verificar si ya pasó la hora de término
    if (currentTimeInMinutes < 6 * 60) {
      return currentTimeInMinutes >= horaTerminoMinutos;
    }
    
    // Si estamos después de las 6 AM, significa que aún no llegamos al término (que es temprano mañana)
    return false;
  }
  
  // Para horas de término normales del mismo día
  return currentTimeInMinutes >= horaTerminoMinutos;
}

function isItemVisibleInBusinessDayFixed(item, customDate) {
  const currentBusinessDay = getCurrentBusinessDaySync(customDate);
  
  // Verificaciones básicas
  if (item.dia !== currentBusinessDay || item.activo === false) {
    return false;
  }

  const now = customDate || new Date();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Verificar hora de inicio
  const horaInicio = item.horaPublicacion || '04:00';
  const horaInicioMinutos = timeStringToMinutes(horaInicio);
  
  // CASO ESPECIAL: Si estamos en horario temprano (0:00 - 4:00) y el día comercial coincide
  // significa que el elemento debería estar visible desde el día anterior
  if (currentTimeInMinutes < 4 * 60 && item.dia === currentBusinessDay) {
    // No verificar hora de inicio en este caso, solo hora de término
    return !isAfterEndTimeFixed(item, currentTimeInMinutes);
  }
  
  if (currentTimeInMinutes < horaInicioMinutos) {
    return false;
  }

  // Verificar hora de término
  return !isAfterEndTimeFixed(item, currentTimeInMinutes);
}

// EJECUTAR PRUEBAS
function runTests() {
  // Simular un banner del lunes con hora de publicación 04:00
  const bannerLunes = {
    id: 'banner-lunes',
    dia: 'lunes',
    activo: true,
    horaPublicacion: '04:00'
    // Sin horaTermino - debería durar todo el día
  };
  
  // Crear varias fechas de prueba para un lunes (14 de octubre de 2025 es martes, así que uso 13 para lunes)
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
    const isVisible = isItemVisibleInBusinessDayFixed(bannerLunes, testDate);
    const dayName = DAYS_OF_WEEK[testDate.getDay()];
    const timeStr = testDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const businessDay = getCurrentBusinessDaySync(testDate);
    
    console.log(`   ${dayName} ${timeStr} (día comercial: ${businessDay}): ${isVisible ? '✅ VISIBLE' : '❌ OCULTO'}`);
    
    // Tu caso específico (lunes 12:00 PM)
    if (testDate.getHours() === 12 && dayName === 'lunes') {
      if (isVisible) {
        console.log('   🎉 ¡CORRECTO! El banner del lunes SÍ aparece a las 12:00 PM');
      } else {
        console.log('   ❌ ERROR: El banner del lunes NO aparece a las 12:00 PM (debería aparecer)');
      }
    }
  }
  
  console.log('\n📊 RESULTADO ESPERADO:');
  console.log('   - 2:00 AM lunes: ❌ (aún es domingo comercial)');
  console.log('   - 4:00 AM lunes: ✅ (inicia día lunes)');
  console.log('   - 8:00 AM lunes: ✅ (día lunes activo)');
  console.log('   - 12:00 PM lunes: ✅ (día lunes activo) ⭐ TU PROBLEMA SOLUCIONADO');
  console.log('   - 6:00 PM lunes: ✅ (día lunes activo)');
  console.log('   - 11:59 PM lunes: ✅ (día lunes activo)');
  console.log('   - 2:00 AM martes: ✅ (aún día lunes comercial)');
  console.log('   - 4:00 AM martes: ❌ (inicia día martes, termina lunes)');
}

runTests();
