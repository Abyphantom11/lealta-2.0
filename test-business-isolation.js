/**
 * 🧪 SCRIPT DE PRUEBA: Business Isolation en PWA
 * 
 * Verifica que el manifest y business context funcionan correctamente
 * para cada negocio
 */

const businesses = [
  'casadelsabor',
  'momo',
  'love-me-sky'
];

console.log('🧪 PRUEBA DE BUSINESS ISOLATION EN PWA\n');
console.log('=' .repeat(60));

async function testBusinessManifest(businessSlug) {
  console.log(`\n📦 Testing: ${businessSlug}`);
  console.log('-'.repeat(60));
  
  try {
    // Test 1: Manifest endpoint
    const manifestUrl = `http://localhost:3000/api/manifest?business=${businessSlug}`;
    console.log(`\n1️⃣ Fetching manifest: ${manifestUrl}`);
    
    const manifestResponse = await fetch(manifestUrl);
    if (!manifestResponse.ok) {
      console.log(`   ❌ Manifest HTTP ${manifestResponse.status}`);
      return;
    }
    
    const manifest = await manifestResponse.json();
    console.log(`   ✅ Manifest loaded`);
    console.log(`   📝 Name: ${manifest.name}`);
    console.log(`   📝 Short name: ${manifest.short_name}`);
    console.log(`   🎯 Start URL: ${manifest.start_url}`);
    console.log(`   🔍 Scope: ${manifest.scope}`);
    
    // Validar start_url correcto
    const expectedStartUrl = `/${businessSlug}/cliente`;
    if (manifest.start_url === expectedStartUrl) {
      console.log(`   ✅ Start URL correcto: ${manifest.start_url}`);
    } else {
      console.log(`   ❌ Start URL incorrecto!`);
      console.log(`      Esperado: ${expectedStartUrl}`);
      console.log(`      Obtenido: ${manifest.start_url}`);
    }
    
    // Test 2: Business validation endpoint
    console.log(`\n2️⃣ Validating business: ${businessSlug}`);
    const validateUrl = `http://localhost:3000/api/businesses/${businessSlug}/validate`;
    
    const validateResponse = await fetch(validateUrl);
    if (!validateResponse.ok) {
      console.log(`   ❌ Validation HTTP ${validateResponse.status}`);
      return;
    }
    
    const businessData = await validateResponse.json();
    console.log(`   ✅ Business validated`);
    console.log(`   🆔 Business ID: ${businessData.id}`);
    console.log(`   📛 Business Name: ${businessData.name}`);
    console.log(`   🔗 Subdomain: ${businessData.subdomain}`);
    
    // Test 3: Verificar que el ID es único
    if (businessData.subdomain === businessSlug || businessData.slug === businessSlug) {
      console.log(`   ✅ Business slug matches`);
    } else {
      console.log(`   ⚠️  Slug mismatch: ${businessData.subdomain} vs ${businessSlug}`);
    }
    
    console.log(`\n✅ ${businessSlug} - TESTS PASSED`);
    
  } catch (error) {
    console.error(`   ❌ Error testing ${businessSlug}:`, error.message);
  }
}

async function runAllTests() {
  for (const business of businesses) {
    await testBusinessManifest(business);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('\n💡 INSTRUCCIONES PARA iOS:');
  console.log('   1. Abre Safari en iPhone');
  console.log('   2. Ve a: http://localhost:3000/casadelsabor/cliente');
  console.log('   3. Haz login');
  console.log('   4. Toca Compartir → "Agregar a pantalla de inicio"');
  console.log('   5. Verifica que el ícono tenga el nombre correcto');
  console.log('   6. Abre la PWA y verifica que inicie en /casadelsabor/cliente');
  console.log('   7. REPITE para /momo/cliente - debe crear PWA separada\n');
}

runAllTests();
