/**
 * 🔧 TEST DE JERARQUÍA DE TARJETAS - Diagnóstico Rápido
 * Verificamos que el sistema jerárquico funcione correctamente
 */

console.log('🧪 INICIANDO TEST DE JERARQUÍA DE TARJETAS...\n');

// Simular la estructura de datos que manejamos
const JERARQUIA_ESPERADA = [
  { nombre: 'Bronce', puntosRequeridos: 0, orden: 1 },
  { nombre: 'Plata', puntosRequeridos: 500, orden: 2 },
  { nombre: 'Oro', puntosRequeridos: 1500, orden: 3 },
  { nombre: 'Diamante', puntosRequeridos: 3000, orden: 4 },
  { nombre: 'Platino', puntosRequeridos: 5000, orden: 5 }
];

console.log('✅ JERARQUÍA ESPERADA:');
JERARQUIA_ESPERADA.forEach((nivel, idx) => {
  const prevNivel = idx > 0 ? JERARQUIA_ESPERADA[idx - 1] : null;
  const nextNivel = idx < JERARQUIA_ESPERADA.length - 1 ? JERARQUIA_ESPERADA[idx + 1] : null;
  
  let min = prevNivel ? prevNivel.puntosRequeridos + 1 : 0;
  let max = nextNivel ? nextNivel.puntosRequeridos - 1 : 10000;
  
  console.log(`${idx + 1}. ${nivel.nombre}: ${nivel.puntosRequeridos} puntos (rango válido: ${min}-${max})`);
});

console.log('\n🔍 VALIDACIONES CRÍTICAS:');

// Test 1: Orden jerárquico
let ordenValido = true;
for (let i = 1; i < JERARQUIA_ESPERADA.length; i++) {
  if (JERARQUIA_ESPERADA[i].puntosRequeridos <= JERARQUIA_ESPERADA[i-1].puntosRequeridos) {
    console.log(`❌ ERROR: ${JERARQUIA_ESPERADA[i].nombre} no tiene más puntos que ${JERARQUIA_ESPERADA[i-1].nombre}`);
    ordenValido = false;
  }
}
if (ordenValido) {
  console.log('✅ Orden jerárquico: CORRECTO');
}

// Test 2: Gaps apropiados
let gapsValidos = true;
for (let i = 1; i < JERARQUIA_ESPERADA.length; i++) {
  const gap = JERARQUIA_ESPERADA[i].puntosRequeridos - JERARQUIA_ESPERADA[i-1].puntosRequeridos;
  if (gap < 100) {
    console.log(`⚠️ WARNING: Gap pequeño entre ${JERARQUIA_ESPERADA[i-1].nombre} y ${JERARQUIA_ESPERADA[i].nombre}: ${gap} puntos`);
    gapsValidos = false;
  }
}
if (gapsValidos) {
  console.log('✅ Gaps entre niveles: APROPIADOS');
}

// Test 3: Valores límite
console.log('✅ Validación de rangos por nivel:');
JERARQUIA_ESPERADA.forEach((nivel, idx) => {
  const prevNivel = idx > 0 ? JERARQUIA_ESPERADA[idx - 1] : null;
  const nextNivel = idx < JERARQUIA_ESPERADA.length - 1 ? JERARQUIA_ESPERADA[idx + 1] : null;
  
  let min = prevNivel ? prevNivel.puntosRequeridos + 1 : 0;
  let max = nextNivel ? nextNivel.puntosRequeridos - 1 : 10000;
  
  // Verificar que el valor actual esté en el rango válido
  if (nivel.puntosRequeridos >= min && nivel.puntosRequeridos <= max) {
    console.log(`   ✅ ${nivel.nombre}: ${nivel.puntosRequeridos} está en rango [${min}, ${max}]`);
  } else {
    console.log(`   ❌ ${nivel.nombre}: ${nivel.puntosRequeridos} NO está en rango [${min}, ${max}]`);
  }
});

console.log('\n🎯 RESULTADO FINAL:');
if (ordenValido && gapsValidos) {
  console.log('✅ JERARQUÍA VÁLIDA - El sistema debería funcionar correctamente');
  console.log('🔗 Prueba en: http://localhost:3001/admin');
} else {
  console.log('❌ JERARQUÍA INVÁLIDA - Revisar configuración');
}

console.log('\n📋 CHECKLIST PARA PROBAR EN ADMIN:');
console.log('1. Ir a http://localhost:3001/admin');
console.log('2. Navegar a Portal → Configuración');
console.log('3. Verificar que aparezcan 5 tabs: Bronce, Plata, Oro, Diamante, Platino');
console.log('4. En cada tab, verificar que el "Debug: min=X, max=Y" muestre valores correctos');
console.log('5. Intentar cambiar puntos fuera del rango y verificar validación');

console.log('\n🔍 ¿QUÉ BUSCAR?');
console.log('- Bronce: min=0, max=499');
console.log('- Plata: min=1, max=1499 (o min=501, max=1499)');
console.log('- Oro: min=501, max=2999 (o min=1501, max=2999)');
console.log('- Diamante: min=1501, max=4999 (o min=3001, max=4999)');
console.log('- Platino: min=3001, max=10000 (o min=5001, max=10000)');
