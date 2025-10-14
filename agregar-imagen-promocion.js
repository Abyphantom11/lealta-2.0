/**
 * Script para agregar imagen a la promoción que no tiene imagen
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function agregarImagenPromocion() {
  console.log('🖼️ AGREGANDO IMAGEN A LA PROMOCIÓN SIN IMAGEN');
  console.log('==============================================');
  
  try {
    const businessId = 'cmgf5px5f0000eyy0elci9yds';
    
    // Buscar la promoción sin imagen para lunes
    const promocion = await prisma.portalPromocion.findFirst({
      where: {
        businessId: businessId,
        dia: 'lunes',
        active: true,
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      }
    });
    
    if (!promocion) {
      console.log('❌ No se encontró promoción sin imagen para lunes');
      return;
    }
    
    console.log(`📝 Promoción encontrada: "${promocion.title}"`);
    
    // URL de imagen de ejemplo (puedes cambiarla por una real)
    const imageUrl = 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&q=80';
    
    // Actualizar la promoción con imagen
    const promocionActualizada = await prisma.portalPromocion.update({
      where: { id: promocion.id },
      data: { imageUrl: imageUrl }
    });
    
    console.log(`✅ Promoción actualizada con imagen:`);
    console.log(`   - Título: ${promocionActualizada.title}`);
    console.log(`   - Imagen: ${promocionActualizada.imageUrl}`);
    console.log(`   - Día: ${promocionActualizada.dia}`);
    
    console.log('\n🎯 AHORA AMBOS ELEMENTOS DEBERÍAN MOSTRARSE EN EL CLIENTE:');
    console.log('   📢 1 Banner con imagen ✅');
    console.log('   🎁 1 Promoción con imagen ✅');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

agregarImagenPromocion();
