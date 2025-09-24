/**
 * Monitor específico para el nombre del negocio "love me"
 */

const PRODUCTION_URL = 'https://lealta.vercel.app';
const BUSINESS_ID = 'cmfw0fujf0000eyv8eyhgfzja';

async function monitorBusinessName() {
  console.log('🏢 Monitoreando actualización del nombre del negocio...\n');
  console.log(`⏰ ${new Date().toLocaleTimeString()} - Esperando "love me"`);
  
  let attempts = 0;
  const maxAttempts = 8; // 4 minutos máximo
  
  const checkName = async () => {
    attempts++;
    const timestamp = Date.now();
    
    console.log(`\n📡 Verificación ${attempts}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
    
    try {
      const response = await fetch(`${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const nombreEmpresa = data.data?.nombreEmpresa || data.data?.empresa?.nombre || 'No encontrado';
        const tarjetasCount = data.data?.tarjetas?.length || 0;
        
        console.log(`   Nombre actual: "${nombreEmpresa}"`);
        console.log(`   Tarjetas: ${tarjetasCount}`);
        
        // Verificar si ya está correcto
        if (nombreEmpresa === 'love me') {
          console.log('\n🎉 ¡ÉXITO! El nombre del negocio se actualizó correctamente');
          console.log('✅ Ahora muestra "love me" en lugar de "Mi Negocio"');
          
          // Verificar también las tarjetas por si acaso
          if (tarjetasCount > 0) {
            console.log('\nBonus - Estado de tarjetas:');
            data.data.tarjetas.forEach((tarjeta, i) => {
              const emoji = tarjeta.beneficio === '9 dadadasd' ? '✅' : '❌';
              console.log(`   ${i + 1}. ${tarjeta.nivel}: ${emoji} "${tarjeta.beneficio}"`);
            });
          }
          
          return true; // Éxito!
        } else {
          console.log(`   ⏳ Aún muestra: "${nombreEmpresa}" (esperando "love me")`);
        }
        
      } else {
        console.log(`   ❌ Error HTTP: ${response.status}`);
      }
      
      return false; // Continuar monitoreando
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }
  };
  
  // Verificar inmediatamente
  const isReady = await checkName();
  if (isReady) return;
  
  // Configurar intervalo cada 30 segundos
  const interval = setInterval(async () => {
    const isReady = await checkName();
    
    if (isReady || attempts >= maxAttempts) {
      clearInterval(interval);
      
      if (attempts >= maxAttempts) {
        console.log('\n⚠️ Tiempo de espera agotado.');
        console.log('💡 El deploy puede necesitar más tiempo. Intenta refrescar la página en unos minutos.');
      }
    }
  }, 30000); // Cada 30 segundos
  
  console.log('\n⏱️ Verificando cada 30 segundos... (Ctrl+C para cancelar)');
}

monitorBusinessName();
