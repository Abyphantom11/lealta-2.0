const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function testReservasEndpoint() {
  try {
    console.log('🧪 Probando endpoint de reservas...\n');
    console.log(`URL: http://localhost:3001/api/reservas?businessId=${businessId}\n`);
    
    const response = await fetch(`http://localhost:3001/api/reservas?businessId=${businessId}`);
    
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const contentType = response.headers.get('content-type');
    console.log('📊 Content-Type:', contentType);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ Error Response Body:');
      console.error(errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('\n❌ Error JSON:');
        console.error(JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('(No es JSON válido)');
      }
      
      return;
    }
    
    const data = await response.json();
    console.log('\n✅ Success!');
    console.log(`Total de reservas: ${data.reservas?.length || 0}`);
    
    if (data.reservas && data.reservas.length > 0) {
      console.log('\n📋 Primera reserva:');
      console.log(JSON.stringify(data.reservas[0], null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Error ejecutando test:', error);
  }
}

// Ejecutar
console.log('⏳ Esperando 2 segundos para que el servidor esté listo...\n');
setTimeout(testReservasEndpoint, 2000);
