const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImageUrls() {
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  
  const banners = await prisma.portalBanner.findMany({
    where: { businessId, active: true },
    select: { title: true, imageUrl: true }
  });
  
  const favoritos = await prisma.portalFavoritoDelDia.findMany({
    where: { businessId, active: true },
    select: { productName: true, imageUrl: true }
  });
  
  console.log('🖼️ VERIFICANDO URLs DE IMÁGENES:');
  console.log('================================');
  
  console.log('\n📢 BANNERS:');
  banners.forEach(banner => {
    console.log(`Title: ${banner.title}`);
    console.log(`URL  : ${banner.imageUrl || 'NO IMAGE'}`);
    console.log(`Valid: ${banner.imageUrl && banner.imageUrl.trim() !== '' ? '✅' : '❌'}`);
    console.log('---');
  });
  
  console.log('\n⭐ FAVORITOS:');
  favoritos.forEach(fav => {
    console.log(`Name : ${fav.productName}`);
    console.log(`URL  : ${fav.imageUrl || 'NO IMAGE'}`);
    console.log(`Valid: ${fav.imageUrl && fav.imageUrl.trim() !== '' ? '✅' : '❌'}`);
    console.log('---');
  });
  
  await prisma.$disconnect();
}

checkImageUrls().catch(console.error);
