/**
 * Script para encontrar el businessId correcto para casa-sabor-demo
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function encontrarBusinessId() {
  console.log('🔍 BUSCANDO BUSINESS ID CORRECTO PARA casa-sabor-demo');
  console.log('=====================================================');
  
  try {
    // Buscar en la tabla Business
    console.log('\n📋 BUSCANDO EN TABLA Business:');
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { subdomain: 'casa-sabor-demo' },
          { id: 'cmgf5px5f0000eyy0elci9yds' },
          { id: 'cmgh621rd0012lb0aixrzpvrw' }
        ]
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        isActive: true
      }
    });
    
    businesses.forEach(b => {
      console.log(`  - ID: ${b.id}`);
      console.log(`    Nombre: ${b.name}`);
      console.log(`    Subdomain: ${b.subdomain}`);
      console.log(`    Activo: ${b.isActive}`);
      console.log('');
    });
    
    // Verificar qué businessId tiene elementos
    console.log('\n🎯 VERIFICANDO QUÉ BUSINESS TIENE ELEMENTOS:');
    
    const businessIds = [
      'cmgf5px5f0000eyy0elci9yds', // El que usa el cliente
      'cmgh621rd0012lb0aixrzpvrw'  // El que tiene datos
    ];
    
    for (const businessId of businessIds) {
      console.log(`\n--- BusinessId: ${businessId} ---`);
      
      const [banners, promociones, favoritos] = await Promise.all([
        prisma.portalBanner.count({ where: { businessId, active: true } }),
        prisma.portalPromocion.count({ where: { businessId, active: true } }),
        prisma.portalFavoritoDelDia.count({ where: { businessId, active: true } })
      ]);
      
      console.log(`  📢 Banners activos: ${banners}`);
      console.log(`  🎁 Promociones activas: ${promociones}`);
      console.log(`  ⭐ Favoritos activos: ${favoritos}`);
      
      if (banners + promociones + favoritos > 0) {
        console.log(`  ✅ ESTE BUSINESS TIENE ELEMENTOS`);
      } else {
        console.log(`  ❌ Este business no tiene elementos`);
      }
    }
    
    console.log('\n🔧 DIAGNÓSTICO:');
    console.log('El problema es que el cliente está consultando con un businessId');
    console.log('diferente al que tiene los datos guardados.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

encontrarBusinessId();
