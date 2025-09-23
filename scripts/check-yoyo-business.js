const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkYoyoBusiness() {
  try {
    console.log('🔍 Verificando business "yoyo"...\n');

    // Buscar el business "yoyo"
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { slug: 'yoyo' },
          { subdomain: 'yoyo' },
          { name: 'yoyo' }
        ]
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!business) {
      console.log('❌ Business "yoyo" no encontrado');
      return;
    }

    console.log('✅ Business encontrado:');
    console.log(`  - ID: ${business.id}`);
    console.log(`  - Nombre: ${business.name}`);
    console.log(`  - Slug: ${business.slug}`);
    console.log(`  - Subdomain: ${business.subdomain}`);
    console.log(`  - Activo: ${business.isActive}`);
    console.log(`  - Usuarios: ${business.users.length}`);

    if (business.users.length > 0) {
      console.log('\n👥 Usuarios del business:');
      business.users.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
    }

    // Verificar clientes del business
    const clientes = await prisma.cliente.findMany({
      where: {
        businessId: business.id
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        registeredAt: true
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    console.log(`\n📊 Clientes del business: ${clientes.length}`);
    if (clientes.length > 0) {
      console.log('Últimos clientes registrados:');
      clientes.slice(0, 5).forEach(cliente => {
        console.log(`  - ${cliente.nombre} (${cliente.cedula}) - ${cliente.registeredAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkYoyoBusiness();