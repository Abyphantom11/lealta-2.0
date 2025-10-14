// Test específico para verificar qué devuelve getFavoritoDelDia
const businessId = 'cmgf5px5f0000eyy0elci9yds';

// Simular lo que hace getFavoritoDelDia
async function testGetFavoritoDelDia() {
  console.log('🔍 TESTING getFavoritoDelDia');
  console.log('============================');
  
  try {
    // 1. Simular llamada al endpoint como lo hace useAutoRefreshPortalConfig
    const response = await fetch(`http://localhost:3001/api/portal/config?businessId=${businessId}&timestamp=${Date.now()}`);
    const result = await response.json();
    const config = result.data;
    
    console.log('📄 Raw config.favoritoDelDia:', config.favoritoDelDia);
    
    // 2. Simular lógica de getFavoritoDelDia para domingo
    const diaActual = 'domingo';
    const favoritoData = config.favoritoDelDia;
    
    let favorito = null;
    
    if (Array.isArray(favoritoData)) {
      // Formato array (como PostgreSQL)
      favorito = favoritoData.find(
        (f) => f.activo !== false && (f.dia === diaActual || f.dia?.toLowerCase() === diaActual?.toLowerCase())
      ) || favoritoData[0];
    } else if (typeof favoritoData === 'object') {
      // Formato objeto con claves por día (como JSON file)
      favorito = favoritoData[diaActual] || favoritoData[Object.keys(favoritoData)[0]];
    }
    
    console.log('\n⭐ Favorito del día resultado:', favorito);
    
    // 3. Verificar los campos que tiene el favorito
    if (favorito) {
      console.log('\n🔍 Campos disponibles:');
      Object.keys(favorito).forEach(key => {
        console.log(`  ${key}: ${favorito[key]}`);
      });
      
      // Verificar específicamente campos de título
      console.log('\n🏷️ Campos de título:');
      console.log(`  favorito.titulo: "${favorito.titulo}"`);
      console.log(`  favorito.nombre: "${favorito.nombre}"`);
      console.log(`  favorito.productName: "${favorito.productName}"`);
      
      // Lo que mostraría el componente
      console.log('\n📱 Lo que mostraría el componente:');
      console.log(`  Título mostrado: "${favorito.titulo || favorito.nombre || 'Favorito del Día'}"`);
      console.log(`  ¿Tiene imageUrl?: ${favorito.imageUrl ? 'SÍ' : 'NO'}`);
      console.log(`  ¿Tiene imagenUrl?: ${favorito.imagenUrl ? 'SÍ' : 'NO'}`);
      console.log(`  ¿Se renderizaría?: ${(favorito.imageUrl || favorito.imagenUrl) ? 'SÍ' : 'NO (no hay imagen)'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGetFavoritoDelDia();
