const { PrismaClient } = require('@prisma/client');

async function debugFrontendCache() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 DEBUG FRONTEND CACHE - Buscando datos mock/fallback...\n');
    
    const businessDemoId = 'cmgf5px5f0000eyy0elci9yds'; // Demo business
    
    // 1. VERIFICAR QUE LA API DEVUELVE DATOS CORRECTOS
    console.log('📡 1. SIMULANDO LLAMADA A API /api/reservas...');
    
    const todasReservas = await prisma.reservation.findMany({
      where: { businessId: businessDemoId },
      include: { 
        slot: true,
        cliente: true,
        service: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const hoy = '2025-10-13';
    const reservasHoy = todasReservas.filter(r => {
      if (!r.slot?.date) return false;
      const fechaSlot = new Date(r.slot.date).toISOString().split('T')[0];
      return fechaSlot === hoy;
    });
    
    console.log(`✅ Total reservas en BD: ${todasReservas.length}`);
    console.log(`🎯 Reservas para hoy: ${reservasHoy.length}`);
    
    if (todasReservas.length > 0) {
      console.log('\n📋 Últimas 3 reservas:');
      todasReservas.slice(0, 3).forEach((r, idx) => {
        console.log(`   ${idx + 1}. ${r.cliente?.name} | ${r.slot?.date ? new Date(r.slot.date).toISOString().split('T')[0] : 'Sin fecha'} | ${r.status}`);
      });
    }
    
    // 2. BUSCAR DATOS MOCK EN EL CÓDIGO
    console.log('\n🧪 2. BUSCANDO DATOS MOCK EN HOOKS...');
    console.log('   - useReservations.tsx podría tener fallback a mockReservas');
    console.log('   - useReservasOptimized.tsx maneja datos reales');
    console.log('   - useReservationsFigma.ts tiene datos mock de desarrollo');
    
    // 3. VERIFICAR STATS CALCULATION
    console.log('\n📊 3. SIMULANDO CÁLCULO DE STATS...');
    
    const stats = {
      totalReservas: todasReservas.length,
      reservasHoy: reservasHoy.length,
      reservasEnProgreso: todasReservas.filter(r => r.status === 'CONFIRMED').length,
      reservasCompletadas: todasReservas.filter(r => r.status === 'COMPLETED').length
    };
    
    console.log('   API debería devolver:', JSON.stringify(stats, null, 2));
    
    // 4. DIAGNÓSTICO REACT QUERY
    console.log('\n🔄 4. DIAGNÓSTICO REACT QUERY CACHE:');
    console.log('   📌 staleTime: 5 minutos (datos frescos)');
    console.log('   📌 gcTime: 10 minutos (datos en cache)');
    console.log('   📌 refetchOnWindowFocus: false');
    console.log('   📌 refetchOnMount: true');
    
    // 5. PROBLEMA IDENTIFICADO
    console.log('\n⚠️ 5. PROBLEMA IDENTIFICADO:');
    
    if (reservasHoy.length === 0) {
      console.log('   🎯 BASE DE DATOS: 0 reservas para hoy');
      console.log('   🖥️ FRONTEND: Muestra "1 reserva para hoy"');
      console.log('   💾 CAUSA: Cache de React Query con datos obsoletos');
      
      console.log('\n🛠️ SOLUCIONES:');
      console.log('   1. Limpiar localStorage/sessionStorage del navegador');
      console.log('   2. Hard refresh (Ctrl+Shift+R)');
      console.log('   3. Abrir DevTools Network tab y verificar respuesta de API');
      console.log('   4. Verificar que useReservasOptimized esté siendo usado');
      
      console.log('\n🔧 COMANDOS PARA LIMPIAR CACHE:');
      console.log('   - localStorage.clear();');
      console.log('   - sessionStorage.clear();');
      console.log('   - Ir a Application tab > Storage > Clear storage');
    } else {
      console.log('   ✅ Datos consistentes entre BD y frontend expected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFrontendCache();
