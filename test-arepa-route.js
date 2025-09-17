/**
 * Test específico para la ruta /arepa/cliente
 */

console.log('🧪 Probando detección de ruta /arepa/cliente...\n');

// Simular la regex del middleware
const pathname = '/arepa/cliente';
const regexTest = /^\/[a-zA-Z0-9_-]+\/cliente(\/|$)/.test(pathname);

console.log('📊 Resultados:');
console.log(`Ruta a probar: ${pathname}`);
console.log(`Regex: /^\/[a-zA-Z0-9_-]+\/cliente(\/|$)/`);
console.log(`Match: ${regexTest ? '✅ SÍ coincide' : '❌ NO coincide'}`);

// Probar con diferentes rutas de cliente
const testRoutes = [
  '/arepa/cliente',
  '/arepa/cliente/',
  '/arepa/cliente/dashboard',
  '/arepa/cliente/pedidos',
  '/demo/cliente',
  '/123abc/cliente',
  '/cafe-central/cliente'
];

console.log('\n📋 Probando múltiples rutas:');
testRoutes.forEach(route => {
  const matches = /^\/[a-zA-Z0-9_-]+\/cliente(\/|$)/.test(route);
  console.log(`${matches ? '✅' : '❌'} ${route}`);
});

// Extraer businessId como lo hace publicClientAccess
console.log('\n🔍 Extrayendo businessId:');
const match = pathname.match(/^\/([^/]+)\/cliente/);
const businessId = match ? match[1] : null;
console.log(`BusinessId extraído: ${businessId}`);

// Simular las condiciones del middleware paso a paso
console.log('\n🔄 Simulando flujo del middleware:');

// Paso 0: ¿Es ruta cliente?
const isClientRoute = /^\/[a-zA-Z0-9_-]+\/cliente(\/|$)/.test(pathname);
console.log(`Paso 0 - ¿Es ruta cliente?: ${isClientRoute ? 'SÍ' : 'NO'}`);

// Paso 1: ¿Es ruta pública estática?
const PUBLIC_ROUTES = ['/', '/login', '/signup'];
const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
  pathname.startsWith('/_next') ||
  pathname.startsWith('/api/auth');
console.log(`Paso 1 - ¿Es ruta pública estática?: ${isPublicRoute ? 'SÍ' : 'NO'}`);

console.log(`\n🎯 Resultado esperado: La ruta ${pathname} debería ser manejada por publicClientAccess`);
