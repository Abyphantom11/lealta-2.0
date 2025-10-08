const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPI() {
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  const sortBy = 'invitados';

  console.log('\n📊 Simulando API call:');
  console.log(`   businessId: ${businessId}`);
  console.log(`   sortBy: ${sortBy}\n`);

  // Obtener todas las reservas con clientes
  const reservas = await prisma.reservation.findMany({
    where: { businessId },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          cedula: true,
        },
      },
    },
  });

  console.log(`📈 Total reservas encontradas: ${reservas.length}`);
  console.log(`   Con cliente: ${reservas.filter(r => r.cliente).length}`);
  console.log(`   Sin cliente: ${reservas.filter(r => !r.cliente).length}\n`);

  // Agrupar por cliente y calcular métricas
  const clientesMap = new Map();

  reservas.forEach(reserva => {
    // Si la reserva tiene cliente asociado
    if (reserva.cliente) {
      const clienteId = reserva.cliente.id;
      
      if (!clientesMap.has(clienteId)) {
        clientesMap.set(clienteId, {
          id: reserva.cliente.id,
          nombre: reserva.cliente.nombre,
          cedula: reserva.cliente.cedula,
          totalReservas: 0,
          totalInvitados: 0,
          asistencias: 0,
          ultimaReserva: reserva.reservedAt,
        });
      }

      const cliente = clientesMap.get(clienteId);
      cliente.totalReservas++;
      cliente.totalInvitados += reserva.guestCount;
      
      // Contar asistencias (reservas completadas o confirmadas)
      if (reserva.status === 'COMPLETED' || reserva.status === 'CONFIRMED') {
        cliente.asistencias++;
      }

      // Actualizar última reserva
      if (reserva.reservedAt > cliente.ultimaReserva) {
        cliente.ultimaReserva = reserva.reservedAt;
      }
    }
  });

  // Convertir a array y ordenar
  let clientes = Array.from(clientesMap.values());

  console.log(`👥 Total clientes únicos: ${clientes.length}\n`);

  // Ordenar según el criterio
  clientes.sort((a, b) => b.totalInvitados - a.totalInvitados);

  // Tomar top 10
  clientes = clientes.slice(0, 10);

  console.log('🏆 TOP 10 CLIENTES POR INVITADOS:');
  clientes.forEach((c, i) => {
    console.log(`${i + 1}. ${c.nombre}`);
    console.log(`   Reservas: ${c.totalReservas} | Invitados: ${c.totalInvitados} | Asistencias: ${c.asistencias}`);
  });

  console.log('\n✅ API Response simulado:');
  console.log(JSON.stringify({
    success: true,
    clientes: clientes.slice(0, 3).map(c => ({
      ...c,
      ultimaReserva: c.ultimaReserva.toISOString(),
    })),
    sortBy,
  }, null, 2));

  await prisma.$disconnect();
}

testAPI();
