/**
 * Diagnóstico completo del flujo admin → cliente
 * Verifica TODAS las partes del sistema de sincronización
 */

const PRODUCTION_URL = 'https://lealta.vercel.app';
const BUSINESS_ID = 'cmfw0fujf0000eyv8eyhgfzja';

async function diagnosticarFlujoCompleto() {
  console.log('🔬 DIAGNÓSTICO COMPLETO DEL FLUJO ADMIN → CLIENTE\n');
  
  try {
    // 1. Verificar API del cliente (la que usa la interfaz)
    console.log('1️⃣ VERIFICANDO API DEL CLIENTE:');
    const clienteResponse = await fetch(`${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}&t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    console.log(`   Status: ${clienteResponse.status}`);
    
    if (clienteResponse.ok) {
      const clienteData = await clienteResponse.json();
      console.log('   Datos del cliente:');
      console.log(`     nombreEmpresa: "${clienteData.data?.nombreEmpresa || 'No encontrado'}"`);
      console.log(`     empresa.nombre: "${clienteData.data?.empresa?.nombre || 'No encontrado'}"`);
      console.log(`     tarjetas: ${clienteData.data?.tarjetas?.length || 0}`);
      
      if (clienteData.data?.tarjetas?.length > 0) {
        console.log('   Beneficios de tarjetas:');
        clienteData.data.tarjetas.forEach((tarjeta, i) => {
          console.log(`     ${i + 1}. ${tarjeta.nivel}: "${tarjeta.beneficio}"`);
        });
      }
    } else {
      console.log(`   ❌ Error: ${clienteResponse.status}`);
    }
    
    // 2. Verificar API del admin (la que debería ser la fuente)
    console.log('\n2️⃣ VERIFICANDO API DEL ADMIN:');
    const adminResponse = await fetch(`${PRODUCTION_URL}/api/admin/portal-config?businessId=${BUSINESS_ID}&t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    console.log(`   Status: ${adminResponse.status}`);
    
    if (adminResponse.status === 401) {
      console.log('   ⚠️ Requiere autenticación (esperado para admin)');
    } else if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log('   Datos del admin:');
      console.log(`     nombreEmpresa: "${adminData.nombreEmpresa || 'No encontrado'}"`);
      console.log(`     tarjetas: ${adminData.tarjetas?.length || 0}`);
    } else {
      const errorText = await adminResponse.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
    
    // 3. Verificar endpoints de debug (si existen)
    console.log('\n3️⃣ VERIFICANDO ENDPOINT DE DEBUG:');
    const debugResponse = await fetch(`${PRODUCTION_URL}/api/debug/config-status?businessId=${BUSINESS_ID}`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log(`   Status: ${debugResponse.status}`);
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('   Estado de configuración:');
      console.log(`     PostgreSQL config: ${debugData.hasPostgreSQLConfig ? '✅' : '❌'}`);
      console.log(`     JSON config: ${debugData.hasJSONConfig ? '✅' : '❌'}`);
      console.log(`     Prioridad: ${debugData.priority || 'No definida'}`);
    } else if (debugResponse.status === 404) {
      console.log('   ⚠️ Endpoint de debug no disponible (aún desplegando)');
    } else {
      console.log(`   ❌ Error: ${debugResponse.status}`);
    }
    
    // 4. Verificar si hay problemas de CORS o caché
    console.log('\n4️⃣ VERIFICANDO HEADERS Y CACHÉ:');
    const headersResponse = await fetch(`${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}`, {
      method: 'HEAD'
    });
    
    console.log(`   HEAD request status: ${headersResponse.status}`);
    console.log('   Headers relevantes:');
    console.log(`     Cache-Control: ${headersResponse.headers.get('cache-control') || 'No definido'}`);
    console.log(`     Content-Type: ${headersResponse.headers.get('content-type') || 'No definido'}`);
    console.log(`     Last-Modified: ${headersResponse.headers.get('last-modified') || 'No definido'}`);
    
    // 5. Diagnóstico final
    console.log('\n🎯 DIAGNÓSTICO:');
    
    if (clienteResponse.ok) {
      const data = await (await fetch(`${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}&t=${Date.now()}`)).json();
      const hasName = data.data?.nombreEmpresa || data.data?.empresa?.nombre;
      const hasTarjetas = data.data?.tarjetas?.length > 0;
      
      if (!hasName && !hasTarjetas) {
        console.log('   ❌ PROBLEMA: La API del cliente no devuelve datos');
        console.log('   🔧 CAUSA PROBABLE: Desconexión entre JSON file y endpoint');
        console.log('   💡 SOLUCIÓN: Revisar src/app/api/portal/config-v2/route.ts');
      } else if (!hasName) {
        console.log('   ❌ PROBLEMA: No se encuentra nombreEmpresa en la respuesta');
        console.log('   🔧 CAUSA PROBABLE: El campo no se está mapeando correctamente');
        console.log('   💡 SOLUCIÓN: Verificar mapeo en config-v2 endpoint');
      } else {
        console.log('   ✅ DATOS ENCONTRADOS: La API funciona parcialmente');
        console.log('   🔧 PROBLEMA: Falta sincronización con admin panel');
        console.log('   💡 SOLUCIÓN: Verificar notificaciones SSE y actualización en tiempo real');
      }
    } else {
      console.log('   ❌ PROBLEMA CRÍTICO: API del cliente no responde');
      console.log('   🔧 CAUSA PROBABLE: Endpoint no desplegado o error interno');
      console.log('   💡 SOLUCIÓN: Verificar deploy y logs del servidor');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

diagnosticarFlujoCompleto();
