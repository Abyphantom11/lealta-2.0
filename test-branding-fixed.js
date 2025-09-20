async function testBrandingFixed() {
  try {
    const businessId = 'cmfr2y0ia0000eyvw7ef3k20u'; // ID correcto
    console.log('🧪 Probando branding con ID correcto...');
    
    const response = await fetch(`http://localhost:3001/api/branding?businessId=${businessId}`);
    const data = await response.json();
    
    console.log('📊 Response status:', response.status);
    if (response.ok) {
      console.log('✅ Branding API funciona:');
      console.log('  Business Name:', data.businessName);
      console.log('  Primary Color:', data.primaryColor);
      console.log('  Secondary Color:', data.secondaryColor);
      console.log('  Carousel Images:', data.carouselImages?.length || 0);
      console.log('  URLs:', data.carouselImages?.slice(0, 2) || []);
    } else {
      console.log('❌ Error en branding API:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBrandingFixed();
