// 🧪 SCRIPT PARA PROBAR EL SISTEMA DE TRACKING DE VISITAS

async function testVisitTrackingSystem() {
  console.log('🧪 INICIANDO PRUEBA DEL SISTEMA DE TRACKING DE VISITAS');
  console.log('='.repeat(60));

  const businessId = 'cmfr2y0ia0000eyvw7ef3k20u';
  const baseUrl = 'http://localhost:3000';

  // 📝 Generar algunas visitas de prueba
  const visitasTest = [
    {
      sessionId: 'test-session-1',
      clienteId: null, // Visita anónima
      businessId,
      path: '/cliente',
      referrer: 'https://google.com'
    },
    {
      sessionId: 'test-session-2', 
      clienteId: 'cm123456', // Visita de cliente registrado
      businessId,
      path: '/cliente/recompensas',
      referrer: null
    },
    {
      sessionId: 'test-session-3',
      clienteId: null,
      businessId,
      path: '/cliente',
      referrer: 'https://facebook.com'
    }
  ];

  console.log('📤 REGISTRANDO VISITAS DE PRUEBA:');
  
  for (let i = 0; i < visitasTest.length; i++) {
    const visita = visitasTest[i];
    console.log(`\n${i + 1}. Registrando visita:`, {
      tipo: visita.clienteId ? 'Cliente registrado' : 'Anónima',
      sessionId: visita.sessionId,
      path: visita.path
    });

    try {
      const response = await fetch(`${baseUrl}/api/cliente/visitas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visita)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ Visita registrada:', result.message);
      } else {
        console.log('   ❌ Error:', response.status, await response.text());
      }
    } catch (error) {
      console.log('   ❌ Error de red:', error.message);
    }

    // Pausa entre visitas
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 📊 Ahora verificar las estadísticas
  console.log('\n📊 VERIFICANDO ESTADÍSTICAS:');
  console.log('-'.repeat(40));

  const periodos = ['hoy', 'semana', 'mes'];
  
  for (const periodo of periodos) {
    try {
      const response = await fetch(`${baseUrl}/api/cliente/visitas?businessId=${businessId}&periodo=${periodo}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`\n📈 Estadísticas ${periodo.toUpperCase()}:`);
        console.log(`   Total visitas: ${data.estadisticas?.totalVisitas || 0}`);
        console.log(`   Visitas registradas: ${data.estadisticas?.visitasRegistradas || 0}`);
        console.log(`   Visitas anónimas: ${data.estadisticas?.visitasAnonimas || 0}`);
        console.log(`   Sesiones únicas: ${data.estadisticas?.sesionesUnicas || 0}`);
      } else {
        console.log(`\n❌ Error obteniendo estadísticas para ${periodo}:`, response.status);
      }
    } catch (error) {
      console.log(`\n❌ Error de red para ${periodo}:`, error.message);
    }
  }

  console.log('\n✅ PRUEBA COMPLETADA');
  console.log('💡 Ahora puedes:');
  console.log('1. Visitar el admin para ver las estadísticas');
  console.log('2. Ir al portal cliente para generar visitas reales');
  console.log('3. Verificar que los números se actualicen en tiempo real');
}

// Ejecutar la prueba
testVisitTrackingSystem().catch(console.error);
