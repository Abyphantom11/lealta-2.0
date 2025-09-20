// 🔍 VERIFICAR SI EL BUSINESS ID EXISTS

async function checkBusinessId() {
  const businessId = 'cmfr2y0ia0000eyvw7ef3k20u';
  
  try {
    const response = await fetch('http://localhost:3000/api/cliente/test-visitas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Resultado de prueba:', result);
    } else {
      const error = await response.text();
      console.log('❌ Error en prueba:', error);
    }
  } catch (error) {
    console.log('❌ Error de red:', error);
  }
}

checkBusinessId();
