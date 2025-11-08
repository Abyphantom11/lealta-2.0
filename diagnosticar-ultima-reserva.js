const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticarUltimaReserva() {
  console.log('═══════════════════════════════════════════════════');
  console.log('DIAGNÓSTICO: Última reserva con HostTracking');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // Buscar la última reserva con estado CHECKED_IN
    const reserva = await prisma.reservation.findFirst({
      where: {
        status: 'CHECKED_IN'
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        Cliente: true,
        HostTracking: true,
        ReservationQRCode: true
      }
    });
    
    if (!reserva) {
      console.log('❌ No se encontró ninguna reserva con estado CHECKED_IN');
      return;
    }
    
    console.log('📋 RESERVA ENCONTRADA:');
    console.log('  ID:', reserva.id);
    console.log('  Cliente:', reserva.customerName);
    console.log('  Estado:', reserva.status);
    console.log('  Guest Count:', reserva.guestCount);
    console.log('  Actualizada:', reserva.updatedAt.toISOString());
    
    console.log('\n📊 RESERVATION QR CODE:');
    if (reserva.ReservationQRCode && reserva.ReservationQRCode.length > 0) {
      const qr = reserva.ReservationQRCode[0];
      console.log('  ID:', qr.id);
      console.log('  Scan Count:', qr.scanCount);
      console.log('  Último escaneo:', qr.lastScannedAt?.toISOString() || 'Nunca');
    } else {
      console.log('  ❌ No tiene QR Code');
    }
    
    console.log('\n👥 HOST TRACKING:');
    if (reserva.HostTracking) {
      console.log('  ID:', reserva.HostTracking.id);
      console.log('  Guest Count:', reserva.HostTracking.guestCount);
      console.log('  Cliente ID:', reserva.HostTracking.clienteId);
      console.log('  Is Active:', reserva.HostTracking.isActive);
      console.log('  Actualizado:', reserva.HostTracking.updatedAt.toISOString());
    } else {
      console.log('  ❌ NO EXISTE HostTracking');
      console.log('  ⚠️ PROBLEMA: La reserva tiene estado CHECKED_IN pero no tiene HostTracking');
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('ANÁLISIS:');
    console.log('═══════════════════════════════════════════════════\n');
    
    const qrScanCount = reserva.ReservationQRCode?.[0]?.scanCount || 0;
    const hostTrackingCount = reserva.HostTracking?.guestCount || 0;
    
    if (qrScanCount === hostTrackingCount && hostTrackingCount > 0) {
      console.log('✅ TODO CORRECTO:');
      console.log(`   - Scan Count: ${qrScanCount}`);
      console.log(`   - HostTracking Count: ${hostTrackingCount}`);
      console.log('   - Ambos valores coinciden');
    } else if (qrScanCount > 0 && hostTrackingCount === 0) {
      console.log('❌ PROBLEMA DETECTADO:');
      console.log(`   - Scan Count: ${qrScanCount} (hay escaneos)`);
      console.log(`   - HostTracking Count: ${hostTrackingCount} (no se actualizó)`);
      console.log('\n🔧 POSIBLE CAUSA:');
      console.log('   - El HostTracking no se está creando/actualizando correctamente');
      console.log('   - Revisar el código en qr-scan/route.ts líneas 190-280');
    } else if (qrScanCount === 0 && hostTrackingCount === 0) {
      console.log('⚠️ RESERVA SIN ESCANEOS:');
      console.log('   - La reserva tiene estado CHECKED_IN pero no hay escaneos');
      console.log('   - Puede ser que se cambió el estado manualmente');
    } else {
      console.log('⚠️ DESINCRONIZACIÓN:');
      console.log(`   - Scan Count: ${qrScanCount}`);
      console.log(`   - HostTracking Count: ${hostTrackingCount}`);
      console.log('   - Los valores no coinciden');
    }
    
    // Buscar todos los HostTracking para esta reserva (por si hay duplicados)
    const allHostTracking = await prisma.hostTracking.findMany({
      where: { reservationId: reserva.id }
    });
    
    if (allHostTracking.length > 1) {
      console.log('\n⚠️ MÚLTIPLES HOST TRACKING ENCONTRADOS:');
      allHostTracking.forEach((ht, i) => {
        console.log(`   ${i + 1}. ID: ${ht.id}, guestCount: ${ht.guestCount}, updated: ${ht.updatedAt.toISOString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticarUltimaReserva();
