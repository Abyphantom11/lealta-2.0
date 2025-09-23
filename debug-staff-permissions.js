/**
 * 🔧 Script de debugging para probar los permisos de búsqueda de clientes
 * Este script se puede ejecutar en la consola del navegador cuando estés en la página de staff
 */

window.debugStaffPermissions = async function() {
  console.log('🧪 DEBUGGING STAFF PERMISSIONS...');
  
  try {
    // 1. Verificar que hay una sesión activa
    console.log('📋 Step 1: Checking session...');
    const authResponse = await fetch('/api/auth/me');
    const authData = await authResponse.json();
    console.log('👤 Current user:', authData);

    if (!authData.user) {
      console.log('❌ No user session found');
      return;
    }

    if (authData.user.role !== 'STAFF') {
      console.log('⚠️ User is not STAFF, current role:', authData.user.role);
      return;
    }

    // 2. Probar búsqueda de clientes
    console.log('📋 Step 2: Testing client search...');
    const searchResponse = await fetch('/api/admin/clients/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchTerm: 'test'
      }),
    });

    console.log('📡 Search response status:', searchResponse.status);
    const searchData = await searchResponse.json();
    console.log('📊 Search response data:', searchData);

    if (searchResponse.status === 200) {
      console.log('✅ SUCCESS: STAFF user can search clients!');
      console.log(`📦 Found ${searchData.clients?.length || 0} clients`);
    } else if (searchResponse.status === 403) {
      console.log('❌ STILL BLOCKED: Permission denied');
      console.log('🔍 Error details:', searchData);
      
      // Información adicional para debugging
      console.log('🔧 Debugging info:');
      console.log('- User role:', authData.user.role);
      console.log('- Business ID:', authData.user.businessId);
      console.log('- Expected permissions: clients.read, read');
    } else {
      console.log('⚠️ UNEXPECTED RESPONSE:', searchResponse.status);
      console.log('📄 Response:', searchData);
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

console.log('🔧 Debug function loaded! Run window.debugStaffPermissions() to test');
