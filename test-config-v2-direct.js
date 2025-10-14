#!/usr/bin/env node

/**
 * 🔍 PROBAR: API config-v2 directo sin autenticación
 */

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function testConfigV2Direct() {
  console.log('🔍 PROBANDO API config-v2 DIRECTO');
  console.log('='.repeat(50));
  
  try {
    // Intentar diferentes formas de acceder
    const urls = [
      `http://localhost:3000/api/portal/config-v2?businessId=${businessId}`,
      `https://lealta.vercel.app/api/portal/config-v2?businessId=${businessId}`,
      `https://lealta-1ooxmm2c1-themaster2648-9501s-projects.vercel.app/api/portal/config-v2?businessId=${businessId}`
    ];
    
    for (const url of urls) {
      console.log(`\n📡 Probando: ${url}`);
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Node.js Test Script',
            'Accept': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          
          console.log('   ✅ Respuesta exitosa:');
          console.log(`   - Has success: ${!!data.success}`);
          console.log(`   - Has data: ${!!data.data}`);
          
          if (data.data) {
            console.log(`   - Banners: ${data.data.banners?.length || 0}`);
            console.log(`   - Promociones: ${data.data.promociones?.length || 0}`);
            console.log(`   - Favorito: ${!!data.data.favoritoDelDia}`);
            
            if (data.data.banners?.length > 0) {
              console.log(`   - Primer banner: "${data.data.banners[0].titulo}"`);
            }
            if (data.data.promociones?.length > 0) {
              console.log(`   - Primera promoción: "${data.data.promociones[0].titulo}"`);
            }
            if (data.data.favoritoDelDia) {
              console.log(`   - Favorito: "${data.data.favoritoDelDia.productName}"`);
            }
          }
          
          break; // Si uno funciona, no probar los demás
        } else {
          console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error de conexión: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testConfigV2Direct().catch(console.error);
