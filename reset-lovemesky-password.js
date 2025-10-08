const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    console.log('🔄 Reseteando contraseña del superadmin de Love Me Sky...\n');

    // Nueva contraseña
    const newPassword = 'lovemesky123';
    
    // Hashear la nueva contraseña
    console.log('🔐 Generando hash de la nueva contraseña...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('✅ Hash generado\n');

    // Buscar y actualizar el usuario
    const user = await prisma.user.findFirst({
      where: {
        email: 'christian.valdivieso@gmail.com',
        role: 'SUPERADMIN'
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    // Actualizar la contraseña
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        passwordHash: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        business: {
          select: {
            name: true,
            subdomain: true
          }
        }
      }
    });

    console.log('✅ ¡Contraseña actualizada exitosamente!\n');
    console.log('📋 Detalles del usuario:');
    console.log(`   Nombre: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Business: ${updatedUser.business.name}`);
    console.log('');
    console.log('🔑 Nuevas credenciales de acceso:');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('');
    console.log(`🌐 URL de login: https://${updatedUser.business.subdomain}.lealta.app/login`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
