const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function actualizarPuntosCliente() {
  try {
    console.log('🔄 Actualizando puntos del cliente con nueva fórmula...');

    // Obtener el cliente
    const cliente = await prisma.cliente.findUnique({
      where: { cedula: '1762075776' },
      include: {
        consumos: true,
      },
    });

    if (!cliente) {
      console.log('❌ Cliente no encontrado');
      return;
    }

    console.log('📊 Estado actual:', {
      nombre: cliente.nombre,
      puntosActuales: cliente.puntos,
      totalGastado: cliente.totalGastado,
      consumos: cliente.consumos.length,
    });

    // Calcular puntos correctos: puntos iniciales (100) + (total gastado × 2)
    const puntosIniciales = 100;
    const puntosDeCompras = cliente.totalGastado * 2;
    const puntosCorrectos = puntosIniciales + puntosDeCompras;

    console.log('🧮 Cálculo de puntos:');
    console.log(`  Puntos iniciales: ${puntosIniciales}`);
    console.log(`  Total gastado: $${cliente.totalGastado}`);
    console.log(
      `  Puntos de compras: ${puntosDeCompras} (${cliente.totalGastado} × 2)`
    );
    console.log(`  Total correcto: ${puntosCorrectos}`);

    // Actualizar cliente
    const clienteActualizado = await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        puntos: puntosCorrectos,
      },
    });

    console.log('✅ Cliente actualizado exitosamente!');
    console.log(
      `🎯 Puntos anteriores: ${cliente.puntos} → Puntos nuevos: ${clienteActualizado.puntos}`
    );

    // También actualizar los puntos en cada consumo existente
    console.log('🔄 Actualizando puntos en consumos existentes...');

    for (const consumo of cliente.consumos) {
      const puntosCorrectosPorConsumo = Math.floor(consumo.total * 2);

      await prisma.consumo.update({
        where: { id: consumo.id },
        data: {
          puntos: puntosCorrectosPorConsumo,
        },
      });

      console.log(
        `  Consumo $${consumo.total}: ${consumo.puntos} → ${puntosCorrectosPorConsumo} puntos`
      );
    }

    console.log('✅ Todos los consumos actualizados!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

actualizarPuntosCliente();
