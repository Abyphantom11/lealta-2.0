const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminPassword() {
  try {
    console.log('🔍 Buscando usuario SUPERADMIN de Love Me Sky...\n');

    const user = await prisma.user.findFirst({
      where: {
        email: 'christian.valdivieso@gmail.com',
        role: 'SUPERADMIN',
        business: {
          name: {
            contains: 'love me sky',
            mode: 'insensitive'
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        isActive: true,
        createdAt: true,
        business: {
          select: {
            name: true,
            subdomain: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Activo: ${user.isActive ? '✅' : '❌'}`);
    console.log(`   Business: ${user.business.name}`);
    console.log(`   Subdomain: ${user.business.subdomain}`);
    console.log(`   Creado: ${user.createdAt}`);
    console.log(`\n🔐 Password Hash: ${user.passwordHash}`);
    console.log('\n⚠️  NOTA: La contraseña está encriptada con bcrypt.');
    console.log('   No se puede desencriptar, solo verificar con bcrypt.compare()');
    console.log('   Si necesitas resetearla, podemos crear una nueva.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPassword();
