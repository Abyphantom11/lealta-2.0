const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBusiness() {
  try {
    const businesses = await prisma.business.findMany();
    console.log('Negocios en la base de datos:', businesses);
    
    // Si no hay negocios, crear uno
    if (businesses.length === 0) {
      const business = await prisma.business.create({
        data: {
          id: 'business_1',
          name: 'Lealta Club',
          slug: 'lealta-club',
          subdomain: 'lealta-club'
        }
      });
      console.log('Negocio creado:', business);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusiness();
