const fetch = require('node-fetch');

async function testEndpoint() {
  try {
    const businessId = 'cmgb818x70000eyeov4f8lriu';
    const mes = 9; // Septiembre
    const año = 2025;

    const url = `http://localhost:3000/api/reservas/reportes?businessId=${businessId}&mes=${mes}&año=${año}`;
    
    console.log('🔍 Probando endpoint:');
    console.log(url);
    console.log('');

    const response = await fetch(url);
    
    console.log('📡 Status:', response.status);
    console.log('');

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Respuesta recibida:');
    console.log('');
    console.log('Período:', data.periodo);
    console.log('');
    console.log('Métricas Generales:');
    console.log(JSON.stringify(data.metricas.generales, null, 2));
    console.log('');
    console.log('Por Asistencia:');
    console.log(JSON.stringify(data.metricas.porAsistencia, null, 2));
    console.log('');
    console.log('Rankings:');
    console.log('- Top 5 Días:', data.rankings.top5Dias?.length || 0);
    console.log('- Top 5 Clientes:', data.rankings.top5Clientes?.length || 0);
    console.log('- Top 5 Horarios:', data.rankings.top5Horarios?.length || 0);
    console.log('- Top 5 Promotores:', data.rankings.top5Promotores?.length || 0);
    console.log('');
    console.log('Detalle Reservas:', data.detalleReservas?.length || 0);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEndpoint();
