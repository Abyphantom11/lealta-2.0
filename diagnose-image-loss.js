// Verificar el estado actual del branding y buscar el problema
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseBrandingImageLoss() {
  try {
    console.log('🔍 Investigando pérdida de imágenes del branding...');
    
    const correctBusinessId = 'cmfr2y0ia0000eyvw7ef3k20u';
    
    // 1. Verificar estado actual
    const branding = await prisma.brandingConfig.findUnique({
      where: { businessId: correctBusinessId }
    });
    
    if (branding) {
      console.log('\n📸 ESTADO ACTUAL DEL BRANDING:');
      console.log(`  - Business: ${branding.businessName}`);
      console.log(`  - Color: ${branding.primaryColor}`);
      console.log(`  - Imágenes actuales: ${branding.carouselImages ? branding.carouselImages.length : 0}`);
      console.log(`  - Última actualización: ${branding.updatedAt}`);
      
      if (branding.carouselImages && branding.carouselImages.length > 0) {
        console.log('\n🖼️ IMÁGENES RESTANTES:');
        branding.carouselImages.forEach((img, i) => {
          const preview = img.substring(0, 50) + '...';
          console.log(`    ${i+1}. ${preview}`);
        });
      } else {
        console.log('\n❌ NO HAY IMÁGENES EN LA BASE DE DATOS');
      }
    } else {
      console.log('❌ No se encontró configuración de branding');
    }

    // 2. Verificar si hay registros de múltiples configuraciones
    const allBrandings = await prisma.brandingConfig.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`\n📊 TOTAL DE CONFIGURACIONES BRANDING: ${allBrandings.length}`);
    allBrandings.forEach((brand, i) => {
      console.log(`  ${i+1}. Business: ${brand.businessId} - Imágenes: ${brand.carouselImages?.length || 0} - Actualizado: ${brand.updatedAt}`);
    });

    // 3. Detectar el problema más probable
    console.log('\n🕵️ ANÁLISIS DEL PROBLEMA:');
    if (branding && branding.carouselImages && branding.carouselImages.length === 1) {
      console.log('❌ PROBLEMA DETECTADO: Solo queda 1 imagen de 6');
      console.log('🔍 CAUSA PROBABLE:');
      console.log('  1. El componente de carga múltiple sobrescribió el array completo');
      console.log('  2. Hubo un error en la función handleBrandingChange');
      console.log('  3. Se envió un array con solo 1 imagen en lugar de agregar a las existentes');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseBrandingImageLoss();
