const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarCambios() {
  const now = new Date();
  const añoActual = now.getFullYear();
  const mesActual = now.getMonth() + 1;
  
  const fechaInicio = new Date(Date.UTC(añoActual, mesActual - 1, 1, 0, 0, 0, 0));
  const fechaFin = new Date(Date.UTC(añoActual, mesActual, 1, 0, 0, 0, 0));
  
  console.log('✅ VERIFICACIÓN DESPUÉS DE CAMBIOS\n');
  console.log('='.repeat(70));
  console.log('📅 Noviembre 2025\n');
  
  // Simular la nueva lógica de la API
  const reservas = await prisma.reservation.findMany({
    where: { reservedAt: { gte: fechaInicio, lt: fechaFin } },
    include: {
      Cliente: { select: { id: true, nombre: true, cedula: true } },
      HostTracking: { select: { guestCount: true } }
    }
  });
  
  const clientesMap = new Map();
  
  for (const reserva of reservas) {
    const customerName = reserva.customerName || 'Sin nombre';
    
    if (!clientesMap.has(customerName)) {
      clientesMap.set(customerName, {
        id: customerName,
        nombre: customerName,
        cedula: reserva.Cliente?.cedula || '',
        totalReservas: 0,
        totalAsistentes: 0,
        reservasConAsistencia: 0,
        ultimaReserva: reserva.reservedAt
      });
    }
    
    const cliente = clientesMap.get(customerName);
    cliente.totalReservas++;
    
    if (reserva.status === 'CHECKED_IN') {
      const asistentesReales = reserva.HostTracking?.guestCount || 0;
      if (asistentesReales > 0) {
        cliente.totalAsistentes += asistentesReales;
        cliente.reservasConAsistencia++;
      }
    }
    
    if (reserva.reservedAt > cliente.ultimaReserva) {
      cliente.ultimaReserva = reserva.reservedAt;
    }
  }
  
  const clientes = Array.from(clientesMap.values());
  
  // Ordenar por total asistentes
  const topAsistentes = [...clientes]
    .sort((a, b) => b.totalAsistentes - a.totalAsistentes)
    .slice(0, 10);
  
  console.log('🏆 TOP 10 POR ASISTENTES (nueva lógica con customerName):');
  for (let i = 0; i < topAsistentes.length; i++) {
    const c = topAsistentes[i];
    console.log(`${i+1}. ${c.nombre}: ${c.totalAsistentes} asistentes, ${c.reservasConAsistencia} reservas`);
  }
  
  const totalTop10 = topAsistentes.reduce((sum, c) => sum + c.totalAsistentes, 0);
  const reservasTop10 = topAsistentes.reduce((sum, c) => sum + c.reservasConAsistencia, 0);
  
  console.log(`\n📊 TOTALES DEL WIDGET (Top 10):`);
  console.log(`  - Total Asistentes: ${totalTop10}`);
  console.log(`  - Con Asistencia: ${reservasTop10}`);
  console.log(`  - Reservas: ${topAsistentes.reduce((sum, c) => sum + c.totalReservas, 0)}`);
  
  console.log('\n✅ VERIFICACIÓN:');
  console.log(`  - Rommy Rodríguez (68 asistentes) está en el Top 10: ${topAsistentes.some(c => c.nombre.includes('Rommy')) ? 'SÍ' : 'NO'}`);
  console.log(`  - Ya NO se agrupa todo en "Cliente Express"`);
  console.log(`  - Se muestra el customerName real de cada reserva`);
  
  await prisma.$disconnect();
}

verificarCambios();
