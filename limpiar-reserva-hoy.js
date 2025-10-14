const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarReservaHoyDemo() {
  try {
    console.log('🧹 LIMPIEZA DE RESERVAS HOY - DIAGNÓSTICO COMPLETO');
    console.log('='.repeat(60));
    
    // Business Demo con las 133 reservas
    const businessDemoId = 'cmgf5px5f0000eyy0elci9yds';
    
    console.log('🎯 Business Demo ID:', businessDemoId);
    
    // 1. Verificar si existe una reserva creada EXACTAMENTE HOY
    const hoy = new Date('2025-10-13');
    const mañana = new Date('2025-10-14');
    
    console.log('📅 Buscando reservas creadas HOY (13/10/2025)...');
    
    // Buscar por fecha de CREACIÓN hoy (puede ser para cualquier fecha)
    const reservasGreadasHoy = await prisma.reservation.findMany({
      where: {
        businessId: businessDemoId,
        createdAt: {
          gte: hoy,
          lt: mañana
        }
      },
      include: {
        slot: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🔍 Reservas CREADAS hoy: ${reservasGreadasHoy.length}`);
    
    if (reservasGreadasHoy.length > 0) {
      console.log('\n📋 DETALLES:');
      reservasGreadasHoy.forEach((r, idx) => {
        const fechaSlot = r.slot?.date ? new Date(r.slot.date).toISOString().split('T')[0] : 'Sin fecha';
        const horaCreacion = new Date(r.createdAt).toLocaleString('es-ES');
        
        console.log(`   ${idx + 1}. Cliente: ${r.customerName}`);
        console.log(`      Para fecha: ${fechaSlot}`);
        console.log(`      Creada: ${horaCreacion}`);
        console.log(`      Estado: ${r.status}`);
        console.log(`      ID: ${r.id}`);
        console.log('      ---');
      });
    }
    
    // 2. Buscar reservas PARA hoy (independiente de cuándo se crearon)
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
    
    console.log(`\n🎯 Reservas PARA hoy: ${reservasParaHoy.length}`);
    
    if (reservasParaHoy.length > 0) {
      console.log('\n📋 DETALLES:');
      reservasParaHoy.forEach((r, idx) => {
        const fechaSlot = r.slot?.date ? new Date(r.slot.date).toISOString().split('T')[0] : 'Sin fecha';
        const horaCreacion = new Date(r.createdAt).toLocaleString('es-ES');
        
        console.log(`   ${idx + 1}. Cliente: ${r.customerName}`);
        console.log(`      Para fecha: ${fechaSlot}`);
        console.log(`      Creada: ${horaCreacion}`);
        console.log(`      Estado: ${r.status}`);
        console.log(`      ID: ${r.id}`);
        console.log('      ---');
      });
    }
    
    // 3. Verificar estadísticas que podría estar calculando la API
    console.log('\n📊 SIMULANDO CÁLCULO DE ESTADÍSTICAS:');
    
    // Simular el cálculo que hace calculateStats() en la API
    const todasLasReservas = await prisma.reservation.findMany({
      where: { businessId: businessDemoId },
      include: { slot: true },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📈 Total reservas en sistema: ${todasLasReservas.length}`);
    
    // Filtrar por fecha de slot = hoy
    const reservasHoyCalculadas = todasLasReservas.filter(r => {
      if (!r.slot?.date) return false;
      const fechaSlot = new Date(r.slot.date).toISOString().split('T')[0];
      return fechaSlot === '2025-10-13';
    });
    
    console.log(`📊 Reservas HOY (calculadas): ${reservasHoyCalculadas.length}`);
    
    // 4. Crear una reserva de prueba para HOY si quieres probar
    console.log('\n🧪 ¿Quieres crear una reserva de prueba para HOY?');
    console.log('   (Ejecuta el siguiente script si necesitas probar)');
    console.log(`
// Script para crear reserva de prueba:
const testReservation = await prisma.reservation.create({
  data: {
    businessId: '${businessDemoId}',
    customerName: 'Cliente Prueba Hoy',
    customerEmail: 'prueba@test.com',
    customerPhone: '+584121234567',
    guestCount: 2,
    status: 'PENDING',
    reservationNumber: 'TEST-HOY-' + Date.now(),
    serviceId: 'service-id', // Necesitas crear el service primero
    slotId: 'slot-id',       // Necesitas crear el slot primero
    clienteId: 'cliente-id'  // Necesitas crear el cliente primero
  }
});
    `);
    
    // 5. Verificar caché o datos en localStorage (en teoría no aplica para server)
    console.log('\n🔧 SUGERENCIAS PARA LIMPIAR CACHÉ FRONTEND:');
    console.log('   1. Abrir DevTools (F12)');
    console.log('   2. Application tab > Storage > Clear site data');
    console.log('   3. Refresh hard (Ctrl+Shift+R)');
    console.log('   4. Verificar Network tab para ver qué API está devolviendo');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

limpiarReservaHoyDemo();
