const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upgradeJenniferToAdmin() {
  try {
    console.log('🔄 Actualizando Jennifer Zambrano a ADMIN...\n');
    
    // Buscar el usuario
    const user = await prisma.user.findFirst({
      where: {
        email: 'ventas@lovemegroupec.com'
      },
      include: {
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

    console.log('📋 Usuario encontrado:');
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role actual: ${user.role}`);
    console.log(`   Business: ${user.business.name}`);
    console.log('');

    // Actualizar a ADMIN
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        role: 'ADMIN'
      }
    });

    console.log('✅ Usuario actualizado exitosamente!\n');
    console.log('📊 Nuevo estado:');
    console.log(`   Nombre: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Role nuevo: ${updatedUser.role} 🎉`);
    console.log('');
    console.log('🔑 Ahora Jennifer puede:');
    console.log('   ✓ Acceder al dashboard admin completo');
    console.log('   ✓ Gestionar clientes y reservas');
    console.log('   ✓ Ver estadísticas y reportes');
    console.log('   ✓ Configurar el portal cliente');
    console.log('   ✓ Gestionar promociones y recompensas');
    console.log('');
    console.log(`🌐 URL de acceso: https://${user.business.subdomain}.lealta.app/admin`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeJenniferToAdmin();
