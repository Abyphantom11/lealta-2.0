// Test para verificar la resolución del businessId 
async function testBusinessIdResolution() {
  console.log('🔍 Testing Business ID Resolution...');
  
  // 1. Test API validation endpoint
  const testValidation = async (identifier) => {
    try {
      const response = await fetch(`http://localhost:3001/api/businesses/${identifier}/validate`);
      const data = await response.json();
      console.log(`✅ Resolution test for "${identifier}":`, data);
      return data.id;
    } catch (error) {
      console.error(`❌ Failed to resolve "${identifier}":`, error.message);
      return null;
    }
  };

  // 2. Probar resolución para 'arepa'
  const arepaBusingessId = await testValidation('arepa');
  console.log(`🎯 Expected businessId for 'arepa': ${arepaBusingessId}`);

  // 3. Verificar datos en branding para ese ID
  if (arepaBusingessId) {
    try {
      const response = await fetch(`http://localhost:3001/api/branding?businessId=${arepaBusingessId}`);
      if (response.ok) {
        const branding = await response.json();
        console.log('🎨 Branding data for resolved ID:', {
          businessId: arepaBusingessId,
          businessName: branding.businessName,
          primaryColor: branding.primaryColor,
          carouselImages: branding.carouselImages?.length || 0
        });
      } else {
        console.log(`❌ No branding data found for ID: ${arepaBusingessId}`);
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
    }
  }
}

testBusinessIdResolution();
