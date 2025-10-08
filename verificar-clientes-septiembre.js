const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarClientesSeptiembre() {
  const reservas = await prisma.reservation.findMany({
    where: {
      businessId: 'cmgf5px5f0000eyy0elci9yds',
      reservedAt: {
        gte: new Date(2025, 8, 1),
        lt: new Date(2025, 9, 1),
      },
    },
    include: {
      cliente: true,
    },
  });

  console.log('\n📊 RESERVAS SEPTIEMBRE - CLIENTES:');
  console.log('Total reservas:', reservas.length);
  
  const conCliente = reservas.filter(r => r.cliente);
  const sinCliente = reservas.filter(r => !r.cliente);
  
  console.log('Con cliente asociado:', conCliente.length);
  console.log('Sin cliente asociado:', sinCliente.length);

  if (conCliente.length > 0) {
    console.log('\n🔍 Muestra de reservas CON cliente:');
    conCliente.slice(0, 3).forEach(r => {
      console.log(`  ${r.reservationNumber}: ${r.cliente.nombre} (${r.guestCount} invitados, ${r.status})`);
    });
  }

  if (sinCliente.length > 0) {
    console.log('\n⚠️ Reservas SIN cliente:');
    sinCliente.slice(0, 5).forEach(r => {
      console.log(`  ${r.reservationNumber}: ${r.customerName} (clienteId: ${r.clienteId})`);
    });
  }

  // Agrupar por cliente para ver top
  const clienteStats = new Map();
  conCliente.forEach(r => {
    const key = r.cliente.id;
    if (!clienteStats.has(key)) {
      clienteStats.set(key, {
        nombre: r.cliente.nombre,
        reservas: 0,
        invitados: 0,
        completadas: 0,
      });
    }
    const stats = clienteStats.get(key);
    stats.reservas++;
    stats.invitados += r.guestCount;
    if (r.status === 'COMPLETED') {
      stats.completadas++;
    }
  });

  console.log('\n🏆 TOP 5 CLIENTES:');
  const topClientes = Array.from(clienteStats.entries())
    .sort((a, b) => b[1].invitados - a[1].invitados)
    .slice(0, 5);

  topClientes.forEach(([id, stats], i) => {
    console.log(`${i + 1}. ${stats.nombre}: ${stats.reservas} reservas, ${stats.invitados} invitados, ${stats.completadas} completadas`);
  });

  await prisma.$disconnect();
}

verificarClientesSeptiembre();
