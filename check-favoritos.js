const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFavoritos() {
  try {
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('🔍 FAVORITOS EN BASE DE DATOS:');
    console.log('Total:', favoritos.length);
    
    favoritos.forEach((fav, idx) => {
      console.log(`${idx + 1}. BusinessId: ${fav.businessId}`);
      console.log(`   ID: ${fav.id}`);  
      console.log(`   Nombre: ${fav.productName}`);
      console.log(`   Día: ${fav.dia}`);
      console.log(`   Activo: ${fav.active}`);
      console.log(`   Fecha: ${fav.date}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFavoritos();
