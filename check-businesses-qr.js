const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        qrBrandingConfig: true,
      },
    });

    console.log('\n📊 Negocios en la base de datos:');
    console.log('Total:', businesses.length);
    console.log('\nListado:');
    businesses.forEach((b, i) => {
      console.log(`\n${i + 1}. ${b.name}`);
      console.log(`   ID: ${b.id}`);
      console.log(`   QR Config: ${b.qrBrandingConfig ? 'Sí tiene' : 'No tiene'}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkBusinesses();
