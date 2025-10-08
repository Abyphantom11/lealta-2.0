const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function addReservasSeptiembre() {
  try {
    console.log('📅 Agregando reservas para SEPTIEMBRE 2025...\n');

    // 1. Obtener servicio
    const service = await prisma.reservationService.findFirst({
      where: { businessId },
    });

    if (!service) {
      console.error('❌ No se encontró servicio de reservas');
      return;
    }

    console.log('✅ Servicio encontrado:', service.name);

    // 2. Crear slots para todo septiembre (1-30 de septiembre 2025)
    console.log('📅 Creando slots para septiembre...');
    
    const slotsCreados = [];
    const hours = [12, 13, 14, 15, 20, 21, 22];
    
    // Septiembre 2025: del 1 al 30
    for (let dia = 1; dia <= 30; dia++) {
      const fecha = new Date(2025, 8, dia); // Mes 8 = septiembre (0-indexed)
      fecha.setHours(0, 0, 0, 0);
      
      for (const hour of hours) {
        const startTime = new Date(fecha);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(fecha);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        slotsCreados.push({
          serviceId: service.id,
          businessId: businessId,
          date: fecha,
          startTime: startTime,
          endTime: endTime,
          capacity: 4,
          reservedCount: 0,
          status: 'AVAILABLE',
          isRecurring: false,
        });
      }
    }

    // Crear slots en batches
    console.log(`Creando ${slotsCreados.length} slots...`);
    for (let i = 0; i < slotsCreados.length; i += 20) {
      const batch = slotsCreados.slice(i, i + 20);
      await prisma.reservationSlot.createMany({ data: batch });
    }

    console.log(`✅ ${slotsCreados.length} slots creados para septiembre`);

    // 3. Obtener todos los slots de septiembre
    const slotsSeptiembre = await prisma.reservationSlot.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(2025, 8, 1),
          lte: new Date(2025, 8, 30),
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    console.log(`\n📊 ${slotsSeptiembre.length} slots disponibles para septiembre`);

    // 4. Obtener clientes
    const clientes = await prisma.cliente.findMany({
      where: { businessId },
      orderBy: { puntos: 'desc' },
    });

    console.log(`✅ ${clientes.length} clientes disponibles\n`);

    // 5. Crear reservas distribuidas en septiembre
    const reservasCrear = [];
    let reservaCounter = 0;

    // Estrategia: Crear 3-5 reservas por día de forma variada
    for (let dia = 1; dia <= 30; dia++) {
      const fecha = new Date(2025, 8, dia);
      fecha.setHours(0, 0, 0, 0);

      // Slots de este día
      const slotsDia = slotsSeptiembre.filter(s => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === fecha.getTime();
      });

      // Crear 3-5 reservas por día
      const numReservas = Math.floor(Math.random() * 3) + 3; // 3-5 reservas

      for (let i = 0; i < numReservas && i < slotsDia.length; i++) {
        const slot = slotsDia[Math.floor(Math.random() * slotsDia.length)];
        const cliente = clientes[reservaCounter % clientes.length];
        
        // Estados variados (mayoría completadas ya que es mes pasado)
        const estados = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
        const status = estados[Math.floor(Math.random() * estados.length)];
        
        const guestCount = Math.floor(Math.random() * 6) + 2; // 2-8 personas
        const totalPrice = guestCount * 20;
        const isPaid = status === 'COMPLETED';
        
        const reservedAt = new Date(fecha);
        reservedAt.setDate(reservedAt.getDate() - Math.floor(Math.random() * 5) - 1); // 1-5 días antes

        const reservaData = {
          businessId,
          serviceId: service.id,
          slotId: slot.id,
          reservationNumber: `SEP-${dia}-${reservaCounter}`,
          customerName: cliente.nombre,
          customerEmail: cliente.correo,
          customerPhone: cliente.telefono,
          clienteId: cliente.id,
          guestCount: guestCount,
          status: status,
          isPaid: isPaid,
          paidAmount: isPaid ? totalPrice : 0,
          totalPrice: totalPrice,
          reservedAt: reservedAt,
          source: ['WEB', 'PHONE', 'WALK_IN'][Math.floor(Math.random() * 3)],
          promotorId: null,
        };

        // Agregar campos según estado
        if (status === 'COMPLETED') {
          const slotTime = new Date(slot.startTime);
          reservaData.confirmedAt = new Date(reservedAt.getTime() + 3600000);
          reservaData.checkedInAt = new Date(slotTime.getTime() - 600000); // 10 min antes
          reservaData.completedAt = new Date(slotTime.getTime() + 7200000); // 2h después
        } else if (status === 'CANCELLED') {
          reservaData.cancelledAt = new Date(fecha.getTime() - 86400000); // Día anterior
        }

        // Agregar peticiones especiales aleatorias
        const peticiones = [
          null,
          null,
          null,
          'Mesa cerca de la ventana',
          'Celebración de cumpleaños',
          'Menú vegetariano',
          'Silla para bebé',
          'Mesa tranquila',
        ];
        const peticion = peticiones[Math.floor(Math.random() * peticiones.length)];
        if (peticion) {
          reservaData.specialRequests = peticion;
        }

        reservasCrear.push(reservaData);
        reservaCounter++;
      }
    }

    console.log(`📝 Creando ${reservasCrear.length} reservas para septiembre...`);

    // Crear reservas
    let creadas = 0;
    for (const reservaData of reservasCrear) {
      try {
        await prisma.reservation.create({ data: reservaData });
        creadas++;
        
        if (creadas % 10 === 0) {
          console.log(`  ✓ ${creadas}/${reservasCrear.length} reservas creadas...`);
        }
      } catch (error) {
        // Ignorar duplicados de slots
        if (!error.message.includes('Unique constraint')) {
          console.error('Error creando reserva:', error.message);
        }
      }
    }

    console.log(`\n✅ ${creadas} reservas creadas exitosamente para SEPTIEMBRE!\n`);

    // 6. Generar estadísticas del mes
    const reservasSeptiembre = await prisma.reservation.findMany({
      where: {
        businessId,
        reservedAt: {
          gte: new Date(2025, 8, 1),
          lte: new Date(2025, 8, 30, 23, 59, 59),
        },
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            cedula: true,
          },
        },
      },
    });

    console.log('📊 ESTADÍSTICAS DE SEPTIEMBRE 2025:');
    console.log('═'.repeat(70));
    
    const totalReservas = reservasSeptiembre.length;
    const completadas = reservasSeptiembre.filter(r => r.status === 'COMPLETED').length;
    const canceladas = reservasSeptiembre.filter(r => r.status === 'CANCELLED').length;
    const noShow = reservasSeptiembre.filter(r => r.status === 'NO_SHOW').length;
    
    const totalInvitados = reservasSeptiembre.reduce((sum, r) => sum + r.guestCount, 0);
    const totalIngresos = reservasSeptiembre.reduce((sum, r) => sum + parseFloat(r.paidAmount || 0), 0);
    
    console.log(`\n📈 Reservas Totales: ${totalReservas}`);
    console.log(`   ✅ Completadas: ${completadas} (${((completadas/totalReservas)*100).toFixed(1)}%)`);
    console.log(`   ❌ Canceladas: ${canceladas} (${((canceladas/totalReservas)*100).toFixed(1)}%)`);
    console.log(`   👻 No Show: ${noShow} (${((noShow/totalReservas)*100).toFixed(1)}%)`);
    
    console.log(`\n👥 Total Invitados: ${totalInvitados}`);
    console.log(`💰 Ingresos Totales: €${totalIngresos.toFixed(2)}`);
    console.log(`📊 Promedio por Reserva: €${(totalIngresos/completadas).toFixed(2)}`);
    console.log(`📊 Promedio Invitados: ${(totalInvitados/totalReservas).toFixed(1)}`);

    // Top clientes de septiembre
    const clientesStats = new Map();
    
    reservasSeptiembre.forEach(r => {
      if (r.cliente) {
        if (!clientesStats.has(r.clienteId)) {
          clientesStats.set(r.clienteId, {
            nombre: r.cliente.nombre,
            reservas: 0,
            invitados: 0,
            gasto: 0,
          });
        }
        const stats = clientesStats.get(r.clienteId);
        stats.reservas++;
        stats.invitados += r.guestCount;
        stats.gasto += parseFloat(r.paidAmount || 0);
      }
    });

    const topClientes = Array.from(clientesStats.values())
      .sort((a, b) => b.gasto - a.gasto)
      .slice(0, 5);

    console.log('\n🏆 TOP 5 CLIENTES DE SEPTIEMBRE:');
    topClientes.forEach((c, i) => {
      console.log(`${i + 1}. ${c.nombre}`);
      console.log(`   💰 €${c.gasto.toFixed(2)} | 📅 ${c.reservas} reservas | 👥 ${c.invitados} invitados`);
    });

    console.log('\n═'.repeat(70));
    console.log('✨ Datos de septiembre listos para análisis de retención!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addReservasSeptiembre();
