/**
 * 🚀 SCRIPT PARA PROBAR EN PRODUCCIÓN
 * Copia y pega este código en la consola del navegador en producción
 */

console.log('🚀 TEST DE PRODUCCIÓN - PORTAL CLIENTE');
console.log('=====================================');

// 1. Función para obtener día comercial (igual que el sistema)
function getCurrentBusinessDay(resetHour = 4) {
  const now = new Date();
  const currentHour = now.getHours();
  
  if (currentHour < resetHour) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][yesterday.getDay()];
  }
  
  return ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][now.getDay()];
}

// 2. Verificar día comercial actual
const businessDay = getCurrentBusinessDay();
const now = new Date();
console.log(`🕒 Hora actual: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
console.log(`🏢 Día comercial actual: ${businessDay}`);

// 3. Probar API con cache-busting
const businessId = 'cmgf5px5f0000eyy0elci9yds';
const timestamp = new Date().getTime();

console.log(`\n🌐 Probando API: /api/portal/config-v2?businessId=${businessId}`);

fetch(`/api/portal/config-v2?businessId=${businessId}&t=${timestamp}&cb=${Math.random()}`, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
})
  .then(response => {
    console.log('📡 Respuesta API:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers Cache-Control: ${response.headers.get('Cache-Control') || 'none'}`);
    return response.json();
  })
  .then(data => {
    console.log('\n📊 DATOS RECIBIDOS DE API:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Has data: ${!!data.data}`);
    
    // Extraer datos reales
    const realData = data.data || data;
    
    console.log(`   Banners totales: ${realData.banners?.length || 0}`);
    console.log(`   Promociones totales: ${realData.promociones?.length || 0}`);
    console.log(`   Favorito del día: ${realData.favoritoDelDia ? 'SÍ' : 'NO'}`);
    
    // Filtrar por día comercial actual
    if (realData.banners) {
      const bannersVisibles = realData.banners.filter(b => 
        b.activo && 
        b.imagenUrl && 
        b.imagenUrl.trim() !== '' && 
        (!b.dia || b.dia === businessDay)
      );
      
      console.log(`\n📢 BANNERS VISIBLES PARA ${businessDay.toUpperCase()}: ${bannersVisibles.length}`);
      bannersVisibles.forEach((banner, idx) => {
        console.log(`   ${idx + 1}. "${banner.titulo}" | Día: ${banner.dia || 'cualquiera'}`);
        console.log(`      Imagen: ${banner.imagenUrl}`);
      });
      
      if (bannersVisibles.length === 0 && realData.banners.length > 0) {
        console.log('\n🔍 BANNERS DISPONIBLES PERO NO VISIBLES:');
        realData.banners.forEach(banner => {
          const reasons = [];
          if (!banner.activo) reasons.push('inactivo');
          if (!banner.imagenUrl || banner.imagenUrl.trim() === '') reasons.push('sin imagen');
          if (banner.dia && banner.dia !== businessDay) reasons.push(`día ${banner.dia} ≠ ${businessDay}`);
          
          console.log(`   - "${banner.titulo}": ${reasons.join(', ')}`);
        });
      }
    }
    
    if (realData.promociones) {
      const promocionesVisibles = realData.promociones.filter(p => 
        p.activo && 
        p.imagenUrl && 
        p.imagenUrl.trim() !== '' && 
        (!p.dia || p.dia === businessDay)
      );
      
      console.log(`\n🎁 PROMOCIONES VISIBLES PARA ${businessDay.toUpperCase()}: ${promocionesVisibles.length}`);
      promocionesVisibles.forEach((promo, idx) => {
        console.log(`   ${idx + 1}. "${promo.titulo}" | Día: ${promo.dia || 'cualquiera'}`);
        console.log(`      Imagen: ${promo.imagenUrl}`);
      });
      
      if (promocionesVisibles.length === 0 && realData.promociones.length > 0) {
        console.log('\n🔍 PROMOCIONES DISPONIBLES PERO NO VISIBLES:');
        realData.promociones.forEach(promo => {
          const reasons = [];
          if (!promo.activo) reasons.push('inactiva');
          if (!promo.imagenUrl || promo.imagenUrl.trim() === '') reasons.push('sin imagen');
          if (promo.dia && promo.dia !== businessDay) reasons.push(`día ${promo.dia} ≠ ${businessDay}`);
          
          console.log(`   - "${promo.titulo}": ${reasons.join(', ')}`);
        });
      }
    }
    
    if (realData.favoritoDelDia) {
      console.log(`\n⭐ FAVORITO DEL DÍA: SÍ`);
      console.log(`   Producto: "${realData.favoritoDelDia.productName}"`);
      console.log(`   Imagen: ${realData.favoritoDelDia.imageUrl || 'NO'}`);
      console.log(`   Día: ${realData.favoritoDelDia.dia || 'cualquiera'}`);
    } else {
      console.log(`\n⭐ FAVORITO DEL DÍA: NO`);
    }
    
    // Conclusión
    const hasVisibleContent = (realData.banners?.some(b => 
      b.activo && b.imagenUrl && (!b.dia || b.dia === businessDay)
    )) || 
    (realData.promociones?.some(p => 
      p.activo && p.imagenUrl && (!p.dia || p.dia === businessDay)
    )) || 
    (realData.favoritoDelDia && realData.favoritoDelDia.imageUrl);
    
    console.log('\n🎯 CONCLUSIÓN:');
    if (hasVisibleContent) {
      console.log('✅ HAY CONTENIDO QUE DEBERÍA MOSTRARSE');
      console.log('🔍 Si no se ve, revisar:');
      console.log('   1. URLs de imágenes accesibles');
      console.log('   2. Errores en consola');
      console.log('   3. Componentes React renderizando');
    } else {
      console.log('❌ NO HAY CONTENIDO VISIBLE');
      console.log('📝 Necesitas agregar contenido con imágenes desde el admin');
    }
    
    console.log('\n📱 DATOS COMPLETOS DE LA API:');
    console.log(realData);
  })
  .catch(error => {
    console.error('❌ ERROR EN API:', error);
    console.log('\n🔍 Posibles causas:');
    console.log('   1. API no disponible en producción');
    console.log('   2. BusinessId incorrecto');
    console.log('   3. Error de red o servidor');
  });

// 4. Verificar variables de entorno del cliente
console.log('\n🔧 VERIFICAR CONFIGURACIÓN:');
console.log(`   URL base: ${window.location.origin}`);
console.log(`   User Agent: ${navigator.userAgent.substring(0, 50)}...`);

// 5. Verificar localStorage
console.log('\n💾 VERIFICAR LOCALSTORAGE:');
const portalConfigKey = `portalConfig_${businessId}`;
const cachedConfig = localStorage.getItem(portalConfigKey);
if (cachedConfig) {
  console.log(`   ${portalConfigKey}: EXISTE (${cachedConfig.length} chars)`);
  try {
    const parsed = JSON.parse(cachedConfig);
    console.log(`   Banners en cache: ${parsed.banners?.length || 0}`);
    console.log(`   Promociones en cache: ${parsed.promociones?.length || 0}`);
  } catch (e) {
    console.log('   ❌ Error parsing cache');
  }
} else {
  console.log(`   ${portalConfigKey}: NO EXISTE`);
}

console.log('\n🏁 TEST COMPLETADO - Revisa los resultados arriba');
