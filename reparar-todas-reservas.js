const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function repararTodasLasReservas() {
  console.log('═══════════════════════════════════════════════════');
  console.log('REPARAR: Todas las reservas CHECKED_IN sin HostTracking');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // Buscar todas las reservas CHECKED_IN
    const reservas = await prisma.reservation.findMany({
      where: {
        status: 'CHECKED_IN'
      },
      include: {
        ReservationQRCode: true,
        HostTracking: true,
        Cliente: true
      }
    });
    
    console.log(`📊 Encontradas ${reservas.length} reservas con estado CHECKED_IN\n`);
    
    let reparadas = 0;
    let conHostTracking = 0;
    let actualizadas = 0;
    
    for (const reserva of reservas) {
      const scanCount = reserva.ReservationQRCode?.[0]?.scanCount || 0;
      
      if (!reserva.HostTracking) {
        console.log(`🔧 Reserva sin HostTracking: ${reserva.customerName} (scan: ${scanCount})`);
        
        if (!reserva.clienteId) {
          console.log(`   ⚠️ Sin clienteId, saltando...`);
          continue;
        }
        
        try {
          await prisma.hostTracking.create({
            data: {
              id: crypto.randomBytes(16).toString('hex'),
              businessId: reserva.businessId,
              reservationId: reserva.id,
              clienteId: reserva.clienteId,
              reservationName: reserva.customerName || 'Cliente',
              tableNumber: null,
              reservationDate: reserva.reservedAt,
              guestCount: scanCount,
              isActive: true
            }
          });
          console.log(`   ✅ HostTracking creado con guestCount=${scanCount}\n`);
          reparadas++;
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}\n`);
        }
      } else {
        conHostTracking++;
        
        // Verificar si el guestCount coincide con scanCount
        if (reserva.HostTracking.guestCount !== scanCount) {
          console.log(`🔄 Actualizando: ${reserva.customerName} (HT: ${reserva.HostTracking.guestCount} → Scan: ${scanCount})`);
          
          try {
            await prisma.hostTracking.update({
              where: { id: reserva.HostTracking.id },
              data: { guestCount: scanCount }
            });
            console.log(`   ✅ Actualizado\n`);
            actualizadas++;
          } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
          }
        }
      }
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('RESUMEN:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Total reservas CHECKED_IN: ${reservas.length}`);
    console.log(`Ya tenían HostTracking: ${conHostTracking}`);
    console.log(`HostTracking creados: ${reparadas}`);
    console.log(`HostTracking actualizados: ${actualizadas}`);
    console.log(`✅ Proceso completado`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

repararTodasLasReservas();
