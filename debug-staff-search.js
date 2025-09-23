/**
 * 🧪 Script de debugging para probar la búsqueda de clientes desde STAFF
 */

const testStaffSearch = async () => {
  console.log('🧪 Testing STAFF search functionality...');
  
  try {
    // Probar la API de búsqueda con el término que estás usando
    const response = await fetch('/api/admin/clients/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchTerm: '1762'
      }),
      credentials: 'include' // Importante para incluir cookies de sesión
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📋 Response data:', data);
    
    if (response.status === 200) {
      console.log('✅ SUCCESS: Search API working');
      console.log(`📦 Found ${data.clients?.length || 0} clients`);
      if (data.clients?.length > 0) {
        console.log('👥 Clients found:', data.clients);
      }
    } else if (response.status === 403) {
      console.log('❌ FAIL: Still getting 403 - Permission denied');
      console.log('🔍 Error details:', data);
    } else {
      console.log('⚠️ UNEXPECTED status:', response.status);
      console.log('📄 Response:', data);
    }

  } catch (error) {
    console.error('💥 Search test failed:', error);
  }
};

// También probar el endpoint de verificación de auth
const testAuthStatus = async () => {
  console.log('🔐 Testing auth status...');
  
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('👤 Auth status:', response.status, data);
    
    if (data.user) {
      console.log(`✅ Logged in as: ${data.user.role} - ${data.user.email}`);
      console.log(`🏢 Business: ${data.user.businessId}`);
      console.log(`🛡️ Permissions:`, data.user.permissions);
    }
  } catch (error) {
    console.error('💥 Auth test failed:', error);
  }
};

// Ejecutar ambas pruebas
console.log('🚀 Starting debug tests...');
testAuthStatus().then(() => testStaffSearch());

// Hacer las funciones disponibles globalmente para testing manual
if (typeof window !== 'undefined') {
  window.testStaffSearch = testStaffSearch;
  window.testAuthStatus = testAuthStatus;
  console.log('🧪 Debug functions available: window.testStaffSearch() y window.testAuthStatus()');
}
