const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getBusiness() {
  const business = await prisma.business.findFirst();
  console.log('Business ID:', business.id);
  await prisma.$disconnect();
}

getBusiness().catch(console.error);
