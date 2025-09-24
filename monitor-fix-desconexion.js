/**
 * Monitor para verificar que la desconexión admin → cliente esté arreglada
 */

const PRODUCTION_URL = 'https://lealta.vercel.app';
const BUSINESS_ID = 'cmfw0fujf0000eyv8eyhgfzja';

async function monitorearArregloDesconexion() {
  console.log('🔧 MONITOREANDO ARREGLO DE DESCONEXIÓN ADMIN → CLIENTE\n');
  console.log(`⏰ ${new Date().toLocaleTimeString()} - Esperando que funcione la sincronización`);
  
  let attempts = 0;
  const maxAttempts = 10; // 5 minutos máximo
  
  const checkConnection = async () => {
    attempts++;
    const timestamp = Date.now();
    
    console.log(`\n📡 Verificación ${attempts}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
    
    try {
      // Probar API del cliente
      const response = await fetch(`${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const nombreEmpresa = data.data?.nombreEmpresa || 'No encontrado';
        const tarjetasCount = data.data?.tarjetas?.length || 0;
        
        console.log(`   📊 Datos recibidos:`);
        console.log(`     Nombre empresa: "${nombreEmpresa}"`);
        console.log(`     Tarjetas: ${tarjetasCount}`);
        
        if (tarjetasCount > 0) {
          console.log(`   🎴 Detalles de tarjetas:`);
          data.data.tarjetas.forEach((tarjeta, i) => {
            const isCustomBenefit = tarjeta.beneficio === '9 dadadasd';
            const emoji = isCustomBenefit ? '✅' : '📋';
            console.log(`     ${i + 1}. ${tarjeta.nivel}: ${emoji} "${tarjeta.beneficio}"`);
          });
        }
        
        // ✅ CRITERIOS DE ÉXITO:
        const hasCorrectName = nombreEmpresa === 'love me sky';
        const hasTarjetas = tarjetasCount > 0;
        const hasCustomBenefit = data.data?.tarjetas?.some(t => t.beneficio === '9 dadadasd');
        
        console.log(`\n   🎯 Estado de la conexión:`);
        console.log(`     ${hasCorrectName ? '✅' : '❌'} Nombre empresa: ${hasCorrectName ? 'Correcto' : 'Incorrecto'}`);
        console.log(`     ${hasTarjetas ? '✅' : '❌'} Tarjetas: ${hasTarjetas ? 'Encontradas' : 'No encontradas'}`);
        console.log(`     ${hasCustomBenefit ? '✅' : '❌'} Beneficio personalizado: ${hasCustomBenefit ? 'Funciona' : 'No funciona'}`);
        
        if (hasCorrectName && hasTarjetas && hasCustomBenefit) {
          console.log('\n🎉 ¡ÉXITO COMPLETO! La desconexión está arreglada:');
          console.log('   ✅ El admin panel ahora se sincroniza correctamente con el cliente');
          console.log('   ✅ Los cambios del admin aparecen inmediatamente');
          console.log('   ✅ El nombre de empresa se actualiza correctamente');
          console.log('   ✅ Los beneficios personalizados funcionan');
          
          console.log('\n🚀 PRÓXIMOS PASOS PARA EL USUARIO:');
          console.log('   1. Ir al panel admin (/admin/portal)');
          console.log('   2. Editar "Nombre de la Empresa en Tarjetas"');
          console.log('   3. Los cambios aparecerán inmediatamente en el cliente');
          console.log('   4. ¡No necesita más edición manual de archivos!');
          
          return true; // ¡Éxito completo!
        } else if (hasTarjetas) {
          console.log('\n⚡ PROGRESO: Tarjetas funcionan, nombre en proceso...');
          return false; // Continuar monitoreando
        } else {
          console.log('\n⏳ Deploy aún en progreso...');
          return false;
        }
        
      } else {
        console.log(`   ❌ Error HTTP: ${response.status}`);
        return false;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }
  };
  
  // Verificar inmediatamente
  const isFixed = await checkConnection();
  if (isFixed) return;
  
  // Configurar intervalo cada 30 segundos
  const interval = setInterval(async () => {
    const isFixed = await checkConnection();
    
    if (isFixed || attempts >= maxAttempts) {
      clearInterval(interval);
      
      if (attempts >= maxAttempts && !isFixed) {
        console.log('\n⚠️ Tiempo agotado. El fix puede necesitar más tiempo.');
        console.log('💡 Intenta refrescar el navegador o ejecuta el script nuevamente.');
      }
    }
  }, 30000); // Cada 30 segundos
  
  console.log('\n⏱️ Verificando cada 30 segundos... (Ctrl+C para cancelar)');
}

monitorearArregloDesconexion();
