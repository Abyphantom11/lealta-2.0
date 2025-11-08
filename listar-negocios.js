const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, slug: true }
  });
  
  console.log('Negocios encontrados:\n');
  businesses.forEach(b => {
    console.log('  -', b.name);
    console.log('    ID:', b.id);
    console.log('    Slug:', b.slug, '\n');
  });
}

check().then(() => prisma.$disconnect());
