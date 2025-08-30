const fetch = require('node-fetch');

async function testConsumoManual() {
  try {
    console.log('🧪 Probando registro de consumo manual con puntos...');
    
    const consumoData = {
      cedula: '1762075776',
      totalManual: 25,  // $25 debería dar 2 puntos (25/10 = 2.5 -> 2 puntos)
      productos: [
        { nombre: 'Café Latte', cantidad: 1 },
        { nombre: 'Sandwich', cantidad: 1 }
      ],
      empleadoVenta: 'Staff Test'
    };

    const response = await fetch('http://localhost:3001/api/staff/consumo/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(consumoData)
    });

    const result = await response.json();
    console.log('📊 Resultado del registro:', result);

    if (result.success) {
      console.log(`✅ Consumo registrado exitosamente!`);
      console.log(`💰 Total: $${result.data.total}`);
      console.log(`⭐ Puntos otorgados: ${result.data.cliente.puntosNuevos}`);
      console.log(`🎯 Puntos totales del cliente: ${result.data.cliente.puntosTotal}`);
      console.log(`💳 Total gastado acumulado: $${result.data.cliente.totalGastado}`);
    } else {
      console.log('❌ Error:', result.error);
    }

  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

testConsumoManual();
