const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllSchemas() {
  try {
    console.log('🔍 Verificando schemas de todas las tablas portal...');
    
    // Verificar Banner
    const banner = await prisma.portalBanner.findFirst();
    if (banner) {
      console.log('\n📋 Campos en PortalBanner:');
      console.log(Object.keys(banner));
    }
    
    // Verificar FavoritoDelDia
    const favorito = await prisma.portalFavoritoDelDia.findFirst();
    if (favorito) {
      console.log('\n📋 Campos en PortalFavoritoDelDia:');
      console.log(Object.keys(favorito));
    }
    
    // Verificar Recompensa
    const recompensa = await prisma.portalRecompensa.findFirst();
    if (recompensa) {
      console.log('\n📋 Campos en PortalRecompensa:');
      console.log(Object.keys(recompensa));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllSchemas();
