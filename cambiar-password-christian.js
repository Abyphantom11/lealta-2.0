/**
 * Script para cambiar la contraseña de un usuario específico
 * Usuario: christian.valdivieso@icoud.com (LOVE ME MANTA)
 * Nueva contraseña: lovemesky123
 */

/* eslint-disable unicorn/prefer-top-level-await */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Script principal
void (async function cambiarPassword() {
  try {
    console.log('🔍 Buscando usuario con email: christian.valdivieso@icoud.com...');
    
    // Buscar usuario por email (usando findFirst porque no hay unique en email solo)
    const user = await prisma.user.findFirst({
      where: {
        email: 'christian.valdivieso@icoud.com'
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado con ese email');
      return;
    }

    console.log('\n✅ Usuario encontrado:');
    console.log('   ID:', user.id);
    console.log('   Nombre:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Business:', user.business?.name || 'N/A');
    console.log('   Subdomain:', user.business?.subdomain || 'N/A');

    // Generar hash de la nueva contraseña
    console.log('\n🔐 Generando hash de la nueva contraseña...');
    const newPassword = 'lovemesky123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    console.log('💾 Actualizando contraseña en la base de datos...');
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        passwordHash: hashedPassword
      }
    });

    console.log('\n✅ ¡Contraseña actualizada exitosamente!');
    console.log('📧 Email:', user.email);
    console.log('🔑 Nueva contraseña:', newPassword);
    console.log('\n🎉 El usuario ya puede iniciar sesión con la nueva contraseña.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
