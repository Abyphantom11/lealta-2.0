const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function searchBusiness() {
  try {
    console.log('🔍 Buscando business "love me sky"...\n');
    
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { name: { contains: 'love me sky', mode: 'insensitive' } },
          { name: { contains: 'lovemesky', mode: 'insensitive' } },
          { subdomain: { contains: 'lovemesky', mode: 'insensitive' } },
          { slug: { contains: 'lovemesky', mode: 'insensitive' } }
        ]
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (business) {
      console.log('✅ Business encontrado:\n');
      console.log(`   ID: ${business.id}`);
      console.log(`   Nombre: ${business.name}`);
      console.log(`   Subdomain: ${business.subdomain}`);
      console.log(`   Slug: ${business.slug}`);
      console.log(`   Email: ${business.email}`);
      console.log(`   Activo: ${business.isActive ? '✅' : '❌'}`);
      console.log(`   Plan: ${business.subscriptionPlan}`);
      console.log(`   Creado: ${business.createdAt}`);
      
      console.log('\n👥 Usuarios asociados:\n');
      business.users.forEach(user => {
        console.log(`   - ${user.name || 'Sin nombre'}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Role: ${user.role}`);
        console.log(`     Activo: ${user.isActive ? '✅' : '❌'}`);
        console.log('');
      });
    } else {
      console.log('❌ Business "love me sky" no encontrado\n');
      
      // Buscar negocios similares
      console.log('🔍 Buscando negocios similares con "love" o "sky"...\n');
      const similar = await prisma.business.findMany({
        where: {
          OR: [
            { name: { contains: 'love', mode: 'insensitive' } },
            { name: { contains: 'sky', mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          isActive: true
        }
      });

      if (similar.length > 0) {
        console.log(`📋 ${similar.length} negocios similares encontrados:\n`);
        similar.forEach(b => {
          console.log(`   - ${b.name}`);
          console.log(`     Subdomain: ${b.subdomain}`);
          console.log(`     Activo: ${b.isActive ? '✅' : '❌'}`);
          console.log('');
        });
      } else {
        console.log('No se encontraron negocios similares.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

searchBusiness();
