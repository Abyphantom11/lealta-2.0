const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizarProblemasReservas() {
  try {
    console.log('🔍 ANÁLISIS COMPLETO DE PROBLEMAS EN REGISTRO DE RESERVAS');
    console.log('='.repeat(70));
    
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
        cliente: true,
        service: true,
        slot: true,
        qrCodes: true
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
        console.log(`      🔗 Cliente ID: ${r.clienteId || 'Sin cliente vinculado'}`);
        console.log(`      🛎️ Service ID: ${r.serviceId || 'Sin servicio'}`);
        console.log(`      ⏱️ Slot ID: ${r.slotId || 'Sin slot'}`);
        console.log(`      📱 QR Codes: ${r.qrCodes?.length || 0}`);
        
        if (r.qrCodes && r.qrCodes.length > 0) {
          r.qrCodes.forEach((qr, qrIdx) => {
            console.log(`         QR ${qrIdx + 1}: ${qr.qrToken} (${qr.status})`);
          });
        }
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
        cliente: true,
        service: true,
        slot: true,
        qrCodes: true
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
        console.log(`      📱 QR: ${r.qrCodes?.length || 0} códigos`);
      });
    }
    
    // 3. VERIFICAR CONSISTENCIA DE DATOS
    console.log('\n🔧 3. VERIFICANDO CONSISTENCIA DE DATOS...');
    
    // Buscar reservas sin slots
    const reservasSinSlots = await prisma.reservation.findMany({
      where: {
        businessId: businessDemoId,
        slot: null
      },
      take: 5
    });
    
    console.log(`⚠️ Reservas sin slots: ${reservasSinSlots.length}`);
    
    // Buscar reservas sin clientes
    const reservasSinClientes = await prisma.reservation.findMany({
      where: {
        businessId: businessDemoId,
        cliente: null
      },
      take: 5
    });
    
    console.log(`⚠️ Reservas sin clientes: ${reservasSinClientes.length}`);
    
    // Buscar slots huérfanos (sin reservas)
    const slotsHuerfanos = await prisma.reservationSlot.findMany({
      where: {
        businessId: businessDemoId,
        reservation: null
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`⚠️ Slots sin reservas: ${slotsHuerfanos.length}`);
    
    // 4. ANÁLISIS DE ERRORES COMUNES
    console.log('\n🚨 4. ANÁLISIS DE ERRORES COMUNES...');
    
    // Verificar reservas con estados inconsistentes
    const reservasProblematicas = await prisma.reservation.findMany({
      where: {
        businessId: businessDemoId,
        OR: [
          { customerName: null },
          { customerName: '' },
          { slot: null },
          { cliente: null }
        ]
      },
      include: {
        slot: true,
        cliente: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🔍 Reservas con problemas de datos: ${reservasProblematicas.length}`);
    
    if (reservasProblematicas.length > 0) {
      console.log('\n📋 RESERVAS PROBLEMÁTICAS:');
      reservasProblematicas.forEach((r, idx) => {
        console.log(`   ${idx + 1}. ID: ${r.id}`);
        console.log(`      ❌ Problemas detectados:`);
        if (!r.customerName || r.customerName === '') console.log(`         - Sin nombre de cliente`);
        if (!r.slot) console.log(`         - Sin slot de tiempo`);
        if (!r.cliente) console.log(`         - Sin cliente vinculado`);
        console.log(`      📅 Creada: ${new Date(r.createdAt).toLocaleString('es-ES')}`);
      });
    }
    
    // 5. VERIFICAR SERVICIOS Y SLOTS PARA HOJY
    console.log('\n🛎️ 5. VERIFICANDO SERVICIOS Y SLOTS...');
    
    const serviciosHoy = await prisma.reservationService.findMany({
      where: { businessId: businessDemoId },
      include: {
        _count: {
          select: {
            reservations: true,
            slots: true
          }
        }
      },
      take: 5
    });
    
    console.log(`📊 Servicios activos: ${serviciosHoy.length}`);
    serviciosHoy.forEach((s, idx) => {
      console.log(`   ${idx + 1}. ${s.name}: ${s._count.reservations} reservas, ${s._count.slots} slots`);
    });
    
    const slotsHoy = await prisma.reservationSlot.findMany({
      where: {
        businessId: businessDemoId,
        date: {
          gte: hoy,
          lt: mañana
        }
      },
      include: {
        reservation: true
      }
    });
    
    console.log(`⏰ Slots para hoy: ${slotsHoy.length}`);
    
    // 6. SIMULAR CÁLCULO DE ESTADÍSTICAS
    console.log('\n📊 6. SIMULANDO CÁLCULO DE ESTADÍSTICAS...');
    
    const todasReservas = await prisma.reservation.findMany({
      where: { businessId: businessDemoId },
      include: { slot: true },
      orderBy: { createdAt: 'asc' }
    });
    
    // Filtrar reservas por fecha de slot = hoy
    const reservasHoyStats = todasReservas.filter(r => {
      if (!r.slot?.date) return false;
      const fechaSlot = new Date(r.slot.date).toISOString().split('T')[0];
      return fechaSlot === '2025-10-13';
    });
    
    console.log(`📈 Total reservas en sistema: ${todasReservas.length}`);
    console.log(`🎯 Reservas para hoy (cálculo estadísticas): ${reservasHoyStats.length}`);
    
    // Verificar si hay discrepancia entre métodos de cálculo
    if (reservasParaHoy.length !== reservasHoyStats.length) {
      console.log(`⚠️ DISCREPANCIA DETECTADA:`);
      console.log(`   Query directa: ${reservasParaHoy.length}`);
      console.log(`   Cálculo stats: ${reservasHoyStats.length}`);
    }
    
    // 7. RECOMENDACIONES
    console.log('\n💡 7. RECOMENDACIONES PARA SOLUCIONAR:');
    console.log('   🔧 Backend:');
    console.log('     - Verificar que la API /api/reservas retorne datos correctos');
    console.log('     - Revisar el cálculo de stats en calculateStats()');
    console.log('     - Asegurar que las transacciones sean atómicas');
    
    console.log('   🖥️ Frontend:');
    console.log('     - Limpiar caché de React Query');
    console.log('     - Verificar que no haya datos mock mezclados');
    console.log('     - Revisar el hook useReservasOptimized');
    
    console.log('   🧪 Testing:');
    console.log('     - Crear reserva de prueba para validar el flujo completo');
    console.log('     - Verificar la API en tiempo real con Network tab');
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analizarProblemasReservas();
