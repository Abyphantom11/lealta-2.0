// Verificar que el cliente pueda leer los favoritos del día correctamente
import { promises as fs } from 'fs';
import path from 'path';

async function testClientPortalRead() {
  console.log('🔍 TESTING CLIENT PORTAL READ');
  console.log('===============================');
  
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
  
  try {
    // 1. Leer configuración del JSON como lo haría el cliente
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    console.log('📄 Configuración completa del cliente:');
    console.log(JSON.stringify(config.favoritoDelDia, null, 2));
    
    // 2. Simular la lógica de getFavoritoDelDia del cliente para domingo
    const today = 'domingo';
    
    // Lógica del useAutoRefreshPortalConfig
    const getFavoritoDelDia = (config) => {
      const favoritos = config.favoritoDelDia;
      
      if (!favoritos) {
        console.log('❌ No hay favoritos definidos');
        return null;
      }
      
      // Buscar favorito para el día actual
      if (typeof favoritos === 'object' && favoritos[today]) {
        console.log(`✅ Favorito para ${today} encontrado:`, favoritos[today]);
        return favoritos[today];
      }
      
      // Si es un array (formato antiguo)
      if (Array.isArray(favoritos)) {
        const favoritoHoy = favoritos.find(f => 
          f.dia === today || 
          (f.dias && f.dias.includes(today))
        );
        
        if (favoritoHoy) {
          console.log(`✅ Favorito para ${today} encontrado (array):`, favoritoHoy);
          return favoritoHoy;
        }
      }
      
      console.log(`❌ No se encontró favorito para ${today}`);
      return null;
    };
    
    const favoritoDelDia = getFavoritoDelDia(config);
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('Favorito del día que verá el cliente:', favoritoDelDia);
    
    // Verificar que contiene los datos esperados
    if (favoritoDelDia && favoritoDelDia.titulo === 'asdad') {
      console.log('✅ ¡ÉXITO! El cliente verá "asdad" como favorito del domingo');
    } else {
      console.log('❌ ERROR: El cliente no ve el favorito correcto');
    }
    
  } catch (error) {
    console.error('❌ Error leyendo configuración:', error);
  }
}

testClientPortalRead()
  .then(() => {
    console.log('\n🏁 Verificación completada');
    process.exit(0);
  })
  .catch(console.error);
