const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Verificando business "mondongo"...');
    
    // Buscar el business mondongo
    const mondongo = await prisma.business.findUnique({
      where: { slug: 'mondongo' },
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { name: true, email: true }
        }
      }
    });
    
    if (mondongo) {
      console.log('✅ Business "mondongo" encontrado:');
      console.log(`   - ID: ${mondongo.id}`);
      console.log(`   - Nombre: ${mondongo.name}`);
      console.log(`   - Slug: ${mondongo.slug}`);
      console.log(`   - Activo: ${mondongo.isActive}`);
      console.log(`   - Admins: ${mondongo.users.length}`);
      mondongo.users.forEach(user => {
        console.log(`     - ${user.name} (${user.email})`);
      });
    } else {
      console.log('❌ Business "mondongo" NO encontrado');
      console.log('🔧 Creando business "mondongo"...');
      
      // Crear el business mondongo
      const newBusiness = await prisma.business.create({
        data: {
          name: 'Mondongo',
          slug: 'mondongo',
          subdomain: 'mondongo',
          isActive: true,
          users: {
            create: {
              name: 'Admin Mondongo',
              email: 'admin@mondongo.com',
              passwordHash: '$2b$10$K7YXG8CqPhHqGYXLXvNX.OQz1YAOhNT9uW7u9bLgFHgVHYqHgJ.z6', // password123
              role: 'ADMIN',
              isActive: true
            }
          }
        },
        include: {
          users: true
        }
      });
      
      console.log('✅ Business "mondongo" creado exitosamente:');
      console.log(`   - ID: ${newBusiness.id}`);
      console.log(`   - Nombre: ${newBusiness.name}`);
      console.log(`   - Slug: ${newBusiness.slug}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
