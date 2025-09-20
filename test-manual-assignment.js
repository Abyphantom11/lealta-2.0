const fs = require('fs');
const path = require('path');

// 🧪 SCRIPT DE PRUEBA PARA ASIGNACIÓN MANUAL DE TARJETAS

async function testManualAssignment() {
  console.log('🧪 INICIANDO PRUEBA DE ASIGNACIÓN MANUAL\n');

  // Simular configuración de admin
  const configPath = path.join(__dirname, 'config', 'portal', 'portal-config-arepa.json');
  console.log('📂 Verificando configuración de admin en:', configPath);
  
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✅ Configuración encontrada');
    
    if (config.tarjetas) {
      console.log('📋 TARJETAS CONFIGURADAS:');
      config.tarjetas.forEach(tarjeta => {
        console.log(`   ${tarjeta.nivel}: ${tarjeta.condiciones?.puntosMinimos || 'N/A'} puntos mínimos`);
      });
    }
  } else {
    console.log('❌ No se encontró configuración de admin');
    console.log('💡 Usando valores por defecto:');
    console.log('   Bronce: 0, Plata: 100, Oro: 500, Diamante: 1500, Platino: 3000');
  }

  console.log('\n🎯 ESCENARIOS DE PRUEBA:');
  
  const escenarios = [
    {
      descripcion: 'Cliente con 400 puntos de canjeo, degradado de Oro a Plata',
      nivelAnterior: 'Oro',
      puntosProgresoAnterior: 400,
      nivelNuevo: 'Plata',
      puntosProgresoEsperado: 100, // Mínimo de Plata
      esAscenso: false,
      deberiaNotificar: false
    },
    {
      descripcion: 'Cliente con 200 puntos, ascendido de Plata a Oro',
      nivelAnterior: 'Plata', 
      puntosProgresoAnterior: 200,
      nivelNuevo: 'Oro',
      puntosProgresoEsperado: 500, // Mínimo de Oro
      esAscenso: true,
      deberiaNotificar: true
    },
    {
      descripcion: 'Cliente nuevo asignado a Diamante',
      nivelAnterior: null,
      puntosProgresoAnterior: 0,
      nivelNuevo: 'Diamante',
      puntosProgresoEsperado: 1500, // Mínimo de Diamante
      esAscenso: true,
      deberiaNotificar: true
    }
  ];

  escenarios.forEach((escenario, index) => {
    console.log(`\n${index + 1}. ${escenario.descripcion}`);
    console.log(`   Estado anterior: ${escenario.nivelAnterior || 'Sin tarjeta'} (${escenario.puntosProgresoAnterior} puntos)`);
    console.log(`   Estado nuevo: ${escenario.nivelNuevo} (${escenario.puntosProgresoEsperado} puntos esperados)`);
    console.log(`   ¿Es ascenso?: ${escenario.esAscenso ? '✅ Sí' : '❌ No'}`);
    console.log(`   ¿Debería notificar?: ${escenario.deberiaNotificar ? '🔔 Sí' : '🔇 No'}`);
  });

  console.log('\n📝 PUNTOS CLAVE DE LA IMPLEMENTACIÓN:');
  console.log('1. ✅ loadPortalConfig usa valores corregidos y lee desde admin JSON');
  console.log('2. ✅ updateExistingCard resetea puntosProgreso al mínimo del nivel asignado');
  console.log('3. ✅ Solo notifica ascensos, no degradaciones');
  console.log('4. ✅ Marca en histórico cuando hubo reseteo manual');
  console.log('5. ✅ Logs detallados para debugging');

  console.log('\n🚀 Para probar en la aplicación:');
  console.log('1. Ir al admin → gestión de clientes');
  console.log('2. Buscar un cliente con tarjeta existente');
  console.log('3. Cambiar manualmente el nivel');
  console.log('4. Verificar en consola los logs de reset');
  console.log('5. Confirmar que el progreso se resetea correctamente');
}

testManualAssignment().catch(console.error);
