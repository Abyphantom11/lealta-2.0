/**
 * Script para diagnosticar el problema del banner "Love Me Sky"
 * Verifica base de datos, localStorage y cache
 */

async function diagnosticLoveMeSky() {
  console.log('🔍 === DIAGNÓSTICO LOVE ME SKY ===');
  
  try {
    // 1. Verificar en la API de config-v2
    console.log('📡 1. Verificando API config-v2...');
    
    // Probar con diferentes businessId que podrían estar relacionados
    const businessIdsToCheck = [
      'love-me-sky',
      'lovemesky', 
      'cl_love_me_sky',
      'default'
    ];
    
    for (const businessId of businessIdsToCheck) {
      console.log(`🔍 Verificando businessId: ${businessId}`);
      
      try {
        const response = await fetch(`/api/portal/config-v2?businessId=${businessId}&t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const banners = data.data?.banners || [];
          
          console.log(`✅ API response para ${businessId}:`, {
            success: data.success,
            totalBanners: banners.length,
            bannersWithImages: banners.filter(b => b.imagenUrl).length,
            bannerTitles: banners.map(b => b.titulo)
          });
          
          // Buscar específicamente banners relacionados con bebidas/agua
          const suspiciousBanners = banners.filter(banner => 
            banner.titulo?.toLowerCase().includes('agua') ||
            banner.titulo?.toLowerCase().includes('grifo') ||
            banner.titulo?.toLowerCase().includes('200') ||
            banner.descripcion?.toLowerCase().includes('agua') ||
            banner.descripcion?.toLowerCase().includes('grifo')
          );
          
          if (suspiciousBanners.length > 0) {
            console.log('🚨 BANNERS SOSPECHOSOS ENCONTRADOS:', suspiciousBanners);
          }
          
        } else {
          console.log(`❌ Error ${response.status} para businessId: ${businessId}`);
        }
        
      } catch (error) {
        console.log(`❌ Error fetching ${businessId}:`, error);
      }
    }
    
    // 2. Verificar localStorage
    console.log('\n📱 2. Verificando localStorage...');
    
    const storageKeys = Object.keys(localStorage).filter(key => 
      key.includes('portal') || 
      key.includes('branding') || 
      key.includes('love') ||
      key.includes('config')
    );
    
    console.log('🔍 Claves de localStorage relacionadas:', storageKeys);
    
    storageKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        console.log(`📦 ${key}:`, data);
        
        if (data.banners) {
          console.log(`   Banners en ${key}:`, data.banners.length);
          data.banners.forEach((banner, idx) => {
            console.log(`     ${idx + 1}. ${banner.titulo || banner.title}`);
          });
        }
      } catch (error) {
        console.log(`❌ Error parsing ${key}:`, error);
      }
    });
    
    // 3. Limpiar cache
    console.log('\n🧹 3. Limpiando cache...');
    
    // Limpiar localStorage relacionado
    storageKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Eliminado: ${key}`);
    });
    
    // Limpiar cache del navegador para las APIs
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('🗂️ Caches disponibles:', cacheNames);
      
      for (const cacheName of cacheNames) {
        if (cacheName.includes('portal') || cacheName.includes('api')) {
          await caches.delete(cacheName);
          console.log(`✅ Cache eliminado: ${cacheName}`);
        }
      }
    }
    
    console.log('\n✅ Diagnóstico completado. Recarga la página para ver si se solucionó el problema.');
    
  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnosticLoveMeSky();
