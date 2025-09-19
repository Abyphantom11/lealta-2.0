const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPromocionSchema() {
  try {
    console.log('🔍 Verificando schema de PortalPromocion...');
    
    // Obtener una promoción para ver sus campos
    const promocion = await prisma.portalPromocion.findFirst();
    
    if (promocion) {
      console.log('📋 Campos disponibles en PortalPromocion:');
      console.log(Object.keys(promocion));
      
      console.log('\n📄 Ejemplo de promoción:');
      console.log(promocion);
    } else {
      console.log('❌ No hay promociones en la BD para verificar schema');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPromocionSchema();
