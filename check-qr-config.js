const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQRConfig() {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        qrBrandingConfig: true,
      },
    });

    console.log('\n📊 Configuración QR de cada negocio:\n');
    
    for (const b of businesses) {
      console.log(`\n🏢 ${b.name}`);
      console.log(`ID: ${b.id}`);
      console.log('\nqrBrandingConfig:');
      console.log(JSON.stringify(b.qrBrandingConfig, null, 2));
      console.log('\n' + '='.repeat(60));
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkQRConfig();
