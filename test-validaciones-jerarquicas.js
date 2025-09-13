// Script de test para validaciones jerárquicas de tarjetas
// Ejecutar en la consola del navegador mientras editas tarjetas

console.log('🧪 INICIANDO TESTS DE VALIDACIONES JERÁRQUICAS');
console.log('=' .repeat(60));

// Datos de prueba basados en tu configuración actual
const testCards = [
  { nivel: 'Bronce', puntosMinimos: 0 },
  { nivel: 'Plata', puntosMinimos: 400 },
  { nivel: 'Oro', puntosMinimos: 500 }
];

console.log('📋 Configuración actual de tarjetas:');
testCards.forEach(card => {
  console.log(`   ${card.nivel}: ${card.puntosMinimos} puntos`);
});

console.log('\n🧪 CASOS DE PRUEBA PARA VALIDAR:');

console.log('\n✅ CASOS VÁLIDOS:');
console.log('   1. Bronce: 0-399 puntos (menor que Plata)');
console.log('   2. Plata: 401-499 puntos (mayor que Bronce, menor que Oro)');
console.log('   3. Oro: 501+ puntos (mayor que Plata)');
console.log('   4. Diamante: debe ser mayor que Oro');
console.log('   5. Platino: debe ser mayor que Diamante');

console.log('\n❌ CASOS QUE DEBEN FALLAR:');
console.log('   1. Plata con 399 puntos (menor o igual que Bronce)');
console.log('   2. Oro con 400 puntos (menor o igual que Plata)');
console.log('   3. Bronce con 401 puntos (mayor que Plata)');
console.log('   4. Cualquier nivel menor con más puntos que nivel superior');

console.log('\n📝 INSTRUCCIONES DE PRUEBA:');
console.log('   1. Ve al editor de tarjetas');
console.log('   2. Selecciona "Plata" e intenta poner 399 puntos → Debe mostrar error');
console.log('   3. Selecciona "Oro" e intenta poner 400 puntos → Debe mostrar error');
console.log('   4. Selecciona "Bronce" e intenta poner 401 puntos → Debe mostrar error');
console.log('   5. Verifica que el botón "Guardar" se deshabilita con errores');

console.log('\n🎯 FUNCIONALIDADES A VERIFICAR:');
console.log('   ✓ Errores aparecen inmediatamente al cambiar puntos');
console.log('   ✓ Límites sugeridos aparecen debajo del input');
console.log('   ✓ Botón de guardar se deshabilita con errores');
console.log('   ✓ Mensaje del botón cambia a "Corrige errores primero"');
console.log('   ✓ Notificaciones toast aparecen con errores específicos');

console.log('\n' + '=' .repeat(60));
console.log('✅ Setup de testing completado. ¡Comienza las pruebas!');
