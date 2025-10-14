const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizarProblemasReservasSimple() {
  try {
    console.log('🔍 ANÁLISIS DE PROBLEMAS EN REGISTRO DE RESERVAS');
    console.log('='.repeat(60));
    
    const businessDemoId = 'cmgf5px5f0000eyy0elci9yds';
    
    // 1. BUSCAR RESERVAS CREADAS RECIENTEMENTE (últimas 24 horas)
    console.log('📅 1. BUSCANDO RESERVAS RECIENTES (últimas 24 horas)...');
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const reservasRecientes = await prisma.reservation.findMany({
      where: {
        businessId: businessDemoId,
        createdAt: {
          gte: hace24h
        }
      },
      include: {
        slot: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Reservas creadas en últimas 24h: ${reservasRecientes.length}`);
    
    if (reservasRecientes.length > 0) {
      console.log('\n📋 DETALLES DE RESERVAS RECIENTES:');
      reservasRecientes.forEach((r, idx) => {
        const fechaCreacion = new Date(r.createdAt).toLocaleString('es-ES');
        const fechaSlot = r.slot?.date ? new Date(r.slot.date).toISOString().split('T')[0] : 'Sin fecha slot';
        const horaSlot = r.slot?.startTime ? new Date(r.slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Sin hora';
        
        console.log(`\n   ${idx + 1}. 🎫 RESERVA ID: ${r.id}`);
        console.log(`      👤 Cliente: ${r.customerName || 'Sin nombre'}`);
        console.log(`      📧 Email: ${r.customerEmail || 'Sin email'}`);
        console.log(`      📞 Teléfono: ${r.customerPhone || 'Sin teléfono'}`);
        console.log(`      👥 Personas: ${r.guestCount || 0}`);
        console.log(`      📍 Estado: ${r.status}`);
        console.log(`      📅 Para fecha: ${fechaSlot}`);
        console.log(`      ⏰ Para hora: ${horaSlot}`);
        console.log(`      🕐 Creada: ${fechaCreacion}`);
        console.log(`      📝 Notas: ${r.specialRequests || 'Sin notas'}`);
        console.log(`      🎯 Número reserva: ${r.reservationNumber || 'Sin número'}`);
      });
    }
    
    // 2. BUSCAR RESERVAS PARA HOY ESPECÍFICAMENTE
    console.log('\n🎯 2. BUSCANDO RESERVAS PARA HOY (13/10/2025)...');
    const hoy = new Date('2025-10-13');
    const mañana = new Date('2025-10-14');
    
    const reservasParaHoy = await prisma.reservation.findMany({
      where: {
        businessId: businessDemoId,
        slot: {
          date: {
            gte: hoy,
            lt: mañana
          }
        }
      },
      include: {
        slot: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Reservas programadas para HOY: ${reservasParaHoy.length}`);
    
    if (reservasParaHoy.length > 0) {
      console.log('\n📋 RESERVAS PARA HOY:');
      reservasParaHoy.forEach((r, idx) => {
        const fechaCreacion = new Date(r.createdAt).toLocaleString('es-ES');
        const horaSlot = r.slot?.startTime ? new Date(r.slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Sin hora';
        
        console.log(`\n   ${idx + 1}. 🎫 ${r.customerName} - ${horaSlot}`);
        console.log(`      📍 Estado: ${r.status}`);
        console.log(`      🕐 Creada: ${fechaCreacion}`);
      });
    }
    
    // 3. BUSCAR ÚLTIMAS 10 RESERVAS EN GENERAL (para ver patrones)
    console.log('\n📊 3. ÚLTIMAS 10 RESERVAS EN EL SISTEMA...');
    
    const ultimasReservas = await prisma.reservation.findMany({
      where: { businessId: businessDemoId },
      include: {
        slot: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📈 Últimas 10 reservas:`);
    ultimasReservas.forEach((r, idx) => {
      const fechaCreacion = new Date(r.createdAt).toLocaleString('es-ES');
      const fechaSlot = r.slot?.date ? new Date(r.slot.date).toISOString().split('T')[0] : '❌ Sin slot';
      
      console.log(`   ${idx + 1}. ${r.customerName || '❌ Sin nombre'} - Para: ${fechaSlot} - Creada: ${fechaCreacion}`);
    });
    
    // 4. VERIFICAR QUE PASA CUANDO INTENTAMOS CREAR UNA RESERVA PARA HOY
    console.log('\n🧪 4. ANÁLISIS DE FLUJO DE CREACIÓN...');
    
    // Verificar si hay servicios disponibles
    const servicios = await prisma.reservationService.findMany({
      where: { businessId: businessDemoId },
      take: 3
    });
    
    console.log(`🛎️ Servicios disponibles: ${servicios.length}`);
    if (servicios.length > 0) {
      servicios.forEach((s, idx) => {
        console.log(`   ${idx + 1}. ${s.name} (ID: ${s.id})`);
      });
    }
    
    // Verificar si hay clientes
    const clientesCount = await prisma.cliente.count({
      where: { businessId: businessDemoId }
    });
    
    console.log(`👥 Clientes en el sistema: ${clientesCount}`);
    
    // 5. SIMULAR EL PROBLEMA: Qué sucede en el cálculo de stats
    console.log('\n📊 5. SIMULANDO CÁLCULO DE ESTADÍSTICAS...');
    
    // Este es el mismo cálculo que hace la API
    const todasReservas = await prisma.reservation.findMany({
      where: { businessId: businessDemoId },
      include: { slot: true }
    });
    
    const reservasHoyCalculadas = todasReservas.filter(r => {
      if (!r.slot?.date) return false;
      const fechaSlot = new Date(r.slot.date).toISOString().split('T')[0];
      return fechaSlot === '2025-10-13';
    });
    
    console.log(`📈 Total reservas: ${todasReservas.length}`);
    console.log(`🎯 Reservas hoy (filtradas): ${reservasHoyCalculadas.length}`);
    
    // 6. VERIFICAR LOGS DE LA API (simulado)
    console.log('\n🔍 6. DIAGNÓSTICO DE PROBLEMAS COMUNES...');
    
    // Buscar reservas con datos incompletos
    const reservasIncompletas = ultimasReservas.filter(r => 
      !r.customerName || 
      !r.slot || 
      !r.customerEmail ||
      r.customerEmail.includes('temp-')
    );
    
    console.log(`⚠️ Reservas con datos incompletos: ${reservasIncompletas.length}`);
    
    if (reservasIncompletas.length > 0) {
      console.log('\n📋 RESERVAS PROBLEMÁTICAS:');
      reservasIncompletas.forEach((r, idx) => {
        console.log(`   ${idx + 1}. ID: ${r.id}`);
        console.log(`      ❌ Cliente: ${r.customerName || 'FALTANTE'}`);
        console.log(`      ❌ Email: ${r.customerEmail || 'FALTANTE'}`);
        console.log(`      ❌ Slot: ${r.slot ? 'OK' : 'FALTANTE'}`);
        console.log(`      📅 Creada: ${new Date(r.createdAt).toLocaleString('es-ES')}`);
      });
    }
    
    // 7. VERIFICAR SI HAY INTENTOS FALLIDOS RECIENTES
    console.log('\n🚨 7. BUSCANDO INDICIOS DE ERRORES...');
    
    // Buscar reservas con emails temporales (indica creación fallida)
    const reservasFallidas = await prisma.reservation.findMany({
      where: {
        businessId: businessDemoId,
        customerEmail: {
          contains: 'temp-'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`🔍 Reservas con emails temporales: ${reservasFallidas.length}`);
    
    if (reservasFallidas.length > 0) {
      console.log('\n📋 POSIBLES ERRORES DE CREACIÓN:');
      reservasFallidas.forEach((r, idx) => {
        const fechaCreacion = new Date(r.createdAt).toLocaleString('es-ES');
        console.log(`   ${idx + 1}. ${r.customerName} - ${r.customerEmail} - ${fechaCreacion}`);
      });
    }
    
    // 8. CONCLUSIONES Y SIGUIENTES PASOS
    console.log('\n💡 8. CONCLUSIONES Y RECOMENDACIONES:');
    
    if (reservasRecientes.length === 0 && reservasParaHoy.length === 0) {
      console.log('🎯 PROBLEMA IDENTIFICADO:');
      console.log('   ❌ No hay reservas nuevas en las últimas 24h');
      console.log('   ❌ No hay reservas programadas para hoy');
      console.log('   ✅ Pero el frontend muestra "1 reserva para hoy"');
      console.log('');
      console.log('🔧 POSIBLES CAUSAS:');
      console.log('   1. 📱 Frontend usa datos en caché');
      console.log('   2. 🔄 La reserva se creó pero luego se eliminó/cambió');
      console.log('   3. 🐛 Bug en la sincronización frontend-backend');
      console.log('   4. 📊 Error en el cálculo de estadísticas');
      console.log('');
      console.log('🛠️ SOLUCIONES RECOMENDADAS:');
      console.log('   1. Limpiar caché del navegador (localStorage + sessionStorage)');
      console.log('   2. Hacer hard refresh (Ctrl+Shift+R)');
      console.log('   3. Verificar Network tab para ver respuesta real de la API');
      console.log('   4. Verificar que useReservasOptimized no use datos mock');
    }
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analizarProblemasReservasSimple();
