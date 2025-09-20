const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnose() {
  try {
    console.log('🔍 Diagnóstico completo...\n');
    
    // 1. Ver todos los businesses
    console.log('📊 1. Businesses en BD:');
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true, slug: true }
    });
    
    businesses.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.name} (${b.slug}) - ID: ${b.id}`);
    });
    
    // 2. Ver configuraciones de branding
    console.log('\n🎨 2. Configuraciones de branding:');
    const brandings = await prisma.brandingConfig.findMany();
    
    if (brandings.length === 0) {
      console.log('  ❌ No hay configuraciones de branding');
    } else {
      brandings.forEach((b, i) => {
        console.log(`  ${i + 1}. Business: ${b.businessId}`);
        console.log(`     Nombre: ${b.businessName || 'Sin nombre'}`);
        console.log(`     Color: ${b.primaryColor || 'Sin color'}`);
        console.log(`     Imágenes: ${b.carouselImages?.length || 0}`);
      });
    }
    
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
