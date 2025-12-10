/* eslint-disable unicorn/prefer-top-level-await */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

void (async function buscarChristian() {
  try {
    console.log('🔍 Buscando usuarios con "christian" en el email...\n');
    
    const users = await prisma.user.findMany({
      where: {
        email: { 
          contains: 'christian', 
          mode: 'insensitive' 
        }
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

    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios con "christian" en el email');
      
      // Intentar buscar por nombre también
      console.log('\n🔍 Buscando por nombre "christian"...\n');
      const usersByName = await prisma.user.findMany({
        where: {
          name: { 
            contains: 'christian', 
            mode: 'insensitive' 
          }
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

      if (usersByName.length === 0) {
        console.log('❌ Tampoco se encontraron por nombre');
      } else {
        console.log(`✅ Encontrados ${usersByName.length} usuario(s) por nombre:\n`);
        usersByName.forEach((user, index) => {
          console.log(`Usuario #${index + 1}:`);
          console.log('   ID:', user.id);
          console.log('   Nombre:', user.name);
          console.log('   Email:', user.email);
          console.log('   Role:', user.role);
          console.log('   Business:', user.business?.name || 'N/A');
          console.log('   Subdomain:', user.business?.subdomain || 'N/A');
          console.log('   Activo:', user.isActive);
          console.log('');
        });
      }
    } else {
      console.log(`✅ Encontrados ${users.length} usuario(s) con "christian" en el email:\n`);
      users.forEach((user, index) => {
        console.log(`Usuario #${index + 1}:`);
        console.log('   ID:', user.id);
        console.log('   Nombre:', user.name);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Business:', user.business?.name || 'N/A');
        console.log('   Subdomain:', user.business?.subdomain || 'N/A');
        console.log('   Activo:', user.isActive);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
