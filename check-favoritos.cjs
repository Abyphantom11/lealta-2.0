const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFavoritos() {
  try {
    console.log('🔍 Verificando favoritos del día en PostgreSQL...');
    
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Total favoritos: ${favoritos.length}`);
    
    if (favoritos.length > 0) {
      console.log('\n📋 Favoritos encontrados:');
      favoritos.forEach((f, i) => {
        console.log(`  ${i+1}. "${f.productName}" (Business: ${f.businessId}) - Día: ${f.dia}`);
      });
    } else {
      console.log('❌ No hay favoritos del día en PostgreSQL');
      console.log('💡 Esto explica por qué el favorito "asdad" no se sincroniza');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFavoritos();
