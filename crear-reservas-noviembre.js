const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📅 Creando reservas para noviembre 2025...\n');

  const business = await prisma.business.findFirst({
    where: { name: { contains: 'Demo' } }
  });

  if (!business) {
    console.log('❌ No se encontro negocio Demo');
    return;
  }

  console.log('✅ Negocio:', business.name);

  // Obtener clientes y promotor
  const clientes = await prisma.cliente.findMany({
    where: { businessId: business.id },
    take: 15
  });

  const promotor = await prisma.promotor.findFirst({
    where: { businessId: business.id }
  });

  if (clientes.length === 0) {
    console.log('❌ No hay clientes. Ejecuta primero seed-demo-final.js');
    return;
  }

  console.log('👥 Clientes disponibles:', clientes.length);
  console.log('🎯 Promotor:', promotor?.nombre || 'N/A', '\n');

  // =====================================================
  // 1. CREAR SERVICIOS DE RESERVA
  // =====================================================
  console.log('🍽️ Creando servicios de reserva...');

  const serviceCena = await prisma.reservationService.create({
    data: {
      businessId: business.id,
      name: 'Cena Regular',
      description: 'Mesa para cena en horario regular',
      capacity: 50,
      duration: 120,
      price: 0,
      isActive: true,
      sortOrder: 1
    }
  });

  const serviceVIP = await prisma.reservationService.create({
    data: {
      businessId: business.id,
      name: 'Mesa VIP',
      description: 'Mesa exclusiva en zona VIP con servicio premium',
      capacity: 20,
      duration: 150,
      price: 25,
      isActive: true,
      sortOrder: 2
    }
  });

  const serviceEvento = await prisma.reservationService.create({
    data: {
      businessId: business.id,
      name: 'Evento Privado',
      description: 'Reserva de area completa para eventos',
      capacity: 10,
      duration: 240,
      price: 100,
      isActive: true,
      sortOrder: 3
    }
  });

  console.log('   ✅ 3 servicios creados\n');

  // =====================================================
  // 2. CREAR SLOTS PARA NOVIEMBRE 2025
  // =====================================================
  console.log('📅 Creando slots de noviembre...');

  const hoy = new Date('2025-11-08');
  const finMes = new Date('2025-11-30');
  const slots = [];

  // Crear slots desde hoy hasta fin de mes
  for (let dia = new Date(hoy); dia <= finMes; dia.setDate(dia.getDate() + 1)) {
    const fecha = new Date(dia);
    
    // Horarios: Almuerzo (12pm-2pm) y Cena (7pm-9pm, 9pm-11pm)
    const horarios = [
      { start: 12, end: 14, capacity: 50 },  // Almuerzo
      { start: 19, end: 21, capacity: 50 },  // Cena temprano
      { start: 21, end: 23, capacity: 40 }   // Cena tarde
    ];

    for (const horario of horarios) {
      const startTime = new Date(fecha);
      startTime.setHours(horario.start, 0, 0, 0);
      
      const endTime = new Date(fecha);
      endTime.setHours(horario.end, 0, 0, 0);

      // Slot regular
      const slot = await prisma.reservationSlot.create({
        data: {
          businessId: business.id,
          serviceId: serviceCena.id,
          date: fecha,
          startTime: startTime,
          endTime: endTime,
          capacity: horario.capacity,
          reservedCount: 0,
          status: 'AVAILABLE'
        }
      });

      slots.push(slot);
    }
  }

  console.log('   ✅', slots.length, 'slots creados\n');

  // =====================================================
  // 3. CREAR RESERVAS
  // =====================================================
  console.log('📝 Creando reservas...');

  const reservas = [];
  let reservaNum = 1;

  // Seleccionar slots aleatorios y crear reservas
  const slotsParaReservar = slots.filter(() => Math.random() < 0.3); // 30% de slots

  for (const slot of slotsParaReservar) {
    if (reservaNum > clientes.length) break;

    const cliente = clientes[reservaNum - 1];
    const guestCount = Math.floor(Math.random() * 6) + 2; // 2-7 personas
    const reservationNumber = `RSV-${String(reservaNum).padStart(4, '0')}`;

    // Determinar status basado en la fecha
    let status = 'CONFIRMED';
    let checkedInAt = null;
    let completedAt = null;
    
    const fechaReserva = new Date(slot.startTime);
    const ahora = new Date('2025-11-08T18:00:00');

    if (fechaReserva < ahora) {
      // Reservas pasadas
      if (Math.random() < 0.9) {
        status = 'COMPLETED';
        checkedInAt = new Date(slot.startTime);
        completedAt = new Date(slot.endTime);
      } else {
        status = 'NO_SHOW';
      }
    } else if (fechaReserva.toDateString() === ahora.toDateString()) {
      // Reservas de hoy
      if (Math.random() < 0.5) {
        status = 'CHECKED_IN';
        checkedInAt = new Date(ahora);
      } else {
        status = 'CONFIRMED';
      }
    } else {
      // Reservas futuras
      status = Math.random() < 0.95 ? 'CONFIRMED' : 'PENDING';
    }

    const reserva = await prisma.reservation.create({
      data: {
        businessId: business.id,
        clienteId: cliente.id,
        serviceId: serviceCena.id,
        slotId: slot.id,
        reservationNumber: reservationNumber,
        status: status,
        customerName: cliente.nombre,
        customerEmail: cliente.correo,
        customerPhone: cliente.telefono,
        guestCount: guestCount,
        specialRequests: Math.random() < 0.3 ? 'Mesa junto a la ventana' : null,
        totalPrice: 0,
        paidAmount: 0,
        isPaid: false,
        reservedAt: slot.startTime,
        confirmedAt: status !== 'PENDING' ? new Date(slot.startTime.getTime() - 3600000) : null,
        checkedInAt: checkedInAt,
        completedAt: completedAt,
        reminderSent: true,
        promotorId: promotor?.id || null,
        source: 'web'
      }
    });

    // Actualizar el slot
    await prisma.reservationSlot.update({
      where: { id: slot.id },
      data: {
        reservedCount: { increment: guestCount },
        status: 'RESERVED'
      }
    });

    reservas.push(reserva);
    reservaNum++;
  }

  console.log('   ✅', reservas.count || reservas.length, 'reservas creadas\n');

  // =====================================================
  // RESUMEN
  // =====================================================
  const reservasPorStatus = await prisma.reservation.groupBy({
    by: ['status'],
    where: { businessId: business.id },
    _count: true
  });

  const totalReservas = reservasPorStatus.reduce((sum, r) => sum + r._count, 0);

  console.log('═══════════════════════════════════════');
  console.log('✅ RESERVAS DE NOVIEMBRE CREADAS');
  console.log('═══════════════════════════════════════');
  console.log('\n📊 Resumen:');
  console.log('   - Servicios: 3');
  console.log('   - Slots disponibles:', slots.length);
  console.log('   - Reservas totales:', totalReservas);
  console.log('\n📋 Por Estado:');
  
  const statusEmojis = {
    'COMPLETED': '✅',
    'CONFIRMED': '🔵',
    'CHECKED_IN': '🟢',
    'PENDING': '🟡',
    'NO_SHOW': '❌',
    'CANCELLED': '⛔'
  };

  const statusNames = {
    'COMPLETED': 'Completadas',
    'CONFIRMED': 'Confirmadas',
    'CHECKED_IN': 'En curso',
    'PENDING': 'Pendientes',
    'NO_SHOW': 'No asistió',
    'CANCELLED': 'Canceladas'
  };

  for (const r of reservasPorStatus) {
    const emoji = statusEmojis[r.status] || '⚪';
    const nombre = statusNames[r.status] || r.status;
    console.log(`   ${emoji} ${nombre}: ${r._count}`);
  }

  const totalPersonas = await prisma.reservation.aggregate({
    where: { businessId: business.id },
    _sum: { guestCount: true }
  });

  console.log('\n👥 Total de comensales:', totalPersonas._sum.guestCount || 0);
  console.log('\n🎉 ¡Modulo de reservas listo!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { 
    console.error('❌', e.message); 
    prisma.$disconnect(); 
    process.exit(1); 
  });
