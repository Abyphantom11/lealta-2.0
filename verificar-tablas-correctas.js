const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarTablasCorrectas() {
  try {
    const banners = await prisma.portalBanner.count();
    const promociones = await prisma.portalPromocion.count();  
    const favoritos = await prisma.portalFavoritoDelDia.count();
    
    console.log('✅ Conteos de tablas correctas:');
    console.log(`📢 PortalBanner: ${banners}`);
    console.log(`🎁 PortalPromocion: ${promociones}`);
    console.log(`⭐ PortalFavoritoDelDia: ${favoritos}`);
    
    if (banners + promociones + favoritos === 0) {
      console.log('\n❌ NO HAY DATOS CONFIGURADOS');
      console.log('🔧 Necesitas configurar elementos desde el admin');
    } else {
      console.log('\n✅ HAY DATOS CONFIGURADOS');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarTablasCorrectas();
