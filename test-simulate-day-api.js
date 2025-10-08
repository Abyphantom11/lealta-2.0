// Test: Verificar que la API filtra por día simulado correctamente

const testSimulateDay = async () => {
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Probando API con simulación de días...\n');
  
  // Test 1: Sin simulación (día actual)
  console.log('1️⃣ Sin simulación (día comercial actual):');
  try {
    const response = await fetch(`${baseUrl}/api/portal/config-v2?businessId=${businessId}`);
    const data = await response.json();
    console.log(`   ✅ Banners: ${data.banners?.length || 0}`);
    console.log(`   ✅ Promociones: ${data.promociones?.length || 0}`);
    console.log(`   ✅ Favorito: ${data.favoritoDelDia ? 'Sí' : 'No'}`);
    if (data._metadata) {
      console.log(`   📅 Día comercial: ${data._metadata.businessDay}`);
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  console.log('');
  
  // Test 2: Simular lunes
  console.log('2️⃣ Simulando LUNES:');
  try {
    const response = await fetch(`${baseUrl}/api/portal/config-v2?businessId=${businessId}&simulateDay=lunes`);
    const data = await response.json();
    console.log(`   ✅ Banners: ${data.banners?.length || 0}`);
    data.banners?.forEach(b => console.log(`      - ${b.title} (día: ${b.dia || 'sin especificar'})`));
    console.log(`   ✅ Promociones: ${data.promociones?.length || 0}`);
    console.log(`   ✅ Favorito: ${data.favoritoDelDia ? 'Sí' : 'No'}`);
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  console.log('');
  
  // Test 3: Simular martes
  console.log('3️⃣ Simulando MARTES:');
  try {
    const response = await fetch(`${baseUrl}/api/portal/config-v2?businessId=${businessId}&simulateDay=martes`);
    const data = await response.json();
    console.log(`   ✅ Banners: ${data.banners?.length || 0}`);
    data.banners?.forEach(b => console.log(`      - ${b.title} (día: ${b.dia || 'sin especificar'})`));
    console.log(`   ✅ Promociones: ${data.promociones?.length || 0}`);
    console.log(`   ✅ Favorito: ${data.favoritoDelDia ? 'Sí' : 'No'}`);
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  console.log('');
  
  // Test 4: Simular miércoles
  console.log('4️⃣ Simulando MIÉRCOLES:');
  try {
    const response = await fetch(`${baseUrl}/api/portal/config-v2?businessId=${businessId}&simulateDay=miercoles`);
    const data = await response.json();
    console.log(`   ✅ Banners: ${data.banners?.length || 0}`);
    data.banners?.forEach(b => console.log(`      - ${b.title} (día: ${b.dia || 'sin especificar'})`));
    console.log(`   ✅ Promociones: ${data.promociones?.length || 0}`);
    console.log(`   ✅ Favorito: ${data.favoritoDelDia ? 'Sí' : 'No'}`);
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  console.log('\n✅ Tests completados!');
};

// Ejecutar solo si hay un servidor corriendo
testSimulateDay().catch(console.error);
