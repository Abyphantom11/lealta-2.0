const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBrandingData() {
  try {
    console.log('🎨 Creando datos de branding...\n');
    
    // ID correcto del business arepa
    const businessId = 'cmfr2y0ia0000eyvw7ef3k20u';
    
    // Datos de branding que vimos en el admin
    const brandingData = {
      businessId,
      businessName: 'lialta',
      primaryColor: '#f43bf7',
      secondaryColor: '#7C3AED',
      carouselImages: [
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
        'https://images.unsplash.com/photo-1565299507177-b0ac66763828',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
        'https://images.unsplash.com/photo-1565299507177-b0ac66763828'
      ]
    };
    
    console.log('📊 Datos a insertar:');
    console.log(`  Business ID: ${brandingData.businessId}`);
    console.log(`  Business Name: ${brandingData.businessName}`);
    console.log(`  Primary Color: ${brandingData.primaryColor}`);
    console.log(`  Carousel Images: ${brandingData.carouselImages.length} imágenes`);
    
    // Insertar o actualizar los datos
    const branding = await prisma.brandingConfig.upsert({
      where: { businessId },
      update: brandingData,
      create: brandingData
    });
    
    console.log('\n✅ Branding creado/actualizado exitosamente!');
    console.log(`   ID: ${branding.id}`);
    console.log(`   Nombre: ${branding.businessName}`);
    console.log(`   Color: ${branding.primaryColor}`);
    console.log(`   Imágenes: ${branding.carouselImages.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBrandingData();
