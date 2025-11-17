const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Buscando usuarios en la base de datos...\n');
    
    const users = await prisma.user.findMany({
      include: {
        business: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            slug: true,
            isActive: true,
          }
        }
      },
      take: 5
    });
    
    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios');
    } else {
      console.log(`✅ Se encontraron ${users.length} usuarios:\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Activo: ${user.isActive}`);
        console.log(`   Business: ${user.business.name} (${user.business.subdomain})`);
        console.log(`   Business Activo: ${user.business.isActive}`);
        console.log('');
      });
    }
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUsers();
