const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugClientRegistration() {
  try {
    console.log('🔍 Debugging client registration...\n');

    // 1. Verificar businesses existentes
    console.log('📊 Businesses en la base de datos:');
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true,
      }
    });
    
    if (businesses.length === 0) {
      console.log('❌ No hay businesses en la base de datos');
    } else {
      businesses.forEach(business => {
        console.log(`  - ${business.name} (ID: ${business.id}, slug: ${business.slug}, subdomain: ${business.subdomain}, active: ${business.isActive})`);
      });
    }

    console.log('\n📊 Clientes registrados:');
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        cedula: true,
        nombre: true,
        businessId: true,
        registeredAt: true,
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    if (clientes.length === 0) {
      console.log('❌ No hay clientes registrados');
    } else {
      clientes.forEach(cliente => {
        console.log(`  - ${cliente.nombre} (${cliente.cedula}) - BusinessId: ${cliente.businessId} - Registrado: ${cliente.registeredAt}`);
      });
    }

    console.log('\n📊 Usuarios admin:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        businessId: true,
        role: true,
      }
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios admin');
    } else {
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - BusinessId: ${user.businessId}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugClientRegistration();