// Test validación de business
console.log('🔍 Probando validación de business arepa...');

fetch('http://localhost:3001/api/businesses/arepa/validate')
.then(response => {
  console.log('📋 Response status:', response.status);
  console.log('📋 Response OK:', response.ok);
  return response.json();
})
.then(data => {
  console.log('📋 Response data:', data);
  if (data.error) {
    console.log('❌ PROBLEMA ENCONTRADO:', data.error);
  } else {
    console.log('✅ Business validado correctamente:', data.name);
  }
})
.catch(error => {
  console.error('❌ Error en validación:', error);
});
