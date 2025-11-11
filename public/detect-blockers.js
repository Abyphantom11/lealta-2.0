/**
 * 🔍 Detector de Bloqueadores
 * 
 * Este script se ejecuta en el navegador y detecta qué está bloqueando Paddle
 */

console.log('🔍 Detector de Bloqueadores - Iniciando...\n');

const tests = [];

// Test 1: Verificar si Paddle.js se puede cargar
function testPaddleScript() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    
    script.onload = () => {
      resolve({
        test: 'Paddle.js CDN',
        status: 'success',
        message: '✅ cdn.paddle.com está accesible'
      });
    };
    
    script.onerror = () => {
      resolve({
        test: 'Paddle.js CDN',
        status: 'error',
        message: '❌ cdn.paddle.com BLOQUEADO'
      });
    };
    
    document.head.appendChild(script);
    
    // Timeout si no responde en 5 segundos
    setTimeout(() => {
      resolve({
        test: 'Paddle.js CDN',
        status: 'error',
        message: '⏱️ cdn.paddle.com no respondió (probablemente bloqueado)'
      });
    }, 5000);
  });
}

// Test 2: Verificar sandbox checkout
function testSandboxCheckout() {
  return fetch('https://sandbox-checkout-service.paddle.com/health', { 
    method: 'GET',
    mode: 'no-cors' // Evitar CORS
  })
    .then(() => ({
      test: 'Sandbox Checkout Service',
      status: 'success',
      message: '✅ sandbox-checkout-service.paddle.com está accesible'
    }))
    .catch(() => ({
      test: 'Sandbox Checkout Service',
      status: 'error',
      message: '❌ sandbox-checkout-service.paddle.com BLOQUEADO'
    }));
}

// Test 3: Verificar vendors dashboard
function testVendorsDashboard() {
  return fetch('https://sandbox-vendors.paddle.com', {
    method: 'HEAD',
    mode: 'no-cors'
  })
    .then(() => ({
      test: 'Vendors Dashboard',
      status: 'success',
      message: '✅ sandbox-vendors.paddle.com está accesible'
    }))
    .catch(() => ({
      test: 'Vendors Dashboard',
      status: 'warning',
      message: '⚠️ sandbox-vendors.paddle.com puede estar bloqueado (no crítico)'
    }));
}

// Test 4: Detectar extensiones conocidas
function detectExtensions() {
  const extensions = [];
  
  // uBlock Origin
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    extensions.push('uBlock Origin o similar');
  }
  
  // Brave Shields
  if (navigator.brave) {
    extensions.push('Brave Browser (con Shields)');
  }
  
  // Privacy Badger
  if (document.querySelector('link[href*="privacybadger"]')) {
    extensions.push('Privacy Badger');
  }
  
  return {
    test: 'Extensiones Detectadas',
    status: extensions.length > 0 ? 'warning' : 'success',
    message: extensions.length > 0 
      ? `⚠️ Posibles bloqueadores: ${extensions.join(', ')}` 
      : '✅ No se detectaron bloqueadores conocidos'
  };
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('🧪 Ejecutando tests...\n');
  
  const results = await Promise.all([
    testPaddleScript(),
    testSandboxCheckout(),
    testVendorsDashboard(),
    Promise.resolve(detectExtensions())
  ]);
  
  // Mostrar resultados
  console.log('📊 RESULTADOS:\n');
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : 
                 result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.message}`);
  });
  
  // Diagnóstico final
  console.log('\n---\n');
  
  const hasErrors = results.some(r => r.status === 'error');
  
  if (hasErrors) {
    console.log('❌ DIAGNÓSTICO: Paddle está siendo bloqueado\n');
    console.log('💡 SOLUCIONES:');
    console.log('1. Desactiva tu bloqueador de anuncios para este sitio');
    console.log('2. O agrega excepciones para:');
    console.log('   - *.paddle.com');
    console.log('   - cdn.paddle.com');
    console.log('   - sandbox-checkout-service.paddle.com');
    console.log('\n3. Recarga la página después de hacer cambios');
    console.log('\n📖 Guía completa: SOLUCION_PADDLE_BLOQUEADO.md');
  } else {
    console.log('✅ TODO OK: Paddle debería funcionar correctamente\n');
    console.log('Si aún tienes problemas:');
    console.log('1. Ejecuta: node test-paddle-connection.js');
    console.log('2. Verifica tus credenciales en .env.local');
    console.log('3. Revisa la consola del navegador para otros errores');
  }
}

// Ejecutar
runAllTests();
