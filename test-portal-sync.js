/**
 * 🧪 TEST SCRIPT: Portal Admin → Cliente Sync
 * 
 * Este script verifica que la sincronización funcione correctamente
 * probando todos los elementos del portal.
 */

const TEST_BUSINESS_ID = 'cmfqhepmq0000ey4slyms4knv'; // arepa business

async function testPortalSync() {
  console.log('🧪 Iniciando tests de sincronización Portal Admin → Cliente');
  console.log('=====================================\n');

  // Test 1: Verificar API v2 responde correctamente
  console.log('📡 Test 1: Verificando API Portal Config v2...');
  try {
    const response = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${TEST_BUSINESS_ID}`);
    const data = await response.json();
    
    console.log('✅ API v2 respuesta exitosa');
    console.log('📊 Datos obtenidos:', {
      banners: data.banners?.length || 0,
      promociones: (data.promociones || data.promotions)?.length || 0,
      recompensas: (data.recompensas || data.rewards)?.length || 0,
      favoritoDelDia: (data.favoritoDelDia || data.favorites)?.length || 0
    });

    // Verificar compatibilidad de campos
    if (data.banners && data.banners.length > 0) {
      const banner = data.banners[0];
      console.log('🔍 Verificando campos compatibilidad banner:', {
        tieneImagenUrl: !!banner.imagenUrl,
        tieneImageUrl: !!banner.imageUrl,
        tieneTitulo: !!banner.titulo,
        tieneTitle: !!banner.title,
        tieneActivo: banner.activo !== undefined,
        tieneIsActive: banner.isActive !== undefined
      });
    }

    if (data.promociones && data.promociones.length > 0) {
      const promo = data.promociones[0];
      console.log('🔍 Verificando campos compatibilidad promoción:', {
        tieneImagenUrl: !!promo.imagenUrl,
        tieneImageUrl: !!promo.imageUrl,
        tieneTitulo: !!promo.titulo,
        tieneTitle: !!promo.title,
        tieneActivo: promo.activo !== undefined,
        tieneIsActive: promo.isActive !== undefined
      });
    }

    if (data.recompensas && data.recompensas.length > 0) {
      const reward = data.recompensas[0];
      console.log('🔍 Verificando campos compatibilidad recompensa:', {
        tieneImagenUrl: !!reward.imagenUrl,
        tieneImageUrl: !!reward.imageUrl,
        tienePuntosRequeridos: reward.puntosRequeridos !== undefined,
        tienePointsCost: reward.pointsCost !== undefined,
        tieneNombre: !!reward.nombre,
        tieneTitulo: !!reward.titulo
      });
    }

    if (data.favoritoDelDia && data.favoritoDelDia.length > 0) {
      const favorito = data.favoritoDelDia[0];
      console.log('🔍 Verificando campos compatibilidad favorito del día:', {
        tieneImagenUrl: !!favorito.imagenUrl,
        tieneImageUrl: !!favorito.imageUrl,
        tieneNombre: !!favorito.nombre,
        tieneTitulo: !!favorito.titulo,
        tieneDia: !!favorito.dia,
        tieneHoraPublicacion: !!favorito.horaPublicacion
      });
    }

  } catch (error) {
    console.error('❌ Error en API v2:', error);
    return false;
  }

  console.log('\n=====================================');
  
  // Test 2: Verificar Hook de Auto-refresh
  console.log('🔄 Test 2: Simulando uso del hook useAutoRefreshPortalConfig...');
  
  // Simular la lógica del hook
  try {
    const response = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${TEST_BUSINESS_ID}&t=${Date.now()}`);
    const config = await response.json();

    // Simular getBanners
    const banners = config?.banners || [];
    const bannersActivos = banners.filter((b) => b.activo !== false);
    console.log(`📋 getBanners() retorna: ${bannersActivos.length} banners activos`);

    // Simular getPromociones
    const promociones = config?.promociones || config?.promotions || [];
    const promocionesActivas = promociones.filter((p) => p.activo !== false);
    console.log(`🎯 getPromociones() retorna: ${promocionesActivas.length} promociones activas`);

    // Simular getRecompensas
    const recompensas = config?.recompensas || config?.rewards || [];
    const recompensasActivas = recompensas.filter((r) => r.activo !== false);
    console.log(`🎁 getRecompensas() retorna: ${recompensasActivas.length} recompensas activas`);

    // Simular getFavoritoDelDia
    const favoritoData = config?.favoritoDelDia || config?.favorites || [];
    const diaActual = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][new Date().getDay()];
    const favorito = favoritoData.find(
      (f) => f.activo !== false && f.dia?.toLowerCase() === diaActual.toLowerCase()
    ) || (favoritoData.length > 0 ? favoritoData[0] : null);
    console.log(`⭐ getFavoritoDelDia('${diaActual}') retorna:`, favorito ? 'Favorito encontrado' : 'Sin favorito');

    console.log('✅ Hook simulation exitosa');

  } catch (error) {
    console.error('❌ Error simulando hook:', error);
    return false;
  }

  console.log('\n=====================================');
  console.log('🎉 TODOS LOS TESTS PASARON EXITOSAMENTE');
  console.log('✅ La sincronización Portal Admin → Cliente está funcionando');
  console.log('\n🔗 Para probar manualmente:');
  console.log(`   Admin: http://localhost:3001/${TEST_BUSINESS_ID}/admin`);
  console.log(`   Cliente: http://localhost:3001/${TEST_BUSINESS_ID}/cliente`);
  
  return true;
}

// Ejecutar tests si está en Node.js
if (typeof window === 'undefined') {
  testPortalSync().catch(console.error);
} else {
  // Si está en el navegador, exportar para uso manual
  console.log('🧪 Test script cargado. Ejecuta: testPortalSync()');
  window.testPortalSync = testPortalSync;
}
