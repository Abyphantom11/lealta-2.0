#!/usr/bin/env node

/**
 * 🔍 DEBUG RÁPIDO: Ver qué devuelve config-v2 ahora mismo
 */

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function debugConfigV2() {
  console.log('🔍 DEBUGEANDO CONFIG-V2 AHORA MISMO');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`https://lealta-1ooxmm2c1-themaster2648-9501s-projects.vercel.app/api/portal/config-v2?businessId=${businessId}`);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n📦 ESTRUCTURA DE RESPUESTA:');
      console.log('Has success:', !!data.success);
      console.log('Has data:', !!data.data);
      console.log('Top level keys:', Object.keys(data));
      
      if (data.data) {
        console.log('\n📊 DATOS INTERNOS:');
        console.log('Real data keys:', Object.keys(data.data));
        console.log('Banners count:', data.data.banners?.length || 0);
        console.log('Promociones count:', data.data.promociones?.length || 0);
        console.log('Favorito del día:', !!data.data.favoritoDelDia);
        
        if (data.data.banners?.length > 0) {
          console.log('\n📢 PRIMER BANNER:');
          console.log('- Título:', data.data.banners[0].titulo);
          console.log('- Activo:', data.data.banners[0].activo);
          console.log('- Imagen URL:', data.data.banners[0].imagenUrl ? '✅' : '❌');
        }
        
        if (data.data.promociones?.length > 0) {
          console.log('\n🎁 PRIMERA PROMOCIÓN:');
          console.log('- Título:', data.data.promociones[0].titulo);
          console.log('- Activo:', data.data.promociones[0].activo);
          console.log('- Imagen URL:', data.data.promociones[0].imagenUrl ? '✅' : '❌');
        }
        
        if (data.data.favoritoDelDia) {
          console.log('\n⭐ FAVORITO DEL DÍA:');
          console.log('- Product Name:', data.data.favoritoDelDia.productName);
          console.log('- Activo:', data.data.favoritoDelDia.activo);
          console.log('- Imagen URL:', data.data.favoritoDelDia.imageUrl ? '✅' : '❌');
        }
      }
    } else {
      console.log('❌ Error response:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugConfigV2().catch(console.error);
