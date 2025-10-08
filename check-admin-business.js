// Verificar cómo debe buscar el admin el business
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminBusiness() {
  try {
    // Buscar el admin
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@casadelsabor.com' },
      select: {
        id: true,
        email: true,
        role: true,
        businessId: true,
        business: {
          select: {
            id: true,
            slug: true,
            subdomain: true,
            name: true
          }
        }
      }
    });

    console.log('\n🔍 ADMIN INFO:');
    console.log(JSON.stringify(admin, null, 2));

    // Buscar clientes con el businessId del admin
    const clientesPorId = await prisma.cliente.findMany({
      where: { businessId: admin.businessId },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        businessId: true
      }
    });

    console.log(`\n📊 CLIENTES USANDO businessId (${admin.businessId}):`);
    console.log(`Total: ${clientesPorId.length}`);

    // Buscar clientes con el slug del business
    if (admin.business?.slug) {
      const clientesPorSlug = await prisma.cliente.findMany({
        where: { businessId: admin.business.slug },
        select: {
          id: true,
          cedula: true,
          nombre: true,
          businessId: true
        }
      });

      console.log(`\n📊 CLIENTES USANDO slug (${admin.business.slug}):`);
      console.log(`Total: ${clientesPorSlug.length}`);
    }

    // Buscar clientes con el subdomain del business
    if (admin.business?.subdomain) {
      const clientesPorSubdomain = await prisma.cliente.findMany({
        where: { businessId: admin.business.subdomain },
        select: {
          id: true,
          cedula: true,
          nombre: true,
          businessId: true
        }
      });

      console.log(`\n📊 CLIENTES USANDO subdomain (${admin.business.subdomain}):`);
      console.log(`Total: ${clientesPorSubdomain.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminBusiness();
