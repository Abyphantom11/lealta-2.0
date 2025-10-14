const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPromos() {
  try {
    console.log('🔍 Verificando promociones en PostgreSQL...');
    
    const promociones = await prisma.portalPromocion.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Total promociones: ${promociones.length}`);
    
    if (promociones.length > 0) {
      console.log('\n📋 Promociones encontradas:');
      promociones.forEach((p, i) => {
        console.log(`  ${i+1}. "${p.title}" (Business: ${p.businessId})`);
      });
    } else {
      console.log('❌ No hay promociones en PostgreSQL');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPromos();
