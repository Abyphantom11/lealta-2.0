// Debug completo de la API
const businessId = "cmfr2y0ia0000eyvw7ef3k20u";

async function debugBrandingAPI() {
  console.log('🔍 Debug completo de la API de branding...\n');
  
  try {
    const url = `http://localhost:3001/api/branding?businessId=${businessId}`;
    console.log('📡 URL:', url);
    
    const response = await fetch(url);
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('📝 Raw Response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('🔧 Parsed JSON:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.log('❌ Error parsing JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
  }
}

debugBrandingAPI();
