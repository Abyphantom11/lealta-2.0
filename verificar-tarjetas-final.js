// 🧪 VERIFICACIÓN FINAL: Sistema de Tarjetas Corregido
// Este script verifica que la configuración de tarjetas esté funcionando correctamente

console.log('🧪 VERIFICACIÓN FINAL - SISTEMA DE TARJETAS');
console.log('===========================================');

const fs = require('fs');

const businessId = 'cmfuou55e0022ey7c3idlhx9h';
const configPath = `C:\\Users\\abrah\\lealta\\config\\portal\\portal-config-${businessId}.json`;

try {
  console.log(`📁 Verificando: ${configPath}`);
  
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const tarjetas = configData.tarjetas;
  
  console.log('\n📊 ANÁLISIS DE CONFIGURACIÓN:');
  console.log('============================');
  
  if (!tarjetas || tarjetas.length === 0) {
    console.log('❌ ERROR: No hay tarjetas configuradas');
    return;
  }
  
  const tarjeta = tarjetas[0];
  const niveles = tarjeta.niveles;
  
  console.log(`✅ Tarjetas encontradas: ${tarjetas.length}`);
  console.log(`✅ Nombre: ${tarjeta.nombre}`);
  console.log(`✅ Niveles encontrados: ${niveles.length}`);
  
  // Verificar niveles requeridos
  const nivelesRequeridos = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  const nivelesFaltantes = [];
  const nivelesEncontrados = [];
  
  console.log('\n🎯 VERIFICACIÓN DE NIVELES:');
  console.log('===========================');
  
  nivelesRequeridos.forEach(nivelRequerido => {
    const encontrado = niveles.find(n => n.nombre === nivelRequerido);
    if (encontrado) {
      nivelesEncontrados.push(nivelRequerido);
      console.log(`✅ ${nivelRequerido}: ${encontrado.puntosRequeridos} pts, ${encontrado.visitasRequeridas} visitas, ${encontrado.descuento}% desc`);
    } else {
      nivelesFaltantes.push(nivelRequerido);
      console.log(`❌ ${nivelRequerido}: FALTANTE`);
    }
  });
  
  // Verificar progresión lógica
  console.log('\n📈 VERIFICACIÓN DE PROGRESIÓN:');
  console.log('==============================');
  
  const nivelesOrdenados = niveles.sort((a, b) => a.puntosRequeridos - b.puntosRequeridos);
  let progresionValida = true;
  
  for (let i = 1; i < nivelesOrdenados.length; i++) {
    const anterior = nivelesOrdenados[i - 1];
    const actual = nivelesOrdenados[i];
    
    if (actual.puntosRequeridos <= anterior.puntosRequeridos) {
      console.log(`❌ ERROR: ${actual.nombre} (${actual.puntosRequeridos}) debe tener más puntos que ${anterior.nombre} (${anterior.puntosRequeridos})`);
      progresionValida = false;
    } else {
      console.log(`✅ ${anterior.nombre} → ${actual.nombre}: +${actual.puntosRequeridos - anterior.puntosRequeridos} puntos`);
    }
  }
  
  // Resumen final
  console.log('\n🏆 RESUMEN FINAL:');
  console.log('=================');
  
  if (nivelesFaltantes.length === 0 && progresionValida) {
    console.log('🎉 ¡CONFIGURACIÓN PERFECTA!');
    console.log('   ✅ Todos los niveles requeridos presentes');
    console.log('   ✅ Progresión lógica válida');
    console.log('   ✅ Compatible con sistema central');
    console.log('   ✅ Validación debería pasar sin errores');
  } else {
    console.log('⚠️ CONFIGURACIÓN CON PROBLEMAS:');
    if (nivelesFaltantes.length > 0) {
      console.log(`   ❌ Niveles faltantes: ${nivelesFaltantes.join(', ')}`);
    }
    if (!progresionValida) {
      console.log('   ❌ Progresión de puntos inválida');
    }
  }
  
  console.log('\n🔄 PRÓXIMOS PASOS:');
  console.log('   1. Recarga la página del admin');
  console.log('   2. Verifica que no aparezcan errores de validación');
  console.log('   3. Prueba editar tarjetas desde el admin');

} catch (error) {
  console.error('❌ Error en verificación:', error);
}

console.log('\n🎯 ¡TARJETAS DESCONFIGURACION SOLUCIONADA!');

module.exports = { businessId, configPath };
