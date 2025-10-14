const { PrismaClient } = require('@prisma/client');

async function testInvitadoRegistration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 TEST: Registro de invitado y sincronización\n');
    
    const businessDemoId = 'cmgf5px5f0000eyy0elci9yds';
    
    // 1. BUSCAR UNA RESERVA CON QR ACTIVO PARA HOY O FUTURO
    console.log('🔍 1. Buscando reserva activa para probar...');
    
    let reservaConQR = await prisma.reservation.findFirst({
      where: {
        businessId: businessDemoId,
        status: 'CONFIRMED', // Solo reservas confirmadas
        reservedAt: {
          gte: new Date('2025-10-13'), // Desde hoy
          lte: new Date('2025-12-31')  // Hasta fin de año
        }
      },
      include: {
        qrCodes: true,
        service: true,
        slot: true
      },
      orderBy: { reservedAt: 'asc' }
    });
    
    if (!reservaConQR) {
      console.log('❌ No hay reservas activas para probar. Creando una...\n');
      
      // Crear una reserva de prueba
      let service = await prisma.reservationService.findFirst({
        where: { businessId: businessDemoId }
      });
      
      if (!service) {
        console.log('❌ No hay servicios disponibles. Creando uno...');
        
        service = await prisma.reservationService.create({
          data: {
            businessId: businessDemoId,
            name: 'Servicio Test',
            description: 'Servicio de prueba para test',
            duration: 120,
            capacity: 10,
            price: 0,
            active: true
          }
        });
      }
      
      // Crear slot si no existe
      const fechaTest = new Date('2025-10-14T19:00:00Z');
      
      let slot = await prisma.reservationSlot.findFirst({
        where: { 
          businessId: businessDemoId,
          date: fechaTest
        }
      });
      
      if (!slot) {
        console.log('❌ No hay slots disponibles. Creando uno...');
        
        slot = await prisma.reservationSlot.create({
          data: {
            businessId: businessDemoId,
            serviceId: service.id,
            date: fechaTest,
            startTime: fechaTest,
            endTime: new Date(fechaTest.getTime() + 2 * 60 * 60 * 1000), // +2h
            capacity: 10,
            status: 'AVAILABLE'
          }
        });
      }
      
      const nuevaReserva = await prisma.reservation.create({
        data: {
          businessId: businessDemoId,
          serviceId: service.id,
          slotId: slot.id,
          reservationNumber: `TEST-${Date.now()}`,
          guestCount: 5,
          customerName: 'Test Cliente',
          customerPhone: '+506 8888-9999',
          customerEmail: 'test@lealta.com',
          reservedAt: new Date('2025-10-14T19:00:00Z'),
          status: 'CONFIRMED',
          source: 'test'
        }
      });
      
      // Crear QR Code
      const qrToken = `QR-TEST-${Date.now()}`;
      await prisma.reservationQRCode.create({
        data: {
          businessId: businessDemoId,
          reservationId: nuevaReserva.id,
          qrToken: qrToken,
          qrData: JSON.stringify({
            reservationId: nuevaReserva.id,
            businessId: businessDemoId,
            customerName: nuevaReserva.customerName,
          }),
          status: 'ACTIVE',
          scanCount: 0,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h
        }
      });
      
      console.log(`✅ Reserva de prueba creada: ${nuevaReserva.id}`);
      console.log(`🔗 QR Token: ${qrToken}\n`);
      
      // Volver a buscar la reserva con sus relaciones
      const reservaCompleta = await prisma.reservation.findUnique({
        where: { id: nuevaReserva.id },
        include: {
          qrCodes: true,
          service: true,
          slot: true
        }
      });
      
      reservaConQR = reservaCompleta;
    }
    
    console.log('📋 Reserva encontrada:');
    console.log(`   ID: ${reservaConQR.id}`);
    console.log(`   Cliente: ${reservaConQR.customerName}`);
    console.log(`   Personas: ${reservaConQR.guestCount}`);
    console.log(`   Fecha: ${reservaConQR.reservedAt}`);
    console.log(`   Estado: ${reservaConQR.status}`);
    console.log(`   QR Codes: ${reservaConQR.qrCodes.length}`);
    
    if (reservaConQR.qrCodes.length === 0) {
      console.log('❌ Reserva sin QR Code activo');
      return;
    }
    
    const qrCode = reservaConQR.qrCodes[0];
    console.log(`   Asistencia actual: ${qrCode.scanCount || 0}`);
    console.log(`   QR Token: ${qrCode.qrToken}\n`);
    
    // 2. SIMULAR REGISTRO DE INVITADO
    console.log('🎯 2. Simulando registro de invitado...');
    
    const qrData = JSON.stringify({
      reservaId: reservaConQR.id,
      token: qrCode.qrToken,
      timestamp: Date.now()
    });
    
    console.log(`📱 QR Data: ${qrData}`);
    
    // Simular llamada al endpoint
    const incrementResponse = {
      qrCode: qrData,
      action: 'increment',
      increment: 1,
      businessId: businessDemoId
    };
    
    console.log('📡 Simulando POST /api/reservas/qr-scan...');
    console.log('   Payload:', incrementResponse);
    
    // 3. ACTUALIZAR DIRECTAMENTE LA BASE DE DATOS (simular el endpoint)
    const asistenciaActual = qrCode.scanCount || 0;
    const nuevaAsistencia = asistenciaActual + 1;
    
    await prisma.reservationQRCode.update({
      where: { id: qrCode.id },
      data: {
        scanCount: nuevaAsistencia,
        lastScannedAt: new Date()
      }
    });
    
    // Si es el primer escaneo, cambiar estado de la reserva
    if (asistenciaActual === 0) {
      await prisma.reservation.update({
        where: { id: reservaConQR.id },
        data: { 
          status: 'CHECKED_IN',
          updatedAt: new Date()
        }
      });
      console.log('✅ Primer escaneo - Estado cambiado a CHECKED_IN');
    }
    
    console.log(`✅ Asistencia actualizada: ${asistenciaActual} → ${nuevaAsistencia}\n`);
    
    // 4. VERIFICAR QUE LA SINCRONIZACIÓN FUNCIONE
    console.log('🔄 4. Verificando sincronización con frontend...');
    
    // Simular query del frontend (GET /api/reservas)
    const reservasFromAPI = await prisma.reserva.findMany({
      where: { businessId: businessDemoId },
      include: { cliente: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`📊 Reservas en tabla legacy (reserva): ${reservasFromAPI.length}`);
    
    if (reservasFromAPI.length > 0) {
      reservasFromAPI.forEach(r => {
        console.log(`   - ${r.clientName} | ${r.date} | Asistencia: ${r.attendance || 0}/${r.guestCount}`);
      });
    }
    
    // Verificar tabla nueva (reservation)
    const reservationsFromDB = await prisma.reservation.findMany({
      where: { businessId: businessDemoId },
      include: { qrCodes: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`📊 Reservas en tabla nueva (reservation): ${reservationsFromDB.length}`);
    
    if (reservationsFromDB.length > 0) {
      reservationsFromDB.forEach(r => {
        const totalScans = r.qrCodes.reduce((sum, qr) => sum + (qr.scanCount || 0), 0);
        console.log(`   - ${r.customerName} | ${r.reservedAt} | Scans: ${totalScans}/${r.guestCount}`);
      });
    }
    
    // 5. PROBLEMA IDENTIFICADO
    console.log('\n⚠️ 5. PROBLEMA IDENTIFICADO:');
    console.log('   🎯 QR Scanner actualiza tabla: reservation.qrCodes.scanCount');
    console.log('   🖥️ Frontend lee tabla: reserva.asistenciaActual');
    console.log('   💾 CAUSA: Dos modelos de datos diferentes');
    
    console.log('\n🛠️ SOLUCIONES:');
    console.log('   1. Sincronizar datos entre tablas reservation → reserva');
    console.log('   2. Unificar frontend para usar solo tabla reservation');
    console.log('   3. Agregar invalidación de cache después de QR scan');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInvitadoRegistration();
