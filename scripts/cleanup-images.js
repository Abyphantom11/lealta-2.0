/**
 * 🔧 SCRIPT DE LIMPIEZA SIMPLE
 * Remueve imágenes corruptas del carrusel de branding
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupCorruptedImages() {
  console.log('🧹 Iniciando limpieza de imágenes corruptas...');
  
  try {
    const brandingConfigs = await prisma.brandingConfig.findMany({
      select: {
        id: true,
        businessId: true,
        businessName: true,
        carouselImages: true
      }
    });

    console.log(`📊 Encontradas ${brandingConfigs.length} configuraciones`);

    for (const config of brandingConfigs) {
      if (!config.carouselImages || config.carouselImages.length === 0) {
        continue;
      }

      console.log(`\n🔍 Procesando: ${config.businessName || config.businessId}`);
      console.log(`   Imágenes actuales: ${config.carouselImages.length}`);

      // Filtrar solo URLs válidas
      const validImages = config.carouselImages.filter((imageUrl) => {
        if (typeof imageUrl !== 'string') {
          console.log(`   ❌ Removido: tipo ${typeof imageUrl}`);
          return false;
        }
        
        // URLs válidas
        if (imageUrl.startsWith('http') || imageUrl.startsWith('/uploads/')) {
          console.log(`   ✅ Válida: ${imageUrl.substring(0, 50)}...`);
          return true;
        }
        
        // Base64 válidos (mínimo 100 caracteres)
        if (imageUrl.startsWith('data:image/') && imageUrl.length > 100) {
          console.log(`   ✅ Base64 válido: ${imageUrl.substring(0, 30)}...`);
          return true;
        }
        
        console.log(`   ❌ Removido: inválido ${imageUrl.substring(0, 30)}...`);
        return false;
      });

      // Actualizar si hay cambios
      if (validImages.length !== config.carouselImages.length) {
        await prisma.brandingConfig.update({
          where: { id: config.id },
          data: { carouselImages: validImages }
        });
        
        console.log(`   ✅ Actualizado: ${config.carouselImages.length} → ${validImages.length} imágenes`);
      } else {
        console.log(`   ✅ Sin cambios necesarios`);
      }
    }

    console.log('\n🎉 Limpieza completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCorruptedImages();
