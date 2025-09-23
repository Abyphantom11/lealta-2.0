/**
 * 🧪 Test de permisos para usuario STAFF
 * Verifica que el usuario staff pueda buscar clientes
 */

const testStaffPermissions = async () => {
  console.log('🧪 Testing STAFF user permissions for client search...');
  
  try {
    // Simular búsqueda de cliente con método POST
    const response = await fetch('/api/admin/clients/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchTerm: 'test'
      }),
      credentials: 'include' // Incluir cookies de sesión
    });

    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', result);
    
    if (response.status === 200) {
      console.log('✅ SUCCESS: STAFF user can search clients');
      console.log(`📦 Found ${result.clients?.length || 0} clients`);
    } else if (response.status === 403) {
      console.log('❌ FAIL: STAFF user still lacks permission');
      console.log('🔍 Error:', result.error || result.message);
    } else {
      console.log('⚠️ UNEXPECTED:', response.status, result);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
};

// Solo ejecutar si estamos en el cliente (browser)
if (typeof window !== 'undefined') {
  // Agregar botón de test en la consola para facilitar testing
  window.testStaffPermissions = testStaffPermissions;
  console.log('🧪 Test function loaded! Run window.testStaffPermissions() to test');
}

export default testStaffPermissions;
