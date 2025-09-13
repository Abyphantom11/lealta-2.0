const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simularAscensoNivel() {
  try {
    console.log('🎮 Simulando ascenso de nivel automático...');
    
    // Buscar cliente
    const cliente = await prisma.cliente.findFirst({
      where: { cedula: '1762075776' },
      include: { tarjetaLealtad: true }
    });

    console.log('📊 Estado ANTES:');
    console.log(`- Puntos disponibles: ${cliente.puntos}`);
    console.log(`- Puntos acumulados: ${cliente.puntosAcumulados}`);
    console.log(`- Visitas: ${cliente.totalVisitas}`);
    console.log(`- Nivel: ${cliente.tarjetaLealtad?.nivel || 'Sin tarjeta'}`);

    // Opción 1: Simular que gana suficientes puntos (350 más para llegar a 500)
    const puntosNecesarios = 500 - cliente.puntosAcumulados;
    
    console.log(`\n💰 Agregando ${puntosNecesarios} puntos para alcanzar 500...`);
    
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        puntos: { increment: puntosNecesarios },
        puntosAcumulados: { increment: puntosNecesarios }
      }
    });

    // Simular evaluación automática (como se haría en un consumo real)
    console.log('🔄 Disparando evaluación automática...');
    
    const response = await fetch('http://localhost:3001/api/admin/evaluar-nivel-cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula: cliente.cedula })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('🎉 Resultado de evaluación:', result);
      
      if (result.actualizado) {
        console.log(`🆙 ¡ASCENSO! ${result.nivelAnterior} → ${result.nivelNuevo}`);
      }
    }

    // Verificar estado final
    const clienteFinal = await prisma.cliente.findFirst({
      where: { cedula: '1762075776' },
      include: { tarjetaLealtad: true }
    });

    console.log('\n📊 Estado DESPUÉS:');
    console.log(`- Puntos disponibles: ${clienteFinal.puntos}`);
    console.log(`- Puntos acumulados: ${clienteFinal.puntosAcumulados}`);
    console.log(`- Visitas: ${clienteFinal.totalVisitas}`);
    console.log(`- Nivel: ${clienteFinal.tarjetaLealtad?.nivel || 'Sin tarjeta'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simularAscensoNivel();
