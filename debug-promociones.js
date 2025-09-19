const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPromociones() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🔍 Depurando promociones...');
    
    // Verificar datos en PostgreSQL
    const promocionesDB = await prisma.portalPromocion.findMany({
      where: { businessId }
    });
    
    console.log(`\n📊 Promociones en la base de datos: ${promocionesDB.length}`);
    promocionesDB.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title}`);
      console.log(`     ID: ${p.id}`);
      console.log(`     Activo: ${p.active}`);
      console.log(`     Descuento: ${p.discount}`);
      console.log(`     ValidUntil: ${p.validUntil}`);
      console.log(`     Business: ${p.businessId}`);
      console.log('');
    });
    
    // Verificar el filtro de validUntil
    const now = new Date();
    console.log(`\n🕐 Fecha actual: ${now.toISOString()}`);
    
    const promocionesActivas = await prisma.portalPromocion.findMany({
      where: {
        businessId,
        active: true,
        OR: [
          { validUntil: null }, // Sin fecha de vencimiento
          { validUntil: { gte: new Date() } } // Vigentes
        ]
      }
    });
    
    console.log(`\n🎯 Promociones activas y vigentes: ${promocionesActivas.length}`);
    promocionesActivas.forEach(p => {
      console.log(`  - ${p.title} (validUntil: ${p.validUntil || 'sin límite'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPromociones();
