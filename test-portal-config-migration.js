/**
 * Script de prueba para verificar la migración a /api/portal/config-v2
 * Compara ambas APIs para asegurar compatibilidad
 */

const businessId = 'cafe-central'; // Cambiar por un business existente
const baseUrl = 'http://localhost:3001'; // Puerto del servidor Next.js

async function testPortalConfigMigration() {
  console.log('🧪 INICIANDO PRUEBAS DE MIGRACIÓN PORTAL CONFIG V2');
  console.log('=' .repeat(60));

  try {
    // 1. Probar API v1 (original)
    console.log('📋 1️⃣ Probando API original /api/portal/config...');
    const v1Response = await fetch(`${baseUrl}/api/portal/config?businessId=${businessId}`);
    
    if (v1Response.ok) {
      const v1Data = await v1Response.json();
      console.log('✅ API v1 funciona correctamente');
      console.log(`   - Banners: ${v1Data.banners?.length || 0}`);
      console.log(`   - Promociones: ${v1Data.promociones?.length || 0}`);
      console.log(`   - Recompensas: ${v1Data.recompensas?.length || 0}`);
      console.log(`   - Favorito del día: ${v1Data.favoritoDelDia?.length || 0}`);
      console.log(`   - Tarjetas: ${v1Data.tarjetas?.length || 0}`);
      console.log(`   - Fuente de datos: ${v1Data.settings?.dataSource || 'file-based'}`);
    } else {
      console.log('❌ API v1 falló:', v1Response.status);
    }

    console.log('');

    // 2. Probar API v2 (nueva con BD)
    console.log('📋 2️⃣ Probando API nueva /api/portal/config-v2...');
    const v2Response = await fetch(`${baseUrl}/api/portal/config-v2?businessId=${businessId}`);
    
    if (v2Response.ok) {
      const v2Data = await v2Response.json();
      console.log('✅ API v2 funciona correctamente');
      console.log(`   - Banners: ${v2Data.banners?.length || 0}`);
      console.log(`   - Promociones: ${v2Data.promociones?.length || 0}`);
      console.log(`   - Recompensas: ${v2Data.recompensas?.length || 0}`);
      console.log(`   - Favorito del día: ${v2Data.favoritoDelDia?.length || 0}`);
      console.log(`   - Tarjetas: ${v2Data.tarjetas?.length || 0}`);
      console.log(`   - Fuente de datos: ${v2Data.settings?.dataSource || 'unknown'}`);
      console.log(`   - Versión: ${v2Data.settings?.version || 'unknown'}`);
    } else {
      console.log('❌ API v2 falló:', v2Response.status);
      const errorText = await v2Response.text();
      console.log('   Error:', errorText);
    }

    console.log('');

    // 3. Verificar estructura de datos compatibles
    if (v1Response.ok && v2Response.ok) {
      const v1Data = await v1Response.json();
      const v2Data = await v2Response.json();
      
      console.log('📊 3️⃣ Verificando compatibilidad de estructura...');
      
      // Verificar que v2 tiene las mismas propiedades que v1
      const v1Keys = Object.keys(v1Data);
      const v2Keys = Object.keys(v2Data);
      
      const missingInV2 = v1Keys.filter(key => !v2Keys.includes(key));
      const extraInV2 = v2Keys.filter(key => !v1Keys.includes(key));
      
      if (missingInV2.length === 0) {
        console.log('✅ Todas las propiedades de v1 están presentes en v2');
      } else {
        console.log('❌ Propiedades faltantes en v2:', missingInV2);
      }
      
      if (extraInV2.length > 0) {
        console.log('ℹ️  Propiedades adicionales en v2:', extraInV2);
      }
      
      // Verificar estructura de banners
      if (v1Data.banners && v2Data.banners && v1Data.banners.length > 0 && v2Data.banners.length > 0) {
        const v1Banner = v1Data.banners[0];
        const v2Banner = v2Data.banners[0];
        const v1BannerKeys = Object.keys(v1Banner);
        const v2BannerKeys = Object.keys(v2Banner);
        
        const bannerMissing = v1BannerKeys.filter(key => !v2BannerKeys.includes(key));
        
        if (bannerMissing.length === 0) {
          console.log('✅ Estructura de banners compatible');
        } else {
          console.log('❌ Propiedades faltantes en banners v2:', bannerMissing);
        }
      }
    }

    console.log('');
    console.log('🎉 PRUEBAS COMPLETADAS');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testPortalConfigMigration();
}

module.exports = { testPortalConfigMigration };
