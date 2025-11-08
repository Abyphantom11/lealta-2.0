const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarTodasLasPromociones() {
  try {
    console.log('🔍 Verificando TODAS las promociones en toda la base de datos\n');
    
    // Contar todas las promociones sin filtrar por businessId
    const totalPromociones = await prisma.portalPromocion.count();
    console.log(`📊 Total promociones en BD: ${totalPromociones}\n`);
    
    if (totalPromociones > 0) {
      // Obtener una muestra
      const promociones = await prisma.portalPromocion.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('📋 Últimas promociones:\n');
      for (const promo of promociones) {
        console.log(`- ${promo.title}`);
        console.log(`  BusinessId: ${promo.businessId}`);
        console.log(`  Día: ${promo.dia}`);
        console.log(`  Active: ${promo.active}`);
        console.log('');
      }
    }
    
    // Verificar businessId de Demo Lealta
    const business = await prisma.business.findFirst({
      where: { name: 'Demo Lealta' }
    });
    
    if (business) {
      console.log(`\n🏢 Demo Lealta ID: ${business.id}`);
      console.log(`   Subdomain: ${business.subdomain}`);
      console.log(`   Slug: ${business.slug || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarTodasLasPromociones();
