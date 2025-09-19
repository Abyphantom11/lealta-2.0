/**
 * Script para probar la nueva API de branding
 */

const businessId = 'cmfqhepmq0000ey4slyms4knv'; // Business "arepa"

async function testBrandingAPI() {
  try {
    console.log('🧪 Probando nueva API de branding...');
    
    const response = await fetch(`http://localhost:3001/api/branding?businessId=${businessId}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ API de branding responde correctamente:');
      console.log(`   Business: ${data.businessName}`);
      console.log(`   Color primario: ${data.primaryColor}`);
      console.log(`   Color secundario: ${data.secondaryColor}`);
      console.log(`   Imágenes del carrusel: ${data.carouselImages?.length || 0}`);
      
      if (data.carouselImages && data.carouselImages.length > 0) {
        console.log('   URLs del carrusel:');
        data.carouselImages.forEach((url, index) => {
          console.log(`     ${index + 1}. ${url.substring(0, 60)}...`);
        });
      }
      
      console.log('\n🎯 Resultado: API migrada exitosamente de archivos JSON a PostgreSQL');
      
    } else {
      console.error('❌ Error en la API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('   Detalle:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error probando API:', error.message);
  }
}

testBrandingAPI();
