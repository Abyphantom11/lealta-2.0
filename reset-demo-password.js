const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const newPassword = 'Admin2024!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('🔄 Actualizando contraseña del usuario...\n');
    
    const user = await prisma.user.update({
      where: {
        businessId_email: {
          businessId: 'cmgf5px5f0000eyy0elci9yds',
          email: 'admin@casadelsabor.com'
        }
      },
      data: {
        passwordHash: hashedPassword,
        loginAttempts: 0,
        lockedUntil: null
      }
    });

    console.log('✅ Contraseña actualizada correctamente!\n');
    console.log('╔════════════════════════════════════╗');
    console.log('║  NUEVAS CREDENCIALES:              ║');
    console.log('║                                    ║');
    console.log(`║  📧 Email: ${user.email.padEnd(21)}║`);
    console.log(`║  🔑 Password: Admin2024!           ║`);
    console.log('║                                    ║');
    console.log('║  🔗 Login URL:                     ║');
    console.log('║  https://lealta-9ihr8l471-...      ║');
    console.log('║  ...themaster2648-9501s-projects   ║');
    console.log('║  .vercel.app/login                 ║');
    console.log('╚════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
