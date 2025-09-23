/**
 * 🧪 Test directo de la API de estadísticas
 */

const testEstadisticasAPI = async () => {
  console.log('🧪 Testing estadísticas API...');
  
  try {
    const response = await fetch('/api/admin/estadisticas/?periodo=7days', {
      method: 'GET',
      credentials: 'include'
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS: API working');
      console.log('📋 Response data:', data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ FAIL: API error');
      console.log('🔍 Error details:', errorData);
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

// Hacer disponible globalmente para testing
if (typeof window !== 'undefined') {
  window.testEstadisticasAPI = testEstadisticasAPI;
  console.log('🧪 Test function available: window.testEstadisticasAPI()');
}

// Ejecutar automáticamente
testEstadisticasAPI();
