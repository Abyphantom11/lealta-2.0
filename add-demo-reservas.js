const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function addReservas() {
  try {
    console.log('🍽️ Agregando reservas al negocio demo...\n');

    // 1. Obtener el servicio de reservas existente
    const service = await prisma.reservationService.findFirst({
      where: { businessId },
    });

    if (!service) {
      console.error('❌ No se encontró servicio de reservas');
      return;
    }

    console.log('✅ Servicio encontrado:', service.name);

    // 2. Obtener ubicación
    const location = await prisma.location.findFirst({
      where: { businessId },
    });

    if (!location) {
      console.error('❌ No se encontró ubicación');
      return;
    }

    // 3. Crear slots para varios días si no existen
    const existingSlots = await prisma.reservationSlot.findMany({
      where: { serviceId: service.id },
    });

    let slots = existingSlots;

    if (existingSlots.length === 0) {
      console.log('📅 Creando slots horarios para los próximos 14 días...');
      
      const slotsToCreate = [];
      const now = new Date();
      const hours = [12, 13, 14, 15, 20, 21, 22];
      
      // Crear slots para los próximos 14 días
      for (let dayOffset = -1; dayOffset <= 14; dayOffset++) {
        const slotDate = new Date(now);
        slotDate.setDate(slotDate.getDate() + dayOffset);
        slotDate.setHours(0, 0, 0, 0);
        
        for (const hour of hours) {
          const startTime = new Date(slotDate);
          startTime.setHours(hour, 0, 0, 0);
          
          const endTime = new Date(slotDate);
          endTime.setHours(hour + 1, 0, 0, 0);
          
          slotsToCreate.push({
            serviceId: service.id,
            businessId: businessId,
            date: slotDate,
            startTime: startTime,
            endTime: endTime,
            capacity: 4,
            reservedCount: 0,
            status: 'AVAILABLE',
            isRecurring: false,
          });
        }
      }

      // Crear en batches
      for (let i = 0; i < slotsToCreate.length; i += 20) {
        const batch = slotsToCreate.slice(i, i + 20);
        await prisma.reservationSlot.createMany({
          data: batch,
        });
      }

      console.log(`✅ ${slotsToCreate.length} slots creados`);
      
      // Obtener los slots creados
      slots = await prisma.reservationSlot.findMany({
        where: { serviceId: service.id },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });
    } else {
      console.log(`✅ ${existingSlots.length} slots ya existentes`);
    }

    // 5. Obtener clientes
    const clientes = await prisma.cliente.findMany({
      where: { businessId },
      take: 8,
    });

    if (clientes.length === 0) {
      console.error('❌ No se encontraron clientes');
      return;
    }

    console.log(`\n👥 Usando ${clientes.length} clientes para las reservas`);

    // 6. Crear reservas variadas usando slots reales
    const now = new Date();
    const reservasData = [];

    // Función helper para encontrar slot
    const findSlot = (daysOffset, hourPreference) => {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysOffset);
      targetDate.setHours(0, 0, 0, 0);
      
      return slots.find(s => {
        const slotDate = new Date(s.date);
        slotDate.setHours(0, 0, 0, 0);
        const slotHour = new Date(s.startTime).getHours();
        return slotDate.getTime() === targetDate.getTime() && slotHour === hourPreference;
      });
    };

    // Reservas confirmadas (ayer)
    const slot1 = findSlot(-1, 12);
    const slot2 = findSlot(-1, 13);
    
    if (slot1) {
      const yesterday = new Date(slot1.date);
      reservasData.push({
        serviceId: service.id,
        slotId: slot1.id,

        businessId,
        reservationNumber: `RES-${Date.now()}-1`,
        customerName: clientes[0].nombre,
        customerEmail: clientes[0].correo,
        customerPhone: clientes[0].telefono,

        date: yesterday,
        guestCount: 2,
        partySize: 2,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        source: 'WEB',
        reservedAt: new Date(yesterday.getTime() - 3600000),
      });
    }

    if (slot2) {
      const yesterday = new Date(slot2.date);
      reservasData.push({
        serviceId: service.id,
        slotId: slot2.id,

        businessId,
        reservationNumber: `RES-${Date.now()}-2`,
        customerName: clientes[1].nombre,
        customerEmail: clientes[1].correo,
        customerPhone: clientes[1].telefono,

        date: yesterday,
        guestCount: 4,
        partySize: 4,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        source: 'PHONE',
        reservedAt: new Date(yesterday.getTime() - 7200000),
      });
    }

    // Reservas para hoy
    const slot3 = findSlot(0, 14);
    const slot4 = findSlot(0, 20);
    
    if (slot3) {
      const today = new Date(slot3.date);
      reservasData.push({
        serviceId: service.id,
        slotId: slot3.id,

        businessId,
        reservationNumber: `RES-${Date.now()}-3`,
        customerName: clientes[2].nombre,
        customerEmail: clientes[2].correo,
        customerPhone: clientes[2].telefono,

        date: today,
        guestCount: 3,
        partySize: 3,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        source: 'WEB',
        reservedAt: new Date(today.getTime() - 86400000),
      });
    }

    if (slot4) {
      const today = new Date(slot4.date);
      reservasData.push({
        serviceId: service.id,
        slotId: slot4.id,

        businessId,
        reservationNumber: `RES-${Date.now()}-4`,
        customerName: clientes[3].nombre,
        customerEmail: clientes[3].correo,
        customerPhone: clientes[3].telefono,

        date: today,
        guestCount: 2,
        partySize: 2,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        source: 'WALK_IN',
        reservedAt: new Date(today.getTime() - 3600000),
      });
    }

    // Reservas futuras (mañana)
    const slot5 = findSlot(1, 14);
    const slot6 = findSlot(1, 21);
    const slot7 = findSlot(1, 22);
    
    if (slot5) {
      const tomorrow = new Date(slot5.date);
      reservasData.push({
        serviceId: service.id,
        slotId: slot5.id,

        businessId,
        reservationNumber: `RES-${Date.now()}-5`,
        customerName: clientes[4].nombre,
        customerEmail: clientes[4].correo,
        customerPhone: clientes[4].telefono,

        date: tomorrow,
        guestCount: 6,
        partySize: 6,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        source: 'WEB',
        reservedAt: new Date(),
      });
    }

    if (slot6) {
      const tomorrow = new Date(slot6.date);
      reservasData.push({
        serviceId: service.id,
        slotId: slot6.id,

        businessId,
        reservationNumber: `RES-${Date.now()}-6`,
        customerName: clientes[5].nombre,
        customerEmail: clientes[5].correo,
        customerPhone: clientes[5].telefono,

        date: tomorrow,
        guestCount: 4,
        partySize: 4,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        source: 'PHONE',
        reservedAt: new Date(),
      });
    }

    // Reserva cancelada
    if (slot7) {
      const tomorrow = new Date(slot7.date);
      reservasData.push({
        serviceId: service.id,
        slotId: slot7.id,

        businessId,
        reservationNumber: `RES-${Date.now()}-7`,
        customerName: clientes[6].nombre,
        customerEmail: clientes[6].correo,
        customerPhone: clientes[6].telefono,

        date: tomorrow,
        guestCount: 2,
        partySize: 2,
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        source: 'WEB',
        reservedAt: new Date(now.getTime() - 86400000),
        cancelledAt: new Date(),
      });
    }

    // Reserva pendiente de confirmación (próxima semana)
    const slot8 = findSlot(7, 20);
    
    if (slot8) {
      const nextWeek = new Date(slot8.date);
      reservasData.push({
        serviceId: service.id,
        slotId: slot8.id,

        businessId,
        reservationNumber: `RES-${Date.now()}-8`,
        customerName: clientes[7].nombre,
        customerEmail: clientes[7].correo,
        customerPhone: clientes[7].telefono,

        date: nextWeek,
        guestCount: 8,
        partySize: 8,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        source: 'PHONE',
        specialRequests: 'Mesa cerca de la ventana',
        reservedAt: new Date(),
      });
    }

    console.log('\n📝 Creando reservas...');
    
    for (const reservaData of reservasData) {
      await prisma.reservation.create({
        data: reservaData,
      });
    }

    console.log(`✅ ${reservasData.length} reservas creadas exitosamente`);

    // Mostrar resumen
    const reservas = await prisma.reservation.findMany({
      where: { businessId },
      include: {
        slot: true,
      },
      orderBy: { date: 'asc' },
    });

    console.log('\n📊 RESUMEN DE RESERVAS:');
    console.log('─'.repeat(70));
    
    const statusCount = {};
    reservas.forEach(r => {
      statusCount[r.status] = (statusCount[r.status] || 0) + 1;
    });

    console.log('\n📈 Por Estado:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n📅 Próximas Reservas:');
    reservas.filter(r => r.date >= yesterday).slice(0, 5).forEach(r => {
      console.log(`  ${r.reservationNumber} - ${r.customerName}`);
      console.log(`    📅 ${r.date.toLocaleDateString('es-ES')} ${r.slot.startTime}`);
      console.log(`    👥 ${r.partySize} personas - Estado: ${r.status}`);
      console.log('');
    });

    console.log('─'.repeat(70));
    console.log('\n✅ ¡Reservas demo creadas exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addReservas();
