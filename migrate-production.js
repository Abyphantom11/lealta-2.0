/**
 * Script para migrar configuraciones JSON a PostgreSQL en producción
 * Ejecuta en producción para mover datos de archivos JSON a la base de datos
 */

const PRODUCTION_URL = 'https://lealta.vercel.app';
const BUSINESS_ID = 'cmfw0fujf0000eyv8eyhgfzja';

async function migrateProduction() {
  console.log('🚀 Iniciando migración de producción...\n');
  
  try {
    // 1. Verificar estado actual
    console.log('📊 Verificando estado actual...');
    const debugResponse = await fetch(`${PRODUCTION_URL}/api/debug/config-status?businessId=${BUSINESS_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('Estado actual:', JSON.stringify(debugData, null, 2));
    } else {
      console.log('⚠️ No se pudo obtener el estado actual');
    }
    
    console.log('\n🔄 Ejecutando migración...');
    
    // 2. Ejecutar migración
    const migrateResponse = await fetch(`${PRODUCTION_URL}/api/admin/migrate-json-to-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        businessId: BUSINESS_ID
      })
    });
    
    if (!migrateResponse.ok) {
      const errorText = await migrateResponse.text();
      throw new Error(`Migration failed: ${migrateResponse.status} - ${errorText}`);
    }
    
    const result = await migrateResponse.json();
    console.log('✅ Migración completada:', JSON.stringify(result, null, 2));
    
    // 3. Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    const verifyResponse = await fetch(`${PRODUCTION_URL}/api/debug/config-status?businessId=${BUSINESS_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('Estado después de migración:', JSON.stringify(verifyData, null, 2));
      
      // 4. Probar endpoint del cliente
      console.log('\n🎯 Probando endpoint del cliente...');
      const clientResponse = await fetch(`${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        console.log('Configuración cliente - tarjetas:');
        clientData.data.tarjetas?.forEach((tarjeta, index) => {
          console.log(`  ${index + 1}. ${tarjeta.nivel}: "${tarjeta.beneficio}"`);
        });
      } else {
        console.log('⚠️ Error al obtener configuración del cliente');
      }
    }
    
    console.log('\n✅ Proceso completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar migración
migrateProduction();
