#!/usr/bin/env node

/**
 * 🔍 VERIFICAR LOGS DE PRODUCCIÓN
 * 
 * Script para hacer un fetch a producción y luego
 * ir a Vercel para ver los logs
 */

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';
const PRODUCTION_URL = 'https://lealta.vercel.app';

async function verificarProduccion() {
  console.log('🔍 VERIFICANDO LOGS EN PRODUCCIÓN');
  console.log('='.repeat(60));
  console.log('\n📝 INSTRUCCIONES:');
  console.log('1. Este script hará un fetch a producción');
  console.log('2. Verás el resultado aquí');
  console.log('3. Luego ve a Vercel > Tu proyecto > Logs');
  console.log('4. Busca los logs que empiezan con "🔍 [CONFIG-V2]"');
  console.log('');

  const timestamp = Date.now();
  const url = `${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}&t=${timestamp}`;

  console.log(`\n🌐 URL: ${url}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('\n🔄 Haciendo fetch...\n');

  try {
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const realData = data.data || data;

      console.log('✅ RESPUESTA RECIBIDA:');
      console.log('─'.repeat(60));
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success}`);
      console.log('');
      console.log('📦 Arrays recibidos:');
      console.log(`   - banners: ${realData.banners?.length || 0}`);
      console.log(`   - promociones: ${realData.promociones?.length || 0}`);
      console.log(`   - recompensas: ${realData.recompensas?.length || 0}`);
      console.log(`   - favoritoDelDia: ${realData.favoritoDelDia ? 'SÍ' : 'NO'}`);
      console.log('');
      console.log('📊 Item counts (metadata):');
      console.log(`   - banners: ${realData.itemCounts?.banners || 0}`);
      console.log(`   - promociones: ${realData.itemCounts?.promociones || 0}`);
      console.log(`   - favoritos: ${realData.itemCounts?.favoritos || 0}`);

      console.log('\n' + '='.repeat(60));
      console.log('📝 AHORA VE A VERCEL PARA VER LOS LOGS:');
      console.log('='.repeat(60));
      console.log('\n1. Abre: https://vercel.com/');
      console.log('2. Selecciona tu proyecto "lealta"');
      console.log('3. Ve a la pestaña "Logs"');
      console.log('4. Busca los logs de hace unos segundos');
      console.log('5. Busca líneas que empiecen con: "🔍 [CONFIG-V2]"');
      console.log('\n📋 VERÁS ESTOS LOGS:');
      console.log('   • Debug info (banners/promociones raw)');
      console.log('   • Día comercial calculado');
      console.log('   • Resultado del filtrado por día');
      console.log('   • Resultado del filtrado por activo');
      console.log('\n💡 ESO TE DIRÁ EXACTAMENTE DÓNDE SE PIERDEN LOS DATOS');

      if (realData.banners?.length === 0 && realData.promociones?.length === 0) {
        console.log('\n⚠️  LOS ARRAYS ESTÁN VACÍOS');
        console.log('Los logs de Vercel te dirán si:');
        console.log('   a) No se encontraron en la BD');
        console.log('   b) Se filtraron por día incorrecto');
        console.log('   c) Se filtraron por no estar activos');
      }

    } else {
      console.log(`❌ Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`Respuesta: ${text}`);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

verificarProduccion().catch(console.error);
