const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 LISTANDO QRS EN QR MANAGER\n');

  try {
    const qrLinks = await prisma.qRLink.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { clicks: true }
        }
      }
    });

    console.log(`📊 Total QRLinks encontrados: ${qrLinks.length}\n`);

    if (qrLinks.length === 0) {
      console.log('❌ NO HAY QRS CREADOS\n');
      console.log('💡 Posibles causas:');
      console.log('   1. Los QRs se están creando pero no se guardan');
      console.log('   2. Error en el API de creación');
      console.log('   3. Problema con la sesión/autenticación\n');
    } else {
      console.log('✅ QRS ENCONTRADOS:\n');
      qrLinks.forEach((qr, index) => {
        console.log(`${index + 1}. ${qr.name}`);
        console.log(`   ID: ${qr.id}`);
        console.log(`   ShortID: ${qr.shortId}`);
        console.log(`   URL: ${qr.targetUrl}`);
        console.log(`   Activo: ${qr.isActive ? '✅' : '❌'}`);
        console.log(`   Clicks: ${qr._count.clicks}`);
        console.log(`   Creado: ${qr.createdAt.toLocaleString()}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
