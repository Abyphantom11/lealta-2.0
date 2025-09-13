const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAutoLevelEvaluation() {
  try {
    console.log('🧪 Probando evaluación automática de nivel...');
    
    // Buscar cliente de prueba
    const cliente = await prisma.cliente.findFirst({
      where: { cedula: '1762075776' },
      include: { tarjetaLealtad: true }
    });

    if (!cliente) {
      console.log('❌ Cliente no encontrado');
      return;
    }

    console.log('📊 Estado actual del cliente:');
    console.log(`- Puntos disponibles: ${cliente.puntos}`);
    console.log(`- Puntos acumulados: ${cliente.puntosAcumulados}`);
    console.log(`- Visitas: ${cliente.totalVisitas}`);
    console.log(`- Nivel actual: ${cliente.tarjetaLealtad?.nivel || 'Sin tarjeta'}`);

    // Simular que el cliente alcanza los requisitos para Oro (500 puntos O 10 visitas)
    const puntosParaOro = 500;
    const visitasParaOro = 10;
    
    const puntosNecesarios = Math.max(0, puntosParaOro - cliente.puntosAcumulados);
    const visitasNecesarias = Math.max(0, visitasParaOro - cliente.totalVisitas);

    console.log(`\n🎯 Requisitos para Oro:`);
    console.log(`- Puntos necesarios: ${puntosNecesarios} (de ${puntosParaOro})`);
    console.log(`- Visitas necesarias: ${visitasNecesarias} (de ${visitasParaOro})`);

    if (cliente.puntosAcumulados >= puntosParaOro || cliente.totalVisitas >= visitasParaOro) {
      console.log('✅ ¡El cliente ya cumple los requisitos para Oro!');
      
      // Probar evaluación manual
      console.log('\n🔄 Ejecutando evaluación manual...');
      const response = await fetch('http://localhost:3001/api/admin/evaluar-nivel-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cliente.cedula })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Resultado de evaluación:', result);
      } else {
        console.log('❌ Error en evaluación:', response.status);
      }
    } else {
      console.log('⏳ El cliente aún no cumple los requisitos');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAutoLevelEvaluation();
