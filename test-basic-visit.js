// 🧪 TEST SIMPLE PARA LA API DE VISITAS

async function testBasicVisitAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 PROBANDO API DE VISITAS...');
  
  // Datos de prueba simples
  const testVisit = {
    sessionId: 'test-session-' + Date.now(),
    clienteId: null, // Visita anónima
    businessId: 'cmfr2y0ia0000eyvw7ef3k20u',
    path: '/cliente',
    referrer: null
  };
  
  console.log('📤 Enviando visita de prueba:', testVisit);
  
  try {
    const response = await fetch(`${baseUrl}/api/cliente/visitas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testVisit)
    });
    
    console.log('📊 Respuesta status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Visita registrada exitosamente:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', response.status, errorText);
    }
    
    // Ahora probar GET
    console.log('\n📊 Probando GET de estadísticas...');
    const getResponse = await fetch(`${baseUrl}/api/cliente/visitas?businessId=cmfr2y0ia0000eyvw7ef3k20u&periodo=hoy`);
    
    if (getResponse.ok) {
      const stats = await getResponse.json();
      console.log('📈 Estadísticas obtenidas:', stats);
    } else {
      console.log('❌ Error obteniendo estadísticas:', getResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Error de red:', error);
  }
}

testBasicVisitAPI();
