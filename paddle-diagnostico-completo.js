/**
 * 🔧 SCRIPT DE DIAGNÓSTICO PADDLE
 * 
 * Copia y pega este código COMPLETO en la consola del navegador (F12 → Console)
 * Te dirá exactamente qué está fallando
 */

console.clear();
console.log('🔧 DIAGNÓSTICO PADDLE - INICIANDO...\n');
console.log('═══════════════════════════════════════\n');

// Configuración
const CONFIG = {
  token: 'test_e7baca7d5de4072f974fbe36dce',
  priceId: 'pri_01k9rf1r9jv9aa3fsjnzf34zkp',
  environment: 'sandbox'
};

// Test 1: Verificar que Paddle esté cargado
console.log('📦 Test 1: Verificando Paddle.js...');
if (typeof Paddle === 'undefined') {
  console.error('❌ PADDLE NO CARGADO - Bloqueador de anuncios activo');
  console.log('\n💡 Solución: Desactiva tu bloqueador de anuncios');
} else {
  console.log('✅ Paddle.js está cargado\n');
}

// Test 2: Inicializar Paddle
console.log('🚀 Test 2: Inicializando Paddle...');

const errors = [];

Paddle.Initialize({
  environment: CONFIG.environment,
  token: CONFIG.token,
  eventCallback: (event) => {
    console.log('📡 Evento:', event.name || event.type);
    
    if (event.name === 'checkout.error' || event.type === 'checkout.error') {
      console.error('❌ ERROR DE CHECKOUT:', event);
      errors.push(event);
    }
    
    if (event.data && event.data.error) {
      console.error('❌ ERROR EN DATA:', event.data.error);
      errors.push(event.data.error);
    }
  }
}).then(() => {
  console.log('✅ Paddle inicializado correctamente\n');
  
  // Test 3: Probar checkout MÍNIMO (sin customer)
  console.log('🧪 Test 3: Probando checkout MÍNIMO (sin customer)...');
  console.log('═══════════════════════════════════════\n');
  
  try {
    Paddle.Checkout.open({
      items: [{
        priceId: CONFIG.priceId,
        quantity: 1
      }]
    });
    
    console.log('✅ Checkout abierto - Esperando 3 segundos...\n');
    
    // Esperar y verificar errores
    setTimeout(() => {
      if (errors.length > 0) {
        console.error('❌ SE ENCONTRARON ERRORES:');
        console.error(JSON.stringify(errors, null, 2));
        console.log('\n🔍 DIAGNÓSTICO:');
        console.log('El problema está en el producto/precio en Paddle Dashboard');
        console.log('\n✅ SOLUCIÓN:');
        console.log('1. Ve a: https://sandbox-vendors.paddle.com/catalog/products');
        console.log('2. Verifica que tu producto esté "Active" (no "Draft")');
        console.log('3. Ve a: https://sandbox-vendors.paddle.com/catalog/prices');
        console.log('4. Verifica que tu precio esté "Active"');
      } else {
        console.log('✅ No se encontraron errores en checkout mínimo');
        console.log('\n🧪 Ahora probando con customer...\n');
        
        // Test 4: Probar con customer
        Paddle.Checkout.open({
          items: [{
            priceId: CONFIG.priceId,
            quantity: 1
          }],
          customer: {
            email: 'test@example.com'
          }
        });
        
        console.log('✅ Checkout con customer abierto\n');
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ ERROR ABRIENDO CHECKOUT:', error);
    console.error('Detalles:', error.message);
  }
  
}).catch(error => {
  console.error('❌ ERROR INICIALIZANDO PADDLE:', error);
  console.error('Token usado:', CONFIG.token);
  console.log('\n💡 POSIBLES CAUSAS:');
  console.log('1. Token inválido o expirado');
  console.log('2. Problema de red/CORS');
  console.log('3. Entorno incorrecto (sandbox vs production)');
});

console.log('\n⏳ Esperando resultados...');
console.log('═══════════════════════════════════════\n');
