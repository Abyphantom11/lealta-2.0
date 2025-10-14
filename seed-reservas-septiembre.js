const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedReservasSeptiembre() {
  try {
    console.log('🌱 Iniciando seed de reservas para Septiembre 2025...\n');

    // 1. Obtener o crear business de prueba
    let business = await prisma.business.findFirst({
      where: { slug: 'golom' }
    });

    if (!business) {
      console.log('❌ Business "golom" no encontrado');
      throw new Error('Business golom no existe');
    }
    
    console.log(`✅ Business encontrado: ${business.name} (${business.id})\n`);

    // 2. Crear o verificar servicio de reservas
    let service = await prisma.reservationService.findFirst({
      where: { businessId: business.id }
    });

    if (!service) {
      console.log('🍽️  Creando servicio de reservas...');
      service = await prisma.reservationService.create({
        data: {
          businessId: business.id,
          name: 'Cena',
          description: 'Servicio de cena',
          duration: 120,
          capacity: 50,
          isActive: true,
        }
      });
      console.log(`✅ Servicio creado: ${service.name}\n`);
    } else {
      console.log(`✅ Servicio encontrado: ${service.name}\n`);
    }

    // 3. Crear promotores
    console.log('👥 Creando promotores...');
    const promotoresData = [
      { nombre: 'Juan Roberto' },
      { nombre: 'María García' },
      { nombre: 'Carlos Méndez' },
      { nombre: 'Ana López' },
      { nombre: 'Pedro Sánchez' },
    ];

    const promotores = [];
    for (const data of promotoresData) {
      let promotor = await prisma.promotor.findFirst({
        where: {
          businessId: business.id,
          nombre: data.nombre
        }
      });

      if (!promotor) {
        promotor = await prisma.promotor.create({
          data: {
            businessId: business.id,
            nombre: data.nombre,
            activo: true,
          }
        });
      }
      promotores.push(promotor);
      console.log(`  ✓ ${promotor.nombre}`);
    }
    console.log('');

    // 4. Crear reservas para septiembre 2025
    console.log('📅 Creando reservas para Septiembre 2025...\n');
    
    const reservasData = [
      // Semana 1 - Inicio de septiembre
      { fecha: '2025-09-01', hora: '19:00', personas: 4, promotor: promotores[0], estado: 'COMPLETED', scanCount: 4, medio: 'whatsapp' },
      { fecha: '2025-09-01', hora: '20:00', personas: 2, promotor: promotores[1], estado: 'COMPLETED', scanCount: 2, medio: 'instagram' },
      { fecha: '2025-09-02', hora: '19:30', personas: 6, promotor: promotores[0], estado: 'COMPLETED', scanCount: 6, medio: 'whatsapp' },
      { fecha: '2025-09-02', hora: '21:00', personas: 4, promotor: promotores[2], estado: 'CANCELLED', scanCount: 0, medio: 'facebook' }, // CANCELADA
      { fecha: '2025-09-03', hora: '19:00', personas: 5, promotor: promotores[3], estado: 'COMPLETED', scanCount: 5, medio: 'referral' },
      
      // Semana 2 - Mix de estados
      { fecha: '2025-09-08', hora: '19:00', personas: 4, promotor: promotores[0], estado: 'COMPLETED', scanCount: 0, medio: 'whatsapp' }, // CAÍDA
      { fecha: '2025-09-08', hora: '20:30', personas: 3, promotor: promotores[1], estado: 'COMPLETED', scanCount: 3, medio: 'instagram' },
      { fecha: '2025-09-09', hora: '19:00', personas: 8, promotor: promotores[0], estado: 'COMPLETED', scanCount: 10, medio: 'whatsapp' }, // SOBREAFORO
      { fecha: '2025-09-09', hora: '21:00', personas: 6, promotor: promotores[4], estado: 'CANCELLED', scanCount: 0, medio: 'manual' }, // CANCELADA
      { fecha: '2025-09-10', hora: '19:30', personas: 4, promotor: promotores[2], estado: 'COMPLETED', scanCount: 0, medio: 'facebook' }, // CAÍDA
      
      // Semana 3 - Más variedad
      { fecha: '2025-09-15', hora: '19:00', personas: 5, promotor: promotores[0], estado: 'COMPLETED', scanCount: 5, medio: 'whatsapp' },
      { fecha: '2025-09-15', hora: '20:00', personas: 4, promotor: promotores[1], estado: 'COMPLETED', scanCount: 4, medio: 'instagram' },
      { fecha: '2025-09-16', hora: '19:00', personas: 3, promotor: promotores[3], estado: 'COMPLETED', scanCount: 2, medio: 'referral' }, // PARCIAL
      { fecha: '2025-09-16', hora: '21:00', personas: 6, promotor: promotores[0], estado: 'CANCELLED', scanCount: 0, medio: 'whatsapp' }, // CANCELADA
      { fecha: '2025-09-17', hora: '19:30', personas: 4, promotor: promotores[2], estado: 'COMPLETED', scanCount: 4, medio: 'facebook' },
      
      // Semana 4 - Final del mes
      { fecha: '2025-09-22', hora: '19:00', personas: 2, promotor: promotores[1], estado: 'COMPLETED', scanCount: 0, medio: 'instagram' }, // CAÍDA
      { fecha: '2025-09-22', hora: '20:30', personas: 5, promotor: promotores[0], estado: 'COMPLETED', scanCount: 5, medio: 'whatsapp' },
      { fecha: '2025-09-23', hora: '19:00', personas: 4, promotor: promotores[3], estado: 'COMPLETED', scanCount: 3, medio: 'referral' }, // PARCIAL
      { fecha: '2025-09-23', hora: '21:00', personas: 3, promotor: promotores[4], estado: 'COMPLETED', scanCount: 3, medio: 'manual' },
      { fecha: '2025-09-24', hora: '19:30', personas: 6, promotor: promotores[0], estado: 'COMPLETED', scanCount: 6, medio: 'whatsapp' },
      
      // Semana 5 - Últimos días
      { fecha: '2025-09-28', hora: '19:00', personas: 4, promotor: promotores[1], estado: 'CANCELLED', scanCount: 0, medio: 'instagram' }, // CANCELADA
      { fecha: '2025-09-28', hora: '20:00', personas: 5, promotor: promotores[0], estado: 'COMPLETED', scanCount: 5, medio: 'whatsapp' },
      { fecha: '2025-09-29', hora: '19:00', personas: 8, promotor: promotores[2], estado: 'COMPLETED', scanCount: 7, medio: 'facebook' }, // PARCIAL
      { fecha: '2025-09-29', hora: '21:00', personas: 3, promotor: promotores[0], estado: 'COMPLETED', scanCount: 0, medio: 'whatsapp' }, // CAÍDA
      { fecha: '2025-09-30', hora: '19:30', personas: 6, promotor: promotores[3], estado: 'COMPLETED', scanCount: 6, medio: 'referral' },
    ];

    let contadores = {
      completadas: 0,
      sobreaforo: 0,
      parciales: 0,
      caidas: 0,
      canceladas: 0
    };

    let reservationCounter = 1;

    for (const reserva of reservasData) {
      const [year, month, day] = reserva.fecha.split('-').map(Number);
      const [hour, minute] = reserva.hora.split(':').map(Number);
      const fechaReserva = new Date(year, month - 1, day, hour, minute);

      // Crear o encontrar slot
      let slot = await prisma.reservationSlot.findFirst({
        where: {
          businessId: business.id,
          serviceId: service.id,
          date: new Date(year, month - 1, day),
          startTime: fechaReserva,
        }
      });

      if (!slot) {
        slot = await prisma.reservationSlot.create({
          data: {
            businessId: business.id,
            serviceId: service.id,
            date: new Date(year, month - 1, day),
            startTime: fechaReserva,
            endTime: new Date(fechaReserva.getTime() + 2 * 60 * 60 * 1000), // +2 horas
            capacity: service.capacity,
            reservedCount: 0,
            status: 'AVAILABLE',
          }
        });
      }

      // Crear reserva
      const nuevaReserva = await prisma.reservation.create({
        data: {
          businessId: business.id,
          serviceId: service.id,
          slotId: slot.id,
          promotorId: reserva.promotor.id,
          reservationNumber: `RES-SEP-${String(reservationCounter).padStart(3, '0')}-${Date.now()}`,
          guestCount: reserva.personas,
          customerName: `Cliente ${reserva.fecha} ${reserva.hora}`,
          customerPhone: `+584141234567`,
          customerEmail: `cliente${Date.now()}@test.com`,
          reservedAt: fechaReserva,
          status: reserva.estado,
          source: reserva.medio,
          notes: `Reserva de prueba - ${reserva.medio}`,
        }
      });

      reservationCounter++;

      // Crear QR Code
      const qrToken = `QR-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await prisma.reservationQRCode.create({
        data: {
          businessId: business.id,
          reservationId: nuevaReserva.id,
          qrToken: qrToken,
          qrData: JSON.stringify({
            reservationId: nuevaReserva.id,
            businessId: business.id,
            customerName: nuevaReserva.customerName,
            date: reserva.fecha,
            time: reserva.hora,
          }),
          status: reserva.estado === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE',
          scanCount: reserva.scanCount,
          expiresAt: new Date(fechaReserva.getTime() + 24 * 60 * 60 * 1000),
        }
      });

      // Clasificar para estadísticas
      if (reserva.estado === 'CANCELLED') {
        contadores.canceladas++;
        console.log(`  ❌ ${reserva.fecha} - CANCELADA - ${reserva.promotor.nombre} - ${reserva.personas} personas`);
      } else if (reserva.scanCount === 0) {
        contadores.caidas++;
        console.log(`  ⚠️  ${reserva.fecha} - CAÍDA - ${reserva.promotor.nombre} - ${reserva.personas} personas esperadas`);
      } else if (reserva.scanCount > reserva.personas) {
        contadores.sobreaforo++;
        console.log(`  🔥 ${reserva.fecha} - SOBREAFORO - ${reserva.promotor.nombre} - ${reserva.scanCount}/${reserva.personas} personas`);
      } else if (reserva.scanCount < reserva.personas) {
        contadores.parciales++;
        console.log(`  📊 ${reserva.fecha} - PARCIAL - ${reserva.promotor.nombre} - ${reserva.scanCount}/${reserva.personas} personas`);
      } else {
        contadores.completadas++;
        console.log(`  ✅ ${reserva.fecha} - COMPLETADA - ${reserva.promotor.nombre} - ${reserva.scanCount}/${reserva.personas} personas`);
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE RESERVAS CREADAS PARA SEPTIEMBRE 2025');
    console.log('='.repeat(60));
    console.log(`Total de reservas: ${reservasData.length}`);
    console.log(`✅ Completadas (100%): ${contadores.completadas}`);
    console.log(`🔥 Sobreaforo (>100%): ${contadores.sobreaforo}`);
    console.log(`📊 Parciales (<100%): ${contadores.parciales}`);
    console.log(`⚠️  Caídas (0% sin avisar): ${contadores.caidas}`);
    console.log(`❌ Canceladas (con aviso): ${contadores.canceladas}`);
    console.log('='.repeat(60));
    console.log('\n✨ ¡Seed completado exitosamente!');
    console.log(`\n🔗 Business ID: ${business.id}`);
    console.log('📅 Mes: Septiembre 2025');
    console.log('\n💡 Ahora puedes generar el reporte en la aplicación:');
    console.log('   /reservas/reportes?businessId=' + business.id);

  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedReservasSeptiembre();
