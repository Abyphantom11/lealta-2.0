const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const business = await prisma.business.findFirst({
    where: {
      OR: [
        { subdomain: 'casasabordemo' },
        { slug: 'casasabordemo' }
      ]
    }
  });
  
  console.log('Business encontrado:', business);
  
  if (!business) {
    // Buscar el business que creamos
    const demoBusiness = await prisma.business.findUnique({
      where: { id: 'cmgf5px5f0000eyy0elci9yds' }
    });
    console.log('\nBusiness demo real:', demoBusiness);
  }
}

test().finally(() => prisma.$disconnect());
