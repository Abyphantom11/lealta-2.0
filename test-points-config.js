/**
 * 🧪 Script de prueba para configuración de puntos
 * Verifica que el endpoint funcione correctamente
 */

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo

async function testPointsConfiguration() {
  console.log('🧪 Iniciando prueba de configuración de puntos...\n');

  try {
    // 1. Obtener configuración actual
    console.log('📖 1. Obteniendo configuración actual...');
    const getResponse = await fetch('http://localhost:3000/api/admin/puntos', {
      headers: {
        'Cookie': 'auth-token=your-auth-token-here' // Reemplazar con token real
      }
    });
    
    if (getResponse.ok) {
      const getCurrentData = await getResponse.json();
      console.log('✅ Configuración actual:', JSON.stringify(getCurrentData, null, 2));
    } else {
      console.log('❌ Error obteniendo configuración:', getResponse.status);
    }

    // 2. Actualizar configuración con valores de prueba
    console.log('\n📝 2. Actualizando configuración...');
    const updateData = {
      puntosPorDolar: 3,
      bonusPorRegistro: 150
    };

    const postResponse = await fetch('http://localhost:3000/api/admin/puntos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=your-auth-token-here' // Reemplazar con token real
      },
      body: JSON.stringify(updateData)
    });

    const postData = await postResponse.json();
    
    if (postResponse.ok) {
      console.log('✅ Configuración actualizada exitosamente:');
      console.log(JSON.stringify(postData, null, 2));
    } else {
      console.log('❌ Error actualizando configuración:');
      console.log(`Status: ${postResponse.status}`);
      console.log('Response:', JSON.stringify(postData, null, 2));
    }

    // 3. Verificar que los cambios se guardaron
    console.log('\n🔍 3. Verificando cambios...');
    const verifyResponse = await fetch('http://localhost:3000/api/admin/puntos', {
      headers: {
        'Cookie': 'auth-token=your-auth-token-here' // Reemplazar con token real
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Configuración verificada:', JSON.stringify(verifyData, null, 2));
      
      // Verificar que los valores coinciden
      if (verifyData.data.puntosPorDolar === updateData.puntosPorDolar && 
          verifyData.data.bonusPorRegistro === updateData.bonusPorRegistro) {
        console.log('🎉 ¡Prueba exitosa! Los valores se guardaron correctamente.');
      } else {
        console.log('⚠️ Los valores no coinciden con los enviados.');
      }
    } else {
      console.log('❌ Error verificando configuración:', verifyResponse.status);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Prueba de validación de límites
async function testValidationLimits() {
  console.log('\n🔬 Prueba de validación de límites...\n');

  const testCases = [
    { puntosPorDolar: 0, bonusPorRegistro: 100, shouldFail: true, description: 'Puntos por dólar muy bajo' },
    { puntosPorDolar: 11, bonusPorRegistro: 100, shouldFail: true, description: 'Puntos por dólar muy alto' },
    { puntosPorDolar: 5, bonusPorRegistro: 0, shouldFail: true, description: 'Bonus muy bajo' },
    { puntosPorDolar: 5, bonusPorRegistro: 1001, shouldFail: true, description: 'Bonus muy alto' },
    { puntosPorDolar: 5, bonusPorRegistro: 200, shouldFail: false, description: 'Valores válidos' }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 Probando: ${testCase.description}`);
    console.log(`   Datos: puntosPorDolar=${testCase.puntosPorDolar}, bonusPorRegistro=${testCase.bonusPorRegistro}`);

    try {
      const response = await fetch('http://localhost:3000/api/admin/puntos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=your-auth-token-here' // Reemplazar con token real
        },
        body: JSON.stringify({
          puntosPorDolar: testCase.puntosPorDolar,
          bonusPorRegistro: testCase.bonusPorRegistro
        })
      });

      const data = await response.json();
      
      if (testCase.shouldFail) {
        if (!response.ok) {
          console.log(`   ✅ Falló como esperado: ${data.error}`);
        } else {
          console.log(`   ❌ Debería haber fallado pero no lo hizo`);
        }
      } else {
        if (response.ok) {
          console.log(`   ✅ Exitoso como esperado`);
        } else {
          console.log(`   ❌ Debería haber sido exitoso: ${data.error}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error en la prueba: ${error.message}`);
    }
    
    console.log(''); // Línea en blanco
  }
}

// Ejecutar pruebas
console.log('🚀 Iniciando suite de pruebas para configuración de puntos\n');
console.log('⚠️  IMPORTANTE: Asegúrate de:');
console.log('   1. Tener el servidor corriendo en localhost:3000');
console.log('   2. Estar autenticado (reemplazar auth-token)');
console.log('   3. Tener permisos de administrador\n');

testPointsConfiguration()
  .then(() => testValidationLimits())
  .then(() => {
    console.log('🏁 Suite de pruebas completada.');
  })
  .catch(error => {
    console.error('💥 Error en suite de pruebas:', error);
  });
