const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function repararHostTracking() {
  console.log('═══════════════════════════════════════════════════');
  console.log('REPARAR: Crear HostTracking para reserva existente');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // ID de la reserva problemática
    const reservaId = 'dacb11f3f28b4e86b26aca81893bd78a';
    
    const reserva = await prisma.reservation.findUnique({
      where: { id: reservaId },
      include: {
        ReservationQRCode: true,
        Cliente: true
      }
    });
    
    if (!reserva) {
      console.log('❌ Reserva no encontrada');
      return;
    }
    
    console.log('📋 RESERVA:');
    console.log('  ID:', reserva.id);
    console.log('  Cliente:', reserva.customerName);
    console.log('  ClienteId:', reserva.clienteId);
    console.log('  BusinessId:', reserva.businessId);
    console.log('  Scan Count:', reserva.ReservationQRCode[0]?.scanCount || 0);
    
    // Verificar si ya tiene HostTracking
    const existingHT = await prisma.hostTracking.findFirst({
      where: { reservationId: reservaId }
    });
    
    if (existingHT) {
      console.log('\n⚠️ Ya existe HostTracking:');
      console.log('  ID:', existingHT.id);
      console.log('  Guest Count:', existingHT.guestCount);
      console.log('\n🔧 Actualizando con scan count correcto...');
      
      const scanCount = reserva.ReservationQRCode[0]?.scanCount || 0;
      await prisma.hostTracking.update({
        where: { id: existingHT.id },
        data: { guestCount: scanCount }
      });
      
      console.log(`✅ HostTracking actualizado: guestCount = ${scanCount}`);
    } else {
      console.log('\n🔧 Creando nuevo HostTracking...');
      
      const scanCount = reserva.ReservationQRCode[0]?.scanCount || 0;
      
      const newHT = await prisma.hostTracking.create({
        data: {
          id: crypto.randomBytes(16).toString('hex'),
          businessId: reserva.businessId,
          reservationId: reservaId,
          clienteId: reserva.clienteId,
          reservationName: reserva.customerName || 'Cliente',
          tableNumber: null,
          reservationDate: reserva.reservedAt,
          guestCount: scanCount,
          isActive: true
        }
      });
      
      console.log(`✅ HostTracking creado: ID=${newHT.id}, guestCount=${scanCount}`);
    }
    
    // Verificar el resultado
    console.log('\n═══════════════════════════════════════════════════');
    console.log('VERIFICACIÓN FINAL:');
    console.log('═══════════════════════════════════════════════════\n');
    
    const reservaFinal = await prisma.reservation.findUnique({
      where: { id: reservaId },
      include: {
        HostTracking: true,
        ReservationQRCode: true
      }
    });
    
    console.log('✅ Scan Count:', reservaFinal.ReservationQRCode[0]?.scanCount);
    console.log('✅ HostTracking Guest Count:', reservaFinal.HostTracking?.guestCount);
    
    if (reservaFinal.HostTracking && 
        reservaFinal.HostTracking.guestCount === reservaFinal.ReservationQRCode[0]?.scanCount) {
      console.log('\n🎉 ¡TODO CORRECTO! Los valores coinciden');
    } else {
      console.log('\n⚠️ Los valores aún no coinciden');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.message) {
      console.error('   Message:', error.message);
    }
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

repararHostTracking();
