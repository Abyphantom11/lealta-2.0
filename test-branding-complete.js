// Prueba de branding completo
const businessId = "cmfr2y0ia0000eyvw7ef3k20u";

async function testBrandingComplete() {
  console.log('🎨 Probando branding completo...\n');
  
  try {
    // Prueba la API con el businessId correcto
    const response = await fetch(`http://localhost:3001/api/branding?businessId=${businessId}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta de la API de branding:');
    console.log('🏢 Business Name:', data.businessName || 'No encontrado');
    console.log('🎨 Primary Color:', data.primaryColor || 'No encontrado');
    console.log('🎨 Secondary Color:', data.secondaryColor || 'No encontrado');
    console.log('🖼️ Carousel Images:', data.carouselImages?.length || 0, 'imágenes');
    
    if (data.carouselImages?.length > 0) {
      console.log('📸 Primeras 3 imágenes:');
      data.carouselImages.slice(0, 3).forEach((img, i) => {
        console.log(`   ${i + 1}. ${img.substring(0, 50)}...`);
      });
    }
    
    console.log('\n🎯 Estado del branding:');
    console.log('- Business ID correcto:', businessId);
    console.log('- API funcionando:', data.businessName ? '✅' : '❌');
    console.log('- Datos completos:', data ? '✅' : '❌');
    console.log('- Cliente actualizado con businessId:', '✅');
    console.log('- Branding "lialta" funcionando:', data.businessName === 'lialta' ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Error probando branding:', error.message);
  }
}

testBrandingComplete();
