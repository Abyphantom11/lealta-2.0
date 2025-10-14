/**
 * Script para probar directamente el API config-v2
 */

const businessId = 'cmgf5px5f0000eyy0elci9yds';
const url = `http://localhost:3001/api/portal/config-v2/?businessId=${businessId}`;

console.log('🔍 PROBANDO API PORTAL CONFIG V2');
console.log('================================');
console.log(`URL: ${url}`);

fetch(url)
  .then(response => response.json())
  .then(data => {
    console.log('\n✅ RESPUESTA DEL API:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      const { banners, promociones, favoritoDelDia, businessId: responseBusinessId } = data.data;
      
      console.log('\n📊 RESUMEN:');
      console.log(`Business ID: ${responseBusinessId}`);
      console.log(`Banners: ${banners?.length || 0}`);
      console.log(`Promociones: ${promociones?.length || 0}`);
      console.log(`Favorito del día: ${favoritoDelDia ? 'Sí' : 'No'}`);
      
      if (banners?.length > 0) {
        console.log('\n📢 BANNERS ENCONTRADOS:');
        banners.forEach(b => {
          console.log(`  - "${b.titulo}" | Día: ${b.dia || 'todos'} | Imagen: ${b.imagenUrl ? '✅' : '❌'}`);
        });
      }
      
      if (promociones?.length > 0) {
        console.log('\n🎁 PROMOCIONES ENCONTRADAS:');
        promociones.forEach(p => {
          console.log(`  - "${p.titulo}" | Día: ${p.dia || 'todos'} | Imagen: ${p.imagenUrl ? '✅' : '❌'}`);
        });
      }
      
      if (responseBusinessId === 'default') {
        console.log('\n❌ PROBLEMA: El API sigue devolviendo businessId "default"');
        console.log('Esto significa que no está encontrando el businessId correcto');
      } else {
        console.log('\n✅ ÉXITO: El API está usando el businessId correcto');
      }
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
