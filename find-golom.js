const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findGolom() {
  try {
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: 'golom', mode: 'insensitive' } },
          { slug: { contains: 'golom', mode: 'insensitive' } },
        ]
      }
    });

    console.log('Negocios encontrados:');
    console.log(JSON.stringify(businesses, null, 2));

    if (businesses.length === 0) {
      console.log('\n❌ No se encontró el business Golom');
      console.log('Buscando todos los businesses...\n');
      
      const allBusinesses = await prisma.business.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          subdomain: true,
        }
      });
      
      console.log('Todos los businesses:');
      allBusinesses.forEach(b => {
        console.log(`  - ${b.name} (${b.slug}) - ID: ${b.id}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findGolom();
