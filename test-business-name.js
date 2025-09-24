/**
 * Test rápido para verificar el nombre del negocio
 */

const PRODUCTION_URL = 'https://lealta.vercel.app';
const BUSINESS_ID = 'cmfw0fujf0000eyv8eyhgfzja';

async function testBusinessName() {
  console.log('🏢 Verificando nombre del negocio...\n');
  
  try {
    const timestamp = Date.now();
    const response = await fetch(`${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}&t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('📊 Información del negocio:');
      console.log(`   Nombre: "${data.data?.nombreEmpresa || 'No encontrado'}"`);
      console.log(`   Empresa: "${data.data?.empresa?.nombre || 'No encontrado'}"`);
      
      // Verificar tarjetas también
      console.log('\n🎴 Verificación de tarjetas:');
      if (data.data?.tarjetas?.length > 0) {
        data.data.tarjetas.forEach((tarjeta, index) => {
          const benefitEmoji = tarjeta.beneficio === '9 dadadasd' ? '✅' : '❌';
          console.log(`   ${index + 1}. ${tarjeta.nivel}: ${benefitEmoji} "${tarjeta.beneficio}"`);
        });
      } else {
        console.log('   ❌ No se encontraron tarjetas');
      }
      
      const correctName = data.data?.nombreEmpresa === 'love me';
      console.log(`\n${correctName ? '✅' : '❌'} Nombre del negocio: ${correctName ? 'Correcto' : 'Necesita actualización'}`);
      
    } else {
      console.log(`❌ Error: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBusinessName();
