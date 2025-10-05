// Test para crear un promotor usando el subdomain
const testCreatePromotor = async () => {
  try {
    console.log('🧪 Probando creación de promotor con subdomain...\n');
    
    const response = await fetch('http://localhost:3001/api/promotores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: 'golom', // Usando subdomain en lugar de ID
        nombre: 'Abraham Test',
        activo: true,
      }),
    });

    const data = await response.json();
    
    console.log('📊 Status:', response.status);
    console.log('📦 Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ ¡Promotor creado exitosamente!');
    } else {
      console.log('\n❌ Error al crear promotor');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testCreatePromotor();
