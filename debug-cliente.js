/**
 * Script para diagnosticar por qué no se muestran los elementos en /cliente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simular la lógica de business-day-utils
function getCurrentBusinessDay() {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const colombiaTime = new Date(utcTime + (-5 * 3600000)); // UTC-5 Colombia
  
  // Si es antes de las 4:00 AM, consideramos que aún es el día anterior
  if (colombiaTime.getHours() < 4) {
    const yesterday = new Date(colombiaTime);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  
  return colombiaTime;
}

function getDayName(date) {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[date.getDay()];
}

function isItemVisibleInBusinessDay(item) {
  const businessDay = getCurrentBusinessDay();
  const currentDayName = getDayName(businessDay);
  
  // Si el elemento no tiene día específico o coincide con el día actual
  return !item.dia || item.dia === currentDayName;
}

async function diagnosticarPortalCliente() {
  console.log('🔍 DIAGNÓSTICO PORTAL CLIENTE');
  console.log('==============================');
  
  try {
    // Información de fecha y día actual
    const now = new Date();
    const businessDay = getCurrentBusinessDay();
    const currentDayName = getDayName(businessDay);
    
    console.log(`📅 Fecha actual sistema: ${now.toLocaleString('es-CO')}`);
    console.log(`📅 Business Day (después de 4AM): ${businessDay.toLocaleString('es-CO')}`);
    console.log(`📅 Día de negocio actual: ${currentDayName}`);
    console.log(`⏰ Hora actual: ${businessDay.getHours()}:${businessDay.getMinutes().toString().padStart(2, '0')}`);
    
    // Buscar el businessId correcto
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // El que debería usar casa-sabor-demo
    
    console.log(`\n🏢 Business ID: ${businessId}`);
    
    // Obtener todos los elementos activos
    console.log(`\n📢 BANNERS ACTIVOS:`);
    const banners = await prisma.portalBanner.findMany({
      where: {
        businessId: businessId,
        active: true
      }
    });
    
    console.log(`  Total banners activos: ${banners.length}`);
    banners.forEach(banner => {
      const visible = isItemVisibleInBusinessDay(banner);
      console.log(`  - "${banner.title}" | Día: ${banner.dia || 'todos'} | Visible hoy: ${visible ? '✅' : '❌'} | Imagen: ${banner.imageUrl ? '✅' : '❌'}`);
    });
    
    console.log(`\n🎁 PROMOCIONES ACTIVAS:`);
    const promociones = await prisma.portalPromocion.findMany({
      where: {
        businessId: businessId,
        active: true
      }
    });
    
    console.log(`  Total promociones activas: ${promociones.length}`);
    promociones.forEach(promo => {
      const visible = isItemVisibleInBusinessDay(promo);
      console.log(`  - "${promo.title}" | Día: ${promo.dia || 'todos'} | Visible hoy: ${visible ? '✅' : '❌'} | Imagen: ${promo.imageUrl ? '✅' : '❌'}`);
    });
    
    console.log(`\n⭐ FAVORITOS DEL DÍA ACTIVOS:`);
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: {
        businessId: businessId,
        active: true
      }
    });
    
    console.log(`  Total favoritos activos: ${favoritos.length}`);
    favoritos.forEach(fav => {
      const visible = isItemVisibleInBusinessDay(fav);
      console.log(`  - "${fav.productName}" | Día: ${fav.dia || 'todos'} | Visible hoy: ${visible ? '✅' : '❌'} | Imagen: ${fav.imageUrl ? '✅' : '❌'}`);
    });
    
    // Filtros que deberían aplicarse en el cliente
    const bannersVisibles = banners.filter(b => isItemVisibleInBusinessDay(b) && b.imageUrl);
    const promocionesVisibles = promociones.filter(p => isItemVisibleInBusinessDay(p) && p.imageUrl);
    const favoritosVisibles = favoritos.filter(f => isItemVisibleInBusinessDay(f) && f.imageUrl);
    
    console.log(`\n🎯 ELEMENTOS QUE DEBERÍAN MOSTRARSE EN /cliente:`);
    console.log(`  📢 Banners visibles: ${bannersVisibles.length}`);
    bannersVisibles.forEach(b => console.log(`     - "${b.title}"`));
    
    console.log(`  🎁 Promociones visibles: ${promocionesVisibles.length}`);
    promocionesVisibles.forEach(p => console.log(`     - "${p.title}"`));
    
    console.log(`  ⭐ Favoritos visibles: ${favoritosVisibles.length}`);
    favoritosVisibles.forEach(f => console.log(`     - "${f.productName}"`));
    
    if (bannersVisibles.length + promocionesVisibles.length + favoritosVisibles.length === 0) {
      console.log(`\n❌ NO HAY ELEMENTOS VISIBLES`);
      console.log(`🔧 Posibles causas:`);
      console.log(`   - Elementos sin imagen`);
      console.log(`   - Día no coincide con el actual (${currentDayName})`);
      console.log(`   - Elementos inactivos`);
    } else {
      console.log(`\n✅ HAY ${bannersVisibles.length + promocionesVisibles.length + favoritosVisibles.length} ELEMENTOS QUE DEBERÍAN MOSTRARSE`);
      console.log(`🔧 Si no aparecen en /cliente, puede ser:`);
      console.log(`   - Caché del navegador`);
      console.log(`   - Hook useAutoRefreshPortalConfig no se está ejecutando`);
      console.log(`   - BusinessId incorrecto en el cliente`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticarPortalCliente();
