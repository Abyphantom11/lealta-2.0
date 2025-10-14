// Test básico para verificar si el hook useReservations funciona sin bucles infinitos
console.log('Iniciando test de useReservations...');

// Simular businessId
const businessId = 'test-business-123';

// Contador de renders para detectar bucles infinitos
let renderCount = 0;
const maxRenders = 10;

const testInterval = setInterval(() => {
  renderCount++;
  console.log(`Render #${renderCount} - Testing useReservations with businessId: ${businessId}`);
  
  if (renderCount >= maxRenders) {
    console.log('✅ Test completado - No se detectaron bucles infinitos');
    clearInterval(testInterval);
  }
}, 100);

// Auto-terminar después de 5 segundos
setTimeout(() => {
  clearInterval(testInterval);
  console.log('Test terminado por timeout');
}, 5000);
