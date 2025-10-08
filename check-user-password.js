const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkUserPassword() {
  try {
    console.log('🔍 Verificando usuario y contraseña...\n');
    
    const user = await prisma.user.findFirst({
      where: { email: 'admin@casadelsabor.com' },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado con ese email');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Activo: ${user.isActive}`);
    console.log(`   Business ID: ${user.businessId}`);
    console.log(`\n📊 Business asociado:`);
    console.log(`   Nombre: ${user.business?.name || 'N/A'}`);
    console.log(`   Subdomain: ${user.business?.subdomain || 'N/A'}`);
    console.log(`   Activo: ${user.business?.isActive || 'N/A'}`);
    
    console.log(`\n🔐 Hash de contraseña en DB:`);
    console.log(`   ${user.passwordHash.substring(0, 50)}...`);

    // Probar contraseñas comunes
    const passwordsToTry = [
      'Admin2024!',
      'admin2024!',
      'Admin123!',
      'admin123',
      'demo123',
      'password123'
    ];

    console.log(`\n🧪 Probando contraseñas comunes:\n`);
    
    for (const pwd of passwordsToTry) {
      const isMatch = await bcrypt.compare(pwd, user.passwordHash);
      if (isMatch) {
        console.log(`   ✅ MATCH ENCONTRADO: "${pwd}"`);
        console.log(`\n╔════════════════════════════════════╗`);
        console.log(`║  CREDENCIALES CORRECTAS:           ║`);
        console.log(`║  Email: ${user.email.padEnd(23)}║`);
        console.log(`║  Password: ${pwd.padEnd(23)}║`);
        console.log(`╚════════════════════════════════════╝\n`);
        return;
      } else {
        console.log(`   ❌ "${pwd}" - No coincide`);
      }
    }

    console.log(`\n⚠️ Ninguna contraseña común funcionó.`);
    console.log(`💡 Puedo crear una nueva contraseña si quieres.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPassword();
