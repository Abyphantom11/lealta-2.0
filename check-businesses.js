const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true, subdomain: true }
    });
    
    console.log('📊 Businesses en la base de datos:');
    businesses.forEach(business => {
      console.log(`  ${business.id}: ${business.name} (subdomain: ${business.subdomain})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinesses();
