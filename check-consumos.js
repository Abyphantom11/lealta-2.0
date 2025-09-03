const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentConsumos() {
  try {
    console.log('Verificando consumos recientes...');

    const consumos = await prisma.consumo.findMany({
      orderBy: {
        registeredAt: 'desc',
      },
      take: 10,
      include: {
        cliente: {
          select: {
            nombre: true,
            cedula: true,
          },
        },
        empleado: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`📊 Total consumos encontrados: ${consumos.length}`);

    if (consumos.length === 0) {
      console.log('❌ No hay consumos en la base de datos');
      return;
    }

    console.log('\n🔍 Últimos consumos:');
    consumos.forEach((consumo, index) => {
      console.log(
        `${index + 1}. ${consumo.registeredAt.toISOString()} - Cliente: ${consumo.cliente.nombre} (${consumo.cliente.cedula}) - Total: $${consumo.total} - Empleado: ${consumo.empleado.name || 'N/A'} - Tipo: ${consumo.ocrText?.startsWith('MANUAL:') ? 'MANUAL' : 'OCR'}`
      );
    });

    // Verificar también clientes
    const totalClientes = await prisma.cliente.count();
    console.log(`\n👥 Total clientes: ${totalClientes}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentConsumos();
