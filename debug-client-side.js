/**
 * Script para simular lo que hace el hook useAutoRefreshPortalConfig en el navegador
 */

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function debugClientSide() {
  console.log('🧪 SIMULANDO HOOK useAutoRefreshPortalConfig');
  console.log('=============================================');
  
  try {
    // Paso 1: Fetch del API (como lo hace fetchConfig)
    const timestamp = new Date().getTime();
    const currentDay = new Date().toDateString();
    const url = `http://localhost:3001/api/portal/config-v2?businessId=${businessId}&t=${timestamp}&dayKey=${currentDay}`;
    
    console.log(`\n🔗 URL: ${url}`);
    
    const response = await fetch(url);
    const apiData = await response.json();
    
    console.log('\n📊 CONFIG CRUDO DEL API:');
    console.log(`  Success: ${apiData.success}`);
    console.log(`  Banners count: ${apiData.data?.banners?.length || 0}`);
    console.log(`  Promociones count: ${apiData.data?.promociones?.length || 0}`);
    
    // Paso 2: Simular getBannersForBusinessDay
    const config = apiData.success ? apiData.data : null;
    
    if (!config?.banners) {
      console.log('\n❌ NO HAY BANNERS EN CONFIG');
      return;
    }
    
    console.log('\n🔍 ANALIZANDO BANNERS:');
    const banners = config.banners || [];
    console.log(`  Banners totales: ${banners.length}`);
    
    banners.forEach((b, i) => {
      console.log(`  Banner ${i + 1}:`);
      console.log(`    - ID: ${b.id}`);
      console.log(`    - Título: ${b.titulo}`);
      console.log(`    - Activo: ${b.activo}`);
      console.log(`    - imagenUrl: ${b.imagenUrl ? '✅ ' + b.imagenUrl.substring(0, 50) + '...' : '❌ undefined/null'}`);
      console.log(`    - Día: ${b.dia || 'todos'}`);
    });
    
    // Filtro activos con imagen
    const todasActivas = banners.filter((b) => 
      b.activo !== false && b.imagenUrl && b.imagenUrl.trim() !== ''
    );
    
    console.log(`\n✅ BANNERS ACTIVOS CON IMAGEN: ${todasActivas.length}`);
    todasActivas.forEach((b, i) => {
      console.log(`  ${i + 1}. "${b.titulo}" - Día: ${b.dia}`);
    });
    
    // Simular isItemVisibleInBusinessDay (lógica simplificada)
    const getCurrentBusinessDayName = () => {
      const now = new Date();
      const hour = now.getHours();
      const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      
      if (hour < 4) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return days[yesterday.getDay()];
      }
      
      return days[now.getDay()];
    };
    
    const currentBusinessDay = getCurrentBusinessDayName();
    console.log(`\n📅 DÍA COMERCIAL ACTUAL: ${currentBusinessDay}`);
    
    const bannersVisibles = todasActivas.filter(banner => {
      // Si no tiene día específico, se muestra siempre
      if (!banner.dia) return true;
      // Si coincide con el día actual
      return banner.dia === currentBusinessDay;
    });
    
    console.log(`\n🎯 BANNERS QUE DEBERÍAN MOSTRARSE: ${bannersVisibles.length}`);
    bannersVisibles.forEach((b, i) => {
      console.log(`  ${i + 1}. "${b.titulo}" - Día: ${b.dia} - ✅ VISIBLE`);
    });
    
    if (bannersVisibles.length === 0) {
      console.log('\n❌ PROBLEMA: No hay banners visibles para el día actual');
      console.log('🔧 Posibles causas:');
      console.log(`   - Día del banner (${banners[0]?.dia}) != día actual (${currentBusinessDay})`);
      console.log('   - Banner inactivo');
      console.log('   - Sin imagen');
    } else {
      console.log('\n✅ TODO CORRECTO: Banners deberían aparecer en el cliente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugClientSide();
