const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBrandingPersistence() {
  try {
    console.log('🔍 DIAGNÓSTICO: Persistencia de Branding\n');
    
    // Verificar datos en la base de datos
    console.log('📊 1. Verificando datos en BrandingConfig...');
    const brandings = await prisma.brandingConfig.findMany({
      select: {
        id: true,
        businessId: true,
        businessName: true,
        primaryColor: true,
        carouselImages: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (brandings.length === 0) {
      console.log('❌ NO HAY DATOS en BrandingConfig');
    } else {
      console.log(`✅ ${brandings.length} configuración(es) de branding encontrada(s):`);
      brandings.forEach((b, i) => {
        console.log(`\n  ${i + 1}. Business ID: ${b.businessId}`);
        console.log(`     Nombre: "${b.businessName || 'Sin nombre'}"`);
        console.log(`     Color: ${b.primaryColor || 'Sin color'}`);
        console.log(`     Imágenes: ${b.carouselImages?.length || 0}`);
        console.log(`     Creado: ${b.createdAt.toLocaleString()}`);
        console.log(`     Actualizado: ${b.updatedAt.toLocaleString()}`);
      });
    }
    
    // Verificar el business específico
    const targetBusinessId = 'cmfr2y0ia0000eyvw7ef3k20u';
    console.log(`\n📋 2. Verificando business específico: ${targetBusinessId}`);
    
    const specificBranding = await prisma.brandingConfig.findUnique({
      where: { businessId: targetBusinessId }
    });
    
    if (specificBranding) {
      console.log('✅ Branding específico encontrado:');
      console.log(`   Nombre: "${specificBranding.businessName}"`);
      console.log(`   Color: ${specificBranding.primaryColor}`);
      console.log(`   Imágenes: ${specificBranding.carouselImages?.length || 0}`);
      if (specificBranding.carouselImages?.length > 0) {
        console.log('   URLs del carrusel:');
        specificBranding.carouselImages.forEach((url, i) => {
          console.log(`     ${i + 1}. ${url.substring(0, 50)}...`);
        });
      }
    } else {
      console.log('❌ NO se encontró branding para este business');
    }
    
    // Verificar si el business existe
    console.log(`\n🏢 3. Verificando si el business existe...`);
    const business = await prisma.business.findUnique({
      where: { id: targetBusinessId },
      select: { id: true, name: true, slug: true }
    });
    
    if (business) {
      console.log(`✅ Business existe: ${business.name} (${business.slug})`);
    } else {
      console.log('❌ Business NO existe en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrandingPersistence();
