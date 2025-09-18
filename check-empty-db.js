const { PrismaClient } = require('@prisma/client');

async function checkDB() {
  const prisma = new PrismaClient();
  
  try {
    const business = await prisma.business.findFirst();
    const user = await prisma.user.findFirst();
    
    console.log('=== Estado Detallado de la Base de Datos ===');
    console.log('\nBusiness:', JSON.stringify(business, null, 2));
    console.log('\nUser:', JSON.stringify(user, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
