const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function addReservasSimple() {
  try {
    console.log('🍽️ Agregando reservas simples al negocio demo...\n');

    // 1. Obtener servicio y slots
    const service = await prisma.reservationService.findFirst({
      where: { businessId },
    });

    if (!service) {
      console.error('❌ No se encontró servicio de reservas');
      return;
    }

    // 2. Obtener slots existentes
    const slots = await prisma.reservationSlot.findMany({
      where: { businessId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    if (slots.length === 0) {
      console.error('❌ No se encontraron slots. Primero corre add-demo-reservas.js');
      return;
    }

    console.log(`✅ ${slots.length} slots encontrados`);

    // 3. Obtener clientes
    const clientes = await prisma.cliente.findMany({
      where: { businessId },
      take: 8,
    });

    console.log(`✅ ${clientes.length} clientes encontrados\n`);

    // 4. Crear reservas simples
    const now = new Date();
    let created = 0;

    // Reserva 1: Ayer - Completada
    const slot1 = slots.find(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return d.getTime() === yesterday.getTime() && new Date(s.startTime).getHours() === 12;
    });

    if (slot1) {
      await prisma.reservation.create({
        data: {
          businessId,
          serviceId: service.id,
          slotId: slot1.id,
          reservationNumber: `DEMO-${Date.now()}-1`,
          customerName: clientes[0]?.nombre || 'Cliente Demo 1',
          customerEmail: clientes[0]?.correo || 'demo1@email.com',
          customerPhone: clientes[0]?.telefono || '+34600111222',
          guestCount: 2,
          status: 'COMPLETED',
          isPaid: true,
          paidAmount: 50,
          totalPrice: 50,
          reservedAt: new Date(slot1.date.getTime() - 86400000),
          completedAt: new Date(slot1.date.getTime() + 3600000),
          source: 'WEB', promotorId: null,
        },
      });
      created++;
      console.log('✅ Reserva 1 creada: COMPLETED (ayer 12:00)');
    }

    // Reserva 2: Hoy - Confirmada
    const slot2 = slots.find(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime() && new Date(s.startTime).getHours() === 20;
    });

    if (slot2) {
      await prisma.reservation.create({
        data: {
          businessId,
          serviceId: service.id,
          slotId: slot2.id,
          reservationNumber: `DEMO-${Date.now()}-2`,
          customerName: clientes[1]?.nombre || 'Cliente Demo 2',
          customerEmail: clientes[1]?.correo || 'demo2@email.com',
          customerPhone: clientes[1]?.telefono || '+34600222333',
          guestCount: 4,
          status: 'CONFIRMED',
          isPaid: true,
          paidAmount: 80,
          totalPrice: 80,
          reservedAt: new Date(now.getTime() - 3600000),
          confirmedAt: new Date(),
          source: 'PHONE', promotorId: null,
        },
      });
      created++;
      console.log('✅ Reserva 2 creada: CONFIRMED (hoy 20:00)');
    }

    // Reserva 3: Mañana - Pendiente
    const slot3 = slots.find(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return d.getTime() === tomorrow.getTime() && new Date(s.startTime).getHours() === 13;
    });

    if (slot3) {
      await prisma.reservation.create({
        data: {
          businessId,
          serviceId: service.id,
          slotId: slot3.id,
          reservationNumber: `DEMO-${Date.now()}-3`,
          customerName: clientes[2]?.nombre || 'Cliente Demo 3',
          customerEmail: clientes[2]?.correo || 'demo3@email.com',
          customerPhone: clientes[2]?.telefono || '+34600333444',
          guestCount: 6,
          status: 'PENDING',
          isPaid: false,
          paidAmount: 0,
          totalPrice: 120,
          reservedAt: new Date(),
          source: 'WEB', promotorId: null,
          specialRequests: 'Mesa cerca de la ventana',
        },
      });
      created++;
      console.log('✅ Reserva 3 creada: PENDING (mañana 13:00)');
    }

    // Reserva 4: Mañana - Confirmada
    const slot4 = slots.find(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return d.getTime() === tomorrow.getTime() && new Date(s.startTime).getHours() === 21;
    });

    if (slot4) {
      await prisma.reservation.create({
        data: {
          businessId,
          serviceId: service.id,
          slotId: slot4.id,
          reservationNumber: `DEMO-${Date.now()}-4`,
          customerName: clientes[3]?.nombre || 'Cliente Demo 4',
          customerEmail: clientes[3]?.correo || 'demo4@email.com',
          customerPhone: clientes[3]?.telefono || '+34600444555',
          guestCount: 3,
          status: 'CONFIRMED',
          isPaid: true,
          paidAmount: 60,
          totalPrice: 60,
          reservedAt: new Date(now.getTime() - 7200000),
          confirmedAt: new Date(),
          source: 'WALK_IN', promotorId: null,
        },
      });
      created++;
      console.log('✅ Reserva 4 creada: CONFIRMED (mañana 21:00)');
    }

    // Reserva 5: Próxima semana - Pendiente
    const slot5 = slots.find(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(0, 0, 0, 0);
      return d.getTime() === nextWeek.getTime() && new Date(s.startTime).getHours() === 14;
    });

    if (slot5) {
      await prisma.reservation.create({
        data: {
          businessId,
          serviceId: service.id,
          slotId: slot5.id,
          reservationNumber: `DEMO-${Date.now()}-5`,
          customerName: clientes[4]?.nombre || 'Cliente Demo 5',
          customerEmail: clientes[4]?.correo || 'demo5@email.com',
          customerPhone: clientes[4]?.telefono || '+34600555666',
          guestCount: 8,
          status: 'PENDING',
          isPaid: false,
          paidAmount: 0,
          totalPrice: 160,
          reservedAt: new Date(),
          source: 'PHONE', promotorId: null,
        },
      });
      created++;
      console.log('✅ Reserva 5 creada: PENDING (próxima semana 14:00)');
    }

    // Reserva 6: Cancelada
    const slot6 = slots.find(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return d.getTime() === tomorrow.getTime() && new Date(s.startTime).getHours() === 15;
    });

    if (slot6) {
      await prisma.reservation.create({
        data: {
          businessId,
          serviceId: service.id,
          slotId: slot6.id,
          reservationNumber: `DEMO-${Date.now()}-6`,
          customerName: clientes[5]?.nombre || 'Cliente Demo 6',
          customerEmail: clientes[5]?.correo || 'demo6@email.com',
          customerPhone: clientes[5]?.telefono || '+34600666777',
          guestCount: 2,
          status: 'CANCELLED',
          isPaid: false,
          paidAmount: 0,
          totalPrice: 40,
          reservedAt: new Date(now.getTime() - 172800000),
          cancelledAt: new Date(),
          source: 'WEB', promotorId: null,
        },
      });
      created++;
      console.log('✅ Reserva 6 creada: CANCELLED (mañana 15:00)');
    }

    console.log(`\n✅ ${created} reservas demo creadas exitosamente!`);

    // Mostrar resumen
    const reservas = await prisma.reservation.findMany({
      where: { businessId },
      include: { slot: true },
      orderBy: { reservedAt: 'desc' },
    });

    console.log('\n📊 RESUMEN:');
    console.log(`Total reservas: ${reservas.length}`);
    console.log(`PENDING: ${reservas.filter(r => r.status === 'PENDING').length}`);
    console.log(`CONFIRMED: ${reservas.filter(r => r.status === 'CONFIRMED').length}`);
    console.log(`COMPLETED: ${reservas.filter(r => r.status === 'COMPLETED').length}`);
    console.log(`CANCELLED: ${reservas.filter(r => r.status === 'CANCELLED').length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addReservasSimple();
