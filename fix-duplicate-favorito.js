const { PrismaClient } = require('@prisma/client');

async function fixDuplicateFavorito() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Buscando favoritos duplicados para business cmgf5px5f0000eyy0elci9yds...');
    
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: {
        businessId: 'cmgf5px5f0000eyy0elci9yds',
        active: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`📊 Encontrados ${favoritos.length} favoritos activos:`);
    favoritos.forEach((fav, index) => {
      console.log(`   ${index + 1}. ID: ${fav.id} | Día: ${fav.dia} | Producto: ${fav.productName} | Creado: ${fav.createdAt}`);
    });
    
    if (favoritos.length > 1) {
      // Mantener el primer favorito (más antiguo) y desactivar los demás
      const favoritoToKeep = favoritos[0];
      const favoritosToDeactivate = favoritos.slice(1);
      
      console.log(`\n✅ Manteniendo favorito: ${favoritoToKeep.id} (${favoritoToKeep.productName})`);
      console.log(`❌ Desactivando ${favoritosToDeactivate.length} favorito(s) duplicado(s):`);
      
      for (const fav of favoritosToDeactivate) {
        console.log(`   - Desactivando: ${fav.id} (${fav.productName})`);
        
        await prisma.portalFavoritoDelDia.update({
          where: { id: fav.id },
          data: { active: false }
        });
      }
      
      console.log('\n🎉 ¡Favoritos duplicados corregidos exitosamente!');
      
      // Verificar el resultado
      const favoritosActivos = await prisma.portalFavoritoDelDia.findMany({
        where: {
          businessId: 'cmgf5px5f0000eyy0elci9yds',
          active: true
        }
      });
      
      console.log(`\n📋 Resultado final: ${favoritosActivos.length} favorito(s) activo(s)`);
      favoritosActivos.forEach((fav, index) => {
        console.log(`   ${index + 1}. ID: ${fav.id} | Día: ${fav.dia} | Producto: ${fav.productName}`);
      });
      
    } else {
      console.log('\n✅ No hay favoritos duplicados para corregir.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateFavorito();
