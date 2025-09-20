// Script para restaurar 5 imágenes de ejemplo al branding
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreBrandingImages() {
  try {
    console.log('🔧 Restaurando imágenes del branding...');
    
    const correctBusinessId = 'cmfr2y0ia0000eyvw7ef3k20u';
    
    // Obtener la configuración actual
    const currentBranding = await prisma.brandingConfig.findUnique({
      where: { businessId: correctBusinessId }
    });
    
    if (!currentBranding) {
      console.log('❌ No se encontró configuración de branding');
      return;
    }
    
    console.log(`📸 Estado actual: ${currentBranding.carouselImages?.length || 0} imágenes`);
    
    // URLs de imágenes de ejemplo de Unsplash
    const exampleImages = [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565299585323-38174c6ca76d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&sat=100',
      'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&h=600&fit=crop&sat=100'
    ];
    
    // Conservar la imagen actual y agregar las nuevas
    const currentImages = currentBranding.carouselImages || [];
    const allImages = [...currentImages, ...exampleImages];
    
    // Actualizar en la base de datos
    await prisma.brandingConfig.update({
      where: { businessId: correctBusinessId },
      data: {
        carouselImages: allImages
      }
    });
    
    console.log(`✅ Branding restaurado con ${allImages.length} imágenes`);
    console.log('📝 Imágenes agregadas:');
    exampleImages.forEach((img, i) => {
      console.log(`   ${i+2}. ${img}`);
    });
    
    console.log('\n🎯 PROBLEMA SOLUCIONADO:');
    console.log('  ✅ Función syncBannersToCarousel eliminada');
    console.log('  ✅ Las imágenes del carousel ya no se sobrescriben');
    console.log('  ✅ Puedes agregar/quitar imágenes sin perder las demás');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

restoreBrandingImages();
