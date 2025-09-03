const fetch = require('node-fetch');

async function testNuevoSistemaPuntos() {
  try {
    console.log('🧪 Probando nuevo sistema de puntos (2 puntos por $1)...');

    const consumoData = {
      cedula: '1762075776',
      totalManual: 10, // $10 debería dar 20 puntos (10 × 2)
      productos: [{ nombre: 'Café Espresso', cantidad: 2 }],
      empleadoVenta: 'Test Sistema Puntos',
    };

    const response = await fetch(
      'http://localhost:3001/api/staff/consumo/manual',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consumoData),
      }
    );

    const result = await response.json();
    console.log('📊 Resultado:', result);

    if (result.success) {
      console.log(`✅ Consumo registrado exitosamente!`);
      console.log(`💰 Total: $${result.data.total}`);
      console.log(`⭐ Puntos otorgados: ${result.data.cliente.puntosNuevos}`);
      console.log(`🎯 Puntos totales: ${result.data.cliente.puntosTotal}`);
      console.log(`💳 Total gastado: $${result.data.cliente.totalGastado}`);

      // Verificar que los cálculos sean correctos
      const puntosEsperados = consumoData.totalManual * 2;
      if (result.data.cliente.puntosNuevos === puntosEsperados) {
        console.log(
          `✅ Cálculo de puntos correcto: $${consumoData.totalManual} × 2 = ${puntosEsperados} puntos`
        );
      } else {
        console.log(
          `❌ Error en cálculo: esperaba ${puntosEsperados}, obtuvo ${result.data.cliente.puntosNuevos}`
        );
      }
    } else {
      console.log('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testNuevoSistemaPuntos();
