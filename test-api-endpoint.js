/**
 * 🧪 Test endpoint de estadísticas después de los arreglos
 */

console.log('🧪 Probando endpoint de estadísticas...');

// Dar tiempo para que el servidor arranque
setTimeout(async () => {
  try {
    console.log('📡 Realizando fetch a /api/admin/estadisticas...');
    
    const response = await fetch('http://localhost:3000/api/admin/estadisticas?periodo=7days', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    });

    console.log('📡 Status:', response.status);
    console.log('📡 StatusText:', response.statusText);
    
    if (response.status === 401) {
      console.log('🔒 Como era esperado, necesita autenticación');
    } else if (response.status === 500) {
      const text = await response.text();
      console.error('❌ Error 500:', text);
    } else {
      const data = await response.text();
      console.log('✅ Respuesta:', data.substring(0, 200) + '...');
    }

  } catch (error) {
    console.error('💥 Error en el test:', error.message);
  }
}, 3000);
