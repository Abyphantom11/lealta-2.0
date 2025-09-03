// Test completo del flujo de análisis de IA
const fs = require('fs');
const path = require('path');

async function testFullAIFlow() {
  console.log('🧪 Probando flujo completo de análisis de IA...\n');

  try {
    // Usar una imagen existente de ticket
    const imagePath = path.join(__dirname, 'public', 'uploads', 'ticket_1756922402582.png');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ No se encontró imagen de prueba');
      return;
    }

    console.log('📸 Usando imagen:', imagePath);

    // 1. Fase de análisis (sin guardar)
    console.log('\n🔍 FASE 1: Análisis de imagen...');
    
    const formData = new FormData();
    const imageBlob = new Blob([fs.readFileSync(imagePath)], { type: 'image/png' });
    formData.append('image', imageBlob, 'ticket_test.png');
    formData.append('cedula', '12345678'); // Cliente de prueba
    formData.append('businessId', 'cmes3g9wd0000eyggpbqfl9r6');
    formData.append('empleadoId', 'cmes3ga7g0002eygg8blcebct');

    const analyzeResponse = await fetch('http://localhost:3001/api/staff/consumo/analyze', {
      method: 'POST',
      body: formData,
    });

    const analyzeData = await analyzeResponse.json();
    
    if (!analyzeResponse.ok) {
      console.log('❌ Error en análisis:', analyzeData.error);
      return;
    }

    console.log('✅ Análisis completado:');
    console.log('📊 Cliente:', analyzeData.data.cliente.nombre);
    console.log('💰 Total detectado:', analyzeData.data.analisis.total);
    console.log('🎯 Confianza:', analyzeData.data.analisis.confianza + '%');
    console.log('👤 Empleado detectado:', analyzeData.data.analisis.empleadoDetectado);
    console.log('📦 Productos:', analyzeData.data.analisis.productos.length);

    // 2. Fase de confirmación (guardar)
    console.log('\n✅ FASE 2: Confirmación y guardado...');
    
    const confirmData = {
      clienteId: analyzeData.data.cliente.id,
      businessId: analyzeData.data.metadata.businessId,
      empleadoId: analyzeData.data.metadata.empleadoId,
      productos: analyzeData.data.analisis.productos,
      total: analyzeData.data.analisis.total,
      puntos: analyzeData.data.analisis.puntosGenerados,
      empleadoDetectado: analyzeData.data.analisis.empleadoDetectado,
      confianza: analyzeData.data.analisis.confianza / 100,
      imagenUrl: analyzeData.data.metadata.imagenUrl,
      metodoPago: 'efectivo',
      notas: 'Prueba automática del sistema'
    };

    const confirmResponse = await fetch('http://localhost:3001/api/staff/consumo/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(confirmData),
    });

    const confirmResult = await confirmResponse.json();
    
    if (!confirmResponse.ok) {
      console.log('❌ Error en confirmación:', confirmResult.error);
      return;
    }

    console.log('✅ Consumo guardado exitosamente:');
    console.log('🆔 ID del consumo:', confirmResult.data.consumoId);
    console.log('👤 Cliente:', confirmResult.data.clienteNombre);
    console.log('🎯 Puntos generados:', confirmResult.data.puntosGenerados);
    console.log('📈 Puntos acumulados:', confirmResult.data.puntosAcumulados);

    console.log('\n🎉 ¡PRUEBA COMPLETA EXITOSA!');
    console.log('💡 El sistema de IA con confirmación está funcionando perfectamente.');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (response.ok) {
      console.log('✅ Servidor corriendo en http://localhost:3001');
      return true;
    }
  } catch (error) {
    console.log('❌ El servidor no está corriendo. Ejecuta: npm run dev');
    return false;
  }
}

// Ejecutar la prueba
(async () => {
  if (await checkServer()) {
    await testFullAIFlow();
  }
})();
