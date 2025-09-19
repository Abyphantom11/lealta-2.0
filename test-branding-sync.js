// Prueba de flujo admin → cliente para branding
const testBrandingFlow = async () => {
  const businessId = 'arepa';
  
  console.log('🧪 TESTING: Admin-Cliente Branding Sync Flow');
  console.log('═══════════════════════════════════════════');
  
  // 1. Datos de prueba del admin
  const testBrandingData = {
    businessId: businessId,
    businessName: 'lialta', // Nombre que debe aparecer en cliente
    primaryColor: '#f43bf7', // Morado que debe aparecer en cliente
    secondaryColor: '#7C3AED',
    carouselImages: [
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
      'https://images.unsplash.com/photo-1565299507177-b0ac66763828'
    ]
  };
  
  try {
    // 2. Simular actualización desde el admin
    console.log('🔄 Step 1: Updating branding via admin API...');
    const adminResponse = await fetch('/api/branding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBrandingData),
    });
    
    console.log('📡 Admin API Response:', adminResponse.status);
    
    if (adminResponse.ok) {
      const adminResult = await adminResponse.json();
      console.log('✅ Admin update successful:', adminResult);
    } else {
      const error = await adminResponse.text();
      console.error('❌ Admin update failed:', error);
      return;
    }
    
    // 3. Verificar que el cliente obtenga los datos actualizados
    console.log('\n🔄 Step 2: Fetching branding for client...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    const clientResponse = await fetch(`/api/branding?businessId=${businessId}&t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });
    
    console.log('📡 Client API Response:', clientResponse.status);
    
    if (clientResponse.ok) {
      const clientData = await clientResponse.json();
      console.log('✅ Client data received:', clientData);
      
      // 4. Verificar que los datos coincidan
      console.log('\n🧪 Step 3: Validating data consistency...');
      const checks = {
        businessName: clientData.businessName === testBrandingData.businessName,
        primaryColor: clientData.primaryColor === testBrandingData.primaryColor,
        carouselImages: clientData.carouselImages.length === testBrandingData.carouselImages.length
      };
      
      console.log('📊 Validation Results:');
      console.log(`   Business Name: ${checks.businessName ? '✅' : '❌'} (Expected: "${testBrandingData.businessName}", Got: "${clientData.businessName}")`);
      console.log(`   Primary Color: ${checks.primaryColor ? '✅' : '❌'} (Expected: "${testBrandingData.primaryColor}", Got: "${clientData.primaryColor}")`);
      console.log(`   Carousel Count: ${checks.carouselImages ? '✅' : '❌'} (Expected: ${testBrandingData.carouselImages.length}, Got: ${clientData.carouselImages.length})`);
      
      const allPassed = Object.values(checks).every(check => check);
      console.log(`\n🎯 Overall Result: ${allPassed ? '✅ SYNC SUCCESSFUL' : '❌ SYNC FAILED'}`);
      
      if (allPassed) {
        console.log('🎉 Admin-Cliente sync is working correctly!');
        console.log('💡 The client should now show:');
        console.log(`   - Business name: "${testBrandingData.businessName}"`);
        console.log(`   - Purple button with color: "${testBrandingData.primaryColor}"`);
        console.log(`   - ${testBrandingData.carouselImages.length} carousel images`);
      }
      
    } else {
      const error = await clientResponse.text();
      console.error('❌ Client fetch failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Ejecutar el test
testBrandingFlow();
