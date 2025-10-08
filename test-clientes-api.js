// Test la API de clientes simulando la request del admin
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testClientesAPI() {
  try {
    // Simular la sesión del admin
    const session = {
      userId: 'cmgf5pxbs0002eyy02tesra8d',
      businessId: 'cmgf5px5f0000eyy0elci9yds', // ID numérico
      email: 'admin@casadelsabor.com',
      role: 'SUPERADMIN'
    };

    console.log('🔍 Sesión simulada:');
    console.log(JSON.stringify(session, null, 2));

    // Buscar clientes usando el businessId de la sesión
    const clientes = await prisma.cliente.findMany({
      where: {
        businessId: session.businessId // ID numérico
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        puntos: true,
        businessId: true
      }
    });

    console.log(`\n✅ CLIENTES ENCONTRADOS: ${clientes.length}`);
    if (clientes.length > 0) {
      console.log('\nPrimeros 3 clientes:');
      clientes.slice(0, 3).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.nombre} - ${c.puntos} pts (businessId: ${c.businessId})`);
      });
    }

    // Verificar si el businessId de la sesión coincide con el de los clientes
    const businessMatches = clientes.every(c => c.businessId === session.businessId);
    console.log(`\n🔐 BusinessId coincide: ${businessMatches}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testClientesAPI();
