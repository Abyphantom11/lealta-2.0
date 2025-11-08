const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const business = await prisma.business.findFirst({
    where: { name: { contains: 'Demo' } },
    include: { Location: true, User: true }
  });
  
  console.log('Business:', business.name);
  console.log('Locations:', business.Location.length);
  console.log('Users:', business.User.length);
  
  if (business.Location.length > 0) {
    console.log('Location ID:', business.Location[0].id);
  }
  if (business.User.length > 0) {
    console.log('User ID:', business.User[0].id);
  }
}

check().then(() => prisma.$disconnect());
