// Debug SuperAdmin APIs con autenticación simulada
console.log('🔍 Debugging SuperAdmin API access...');

// Función para acceder a /superadmin primero
const accessSuperAdmin = async () => {
  console.log('\n1. Intentando acceder a /superadmin...');
  
  try {
    const response = await fetch('http://localhost:3001/superadmin');
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ SuperAdmin page accessible');
    } else {
      console.log('❌ SuperAdmin access failed');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

// Función para verificar el estado de autenticación
const checkAuthStatus = async () => {
  console.log('\n2. Verificando estado de autenticación...');
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/me');
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const user = await response.json();
      console.log('✅ Usuario autenticado:', user);
    } else {
      console.log('❌ No autenticado');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

// Función para testear las APIs
const testAPIs = async () => {
  console.log('\n3. Testing APIs after auth...');
  
  const apis = [
    '/api/admin/estadisticas',
    '/api/admin/clientes/1762075776/historial'
  ];
  
  for (const api of apis) {
    try {
      console.log(`\nTesting ${api}...`);
      const response = await fetch(`http://localhost:3001${api}`);
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log('✅ Success:', data.substring(0, 100) + '...');
      } else {
        const error = await response.text();
        console.log('❌ Error:', error);
      }
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
  }
};

// Ejecutar secuencialmente
const runDiagnostic = async () => {
  await accessSuperAdmin();
  await checkAuthStatus();
  await testAPIs();
};

runDiagnostic();
