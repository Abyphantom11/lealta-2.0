// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncPuntosAcumulados() {
  try {
    console.log('🔄 Sincronizando puntos acumulados...');
    
    // Obtener todos los clientes
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        cedula: true,
        puntos: true,
        puntosAcumulados: true
      }
    });

    console.log(`📊 Encontrados ${clientes.length} clientes`);

    // Actualizar puntosAcumulados para que coincida con puntos actuales
    // (asumiendo que no han canjeado aún)
    for (const cliente of clientes) {
      if (cliente.puntosAcumulados === 0 && cliente.puntos > 0) {
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: { puntosAcumulados: cliente.puntos }
        });
        console.log(`✅ Cliente ${cliente.cedula}: puntos acumulados = ${cliente.puntos}`);
      }
    }

    console.log('🎉 Sincronización completada');
  } catch (error) {
    console.error('❌ Error sincronizando:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncPuntosAcumulados();
