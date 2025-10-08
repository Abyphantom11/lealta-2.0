const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function addMoreReservasHoy() {
  try {
    console.log('🍽️ Agregando más reservas para hoy (06/10)...\n');

    // 1. Obtener servicio
    const service = await prisma.reservationService.findFirst({
      where: { businessId },
    });

    // 2. Obtener slots de HOY
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const slotsHoy = await prisma.reservationSlot.findMany({
      where: {
        businessId,
        date: today,
      },
      orderBy: { startTime: 'asc' },
    });

    console.log(`✅ ${slotsHoy.length} slots encontrados para hoy`);

    // 3. Obtener clientes
    const clientes = await prisma.cliente.findMany({
      where: { businessId },
      orderBy: { puntos: 'desc' },
    });

    console.log(`✅ ${clientes.length} clientes disponibles\n`);

    const reservasData = [
      // 13:00 - Confirmada y pagada
      {
        hora: 13,
        clienteIndex: 1,
        guestCount: 4,
        status: 'CONFIRMED',
        isPaid: true,
        paidAmount: 80,
        totalPrice: 80,
        source: 'PHONE',
      },
      // 14:00 - Completada
      {
        hora: 14,
        clienteIndex: 2,
        guestCount: 2,
        status: 'COMPLETED',
        isPaid: true,
        paidAmount: 50,
        totalPrice: 50,
        source: 'WEB',
        completedAt: new Date(now.getTime() - 1800000), // Hace 30 min
      },
      // 15:00 - Pendiente
      {
        hora: 15,
        clienteIndex: 3,
        guestCount: 5,
        status: 'PENDING',
        isPaid: false,
        paidAmount: 0,
        totalPrice: 100,
        source: 'WEB',
        specialRequests: 'Menú vegetariano para 2 personas',
      },
      // 20:00 - Confirmada (ya existe pero agregamos otra mesa)
      // Usaremos otro slot de 20:00 o 21:00
      {
        hora: 21,
        clienteIndex: 4,
        guestCount: 3,
        status: 'CONFIRMED',
        isPaid: true,
        paidAmount: 60,
        totalPrice: 60,
        source: 'WALK_IN',
      },
      // 22:00 - Confirmada
      {
        hora: 22,
        clienteIndex: 5,
        guestCount: 2,
        status: 'CONFIRMED',
        isPaid: false,
        paidAmount: 0,
        totalPrice: 40,
        source: 'WEB',
        specialRequests: 'Celebración de cumpleaños',
      },
      // 12:00 - Completada
      {
        hora: 12,
        clienteIndex: 6,
        guestCount: 6,
        status: 'COMPLETED',
        isPaid: true,
        paidAmount: 120,
        totalPrice: 120,
        source: 'PHONE',
        completedAt: new Date(now.getTime() - 3600000), // Hace 1 hora
      },
    ];

    let created = 0;

    for (const data of reservasData) {
      // Buscar slot disponible para esa hora
      const slot = slotsHoy.find(s => {
        const slotHour = new Date(s.startTime).getHours();
        return slotHour === data.hora;
      });

      if (slot && clientes[data.clienteIndex]) {
        const cliente = clientes[data.clienteIndex];
        
        const reservaData = {
          businessId,
          serviceId: service.id,
          slotId: slot.id,
          reservationNumber: `DEMO-HOY-${Date.now()}-${created}`,
          customerName: cliente.nombre,
          customerEmail: cliente.correo,
          customerPhone: cliente.telefono,
          guestCount: data.guestCount,
          status: data.status,
          isPaid: data.isPaid,
          paidAmount: data.paidAmount,
          totalPrice: data.totalPrice,
          reservedAt: new Date(now.getTime() - Math.random() * 86400000), // Random en las últimas 24h
          source: data.source,
          promotorId: null,
        };

        // Agregar campos opcionales
        if (data.specialRequests) {
          reservaData.specialRequests = data.specialRequests;
        }
        if (data.status === 'CONFIRMED') {
          reservaData.confirmedAt = new Date(now.getTime() - Math.random() * 3600000);
        }
        if (data.completedAt) {
          reservaData.completedAt = data.completedAt;
        }

        await prisma.reservation.create({ data: reservaData });
        
        console.log(`✅ Reserva creada: ${data.hora}:00 - ${cliente.nombre} (${data.guestCount} personas) - ${data.status}`);
        created++;
      }
    }

    console.log(`\n🎉 ${created} reservas adicionales creadas para hoy!`);

    // Mostrar resumen del día
    const reservasHoy = await prisma.reservation.findMany({
      where: {
        businessId,
        slot: {
          date: today,
        },
      },
      include: {
        slot: true,
      },
      orderBy: {
        slot: {
          startTime: 'asc',
        },
      },
    });

    console.log('\n📊 RESUMEN DE HOY (06/10):');
    console.log('─'.repeat(70));
    console.log(`Total reservas: ${reservasHoy.length}`);
    console.log(`PENDING: ${reservasHoy.filter(r => r.status === 'PENDING').length}`);
    console.log(`CONFIRMED: ${reservasHoy.filter(r => r.status === 'CONFIRMED').length}`);
    console.log(`COMPLETED: ${reservasHoy.filter(r => r.status === 'COMPLETED').length}`);
    console.log(`CANCELLED: ${reservasHoy.filter(r => r.status === 'CANCELLED').length}`);
    
    const totalPersonas = reservasHoy.reduce((sum, r) => sum + r.guestCount, 0);
    const totalIngreso = reservasHoy.reduce((sum, r) => sum + parseFloat(r.paidAmount || 0), 0);
    
    console.log(`\nTotal personas: ${totalPersonas}`);
    console.log(`Total ingreso: €${totalIngreso.toFixed(2)}`);
    console.log('─'.repeat(70));

    console.log('\n⏰ RESERVAS POR HORA:');
    reservasHoy.forEach(r => {
      const hora = new Date(r.slot.startTime).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const statusIcon = {
        'PENDING': '⏳',
        'CONFIRMED': '✅',
        'COMPLETED': '✔️',
        'CANCELLED': '❌',
      }[r.status];
      
      console.log(`  ${hora} - ${r.customerName} (${r.guestCount}p) ${statusIcon} ${r.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreReservasHoy();
