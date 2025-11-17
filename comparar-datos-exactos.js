const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Comparación exacta: ¿Qué muestra el módulo de reservas vs SuperAdmin?
 */

async function comparar() {
  console.log('🔍 COMPARACIÓN EXACTA DE DATOS\n');
  console.log('='.repeat(70));

  const now = new Date();
  const añoActual = now.getFullYear();
  const mesActual = now.getMonth() + 1;
  
  const fechaInicio = new Date(Date.UTC(añoActual, mesActual - 1, 1, 0, 0, 0, 0));
  const fechaFin = new Date(Date.UTC(añoActual, mesActual, 1, 0, 0, 0, 0));

  console.log('\n📅 Noviembre 2025');
  console.log(`Rango: ${fechaInicio.toISOString()} a ${fechaFin.toISOString()}`);

  // 1. EXACTAMENTE como lo hace el módulo de reservas
  console.log('\n' + '='.repeat(70));
  console.log('📊 MÓDULO DE RESERVAS - Lógica Exacta');
  console.log('='.repeat(70));

  const reservasRaw = await prisma.reservation.findMany({
    where: { reservedAt: { gte: fechaInicio, lt: fechaFin } },
    include: {
      HostTracking: { select: { guestCount: true } },
      ReservationQRCode: { select: { scanCount: true } }
    }
  });

  console.log(`\nTotal reservas encontradas en el mes: ${reservasRaw.length}`);

  // Filtrar hasta HOY (como lo hace el módulo)
  const hoyDate = new Date();
  hoyDate.setHours(23, 59, 59, 999);
  
  const todasReservasDelMes = reservasRaw.filter(r => {
    if (!r.reservedAt) return false;
    const fechaReserva = new Date(r.reservedAt);
    return fechaReserva >= fechaInicio && fechaReserva < fechaFin;
  });

  const reservasHastaHoy = todasReservasDelMes.filter(r => {
    const fechaReserva = new Date(r.reservedAt);
    return fechaReserva <= hoyDate;
  });

  console.log(`Reservas del mes (todas): ${todasReservasDelMes.length}`);
  console.log(`Reservas hasta hoy: ${reservasHastaHoy.length}`);

  // Calcular asistentes (EXACTO como el módulo)
  const totalAsistentesConReserva = reservasHastaHoy.reduce((acc, r) => {
    const asistentesReales = r.HostTracking?.guestCount || 0;
    return acc + asistentesReales;
  }, 0);

  console.log(`\n✅ Total Asistentes (módulo): ${totalAsistentesConReserva}`);
  console.log(`✅ Total Reservas (módulo): ${todasReservasDelMes.length}`);

  // Mostrar desglose
  const conAsistentes = reservasHastaHoy.filter(r => r.HostTracking?.guestCount > 0);
  console.log(`\nReservas con asistentes > 0: ${conAsistentes.length}`);
  
  const porEstado = {};
  for (const r of conAsistentes) {
    if (!porEstado[r.status]) {
      porEstado[r.status] = { count: 0, asistentes: 0 };
    }
    porEstado[r.status].count++;
    porEstado[r.status].asistentes += (r.HostTracking?.guestCount || 0);
  }
  
  console.log('\nDesglose por estado (solo con asistentes):');
  for (const [estado, data] of Object.entries(porEstado)) {
    console.log(`  ${estado}: ${data.count} reservas, ${data.asistentes} asistentes`);
  }

  // 2. Ver qué clientes aparecen en el módulo de reservas
  console.log('\n' + '='.repeat(70));
  console.log('📊 TOP CLIENTES EN MÓDULO DE RESERVAS');
  console.log('='.repeat(70));

  // Agrupar por cliente (como debería hacerlo SuperAdmin)
  const clientesPorReserva = {};
  
  for (const r of reservasHastaHoy) {
    if (r.HostTracking?.guestCount > 0) {
      const nombre = r.customerName || 'Sin nombre';
      
      if (!clientesPorReserva[nombre]) {
        clientesPorReserva[nombre] = {
          nombre,
          totalAsistentes: 0,
          reservasConAsistencia: 0,
          reservas: []
        };
      }
      
      clientesPorReserva[nombre].totalAsistentes += r.HostTracking.guestCount;
      clientesPorReserva[nombre].reservasConAsistencia++;
      clientesPorReserva[nombre].reservas.push({
        numero: r.reservationNumber,
        estado: r.status,
        asistentes: r.HostTracking.guestCount
      });
    }
  }

  const topClientesModulo = Object.values(clientesPorReserva)
    .sort((a, b) => b.totalAsistentes - a.totalAsistentes)
    .slice(0, 10);

  console.log('\n🏆 Top 10 según MÓDULO DE RESERVAS:');
  for (let i = 0; i < topClientesModulo.length; i++) {
    const c = topClientesModulo[i];
    console.log(`  ${i+1}. ${c.nombre}: ${c.totalAsistentes} asistentes, ${c.reservasConAsistencia} reservas`);
  }

  const totalTop10Modulo = topClientesModulo.reduce((sum, c) => sum + c.totalAsistentes, 0);
  const reservasTop10Modulo = topClientesModulo.reduce((sum, c) => sum + c.reservasConAsistencia, 0);
  
  console.log(`\n📊 TOTALES TOP 10 (Módulo):`);
  console.log(`  - Total Asistentes: ${totalTop10Modulo}`);
  console.log(`  - Reservas con Asistencia: ${reservasTop10Modulo}`);

  // 3. Ver qué está calculando SuperAdmin
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUPERADMIN - Cálculo Actual');
  console.log('='.repeat(70));

  const reservasSA = await prisma.reservation.findMany({
    where: { reservedAt: { gte: fechaInicio, lt: fechaFin } },
    include: {
      Cliente: { select: { id: true, nombre: true, cedula: true } },
      HostTracking: { select: { guestCount: true } }
    }
  });

  const clientesMap = new Map();

  for (const reserva of reservasSA) {
    if (reserva.Cliente) {
      const clienteId = reserva.Cliente.id;
      
      if (!clientesMap.has(clienteId)) {
        clientesMap.set(clienteId, {
          id: reserva.Cliente.id,
          nombre: reserva.Cliente.nombre,
          cedula: reserva.Cliente.cedula,
          totalReservas: 0,
          totalAsistentes: 0,
          reservasConAsistencia: 0
        });
      }

      const cliente = clientesMap.get(clienteId);
      cliente.totalReservas++;
      
      if (reserva.status === 'CHECKED_IN') {
        const asistentesReales = reserva.HostTracking?.guestCount || 0;
        if (asistentesReales > 0) {
          cliente.totalAsistentes += asistentesReales;
          cliente.reservasConAsistencia++;
        }
      }
    }
  }

  const topClientesSA = Array.from(clientesMap.values())
    .sort((a, b) => b.totalAsistentes - a.totalAsistentes)
    .slice(0, 10);

  console.log('\n🏆 Top 10 según SUPERADMIN (actual):');
  for (let i = 0; i < topClientesSA.length; i++) {
    const c = topClientesSA[i];
    console.log(`  ${i+1}. ${c.nombre}: ${c.totalAsistentes} asistentes, ${c.reservasConAsistencia} reservas`);
  }

  const totalTop10SA = topClientesSA.reduce((sum, c) => sum + c.totalAsistentes, 0);
  const reservasTop10SA = topClientesSA.reduce((sum, c) => sum + c.reservasConAsistencia, 0);
  
  console.log(`\n📊 TOTALES TOP 10 (SuperAdmin):`);
  console.log(`  - Total Asistentes: ${totalTop10SA}`);
  console.log(`  - Reservas con Asistencia: ${reservasTop10SA}`);

  // 4. COMPARACIÓN
  console.log('\n' + '='.repeat(70));
  console.log('⚖️  COMPARACIÓN FINAL');
  console.log('='.repeat(70));

  console.log('\nMÓDULO DE RESERVAS muestra:');
  console.log(`  Total Asistentes: ${totalAsistentesConReserva}`);
  console.log(`  Total Reservas: ${todasReservasDelMes.length}`);

  console.log('\nSUPERADMIN (Top 10) muestra:');
  console.log(`  Total Asistentes: ${totalTop10SA}`);
  console.log(`  Reservas con Asistencia: ${reservasTop10SA}`);

  console.log('\n🔍 PROBLEMA DETECTADO:');
  if (totalTop10Modulo !== totalTop10SA) {
    console.log(`❌ Los Top 10 NO coinciden:`);
    console.log(`   Módulo: ${totalTop10Modulo} asistentes`);
    console.log(`   SuperAdmin: ${totalTop10SA} asistentes`);
    console.log(`   Diferencia: ${Math.abs(totalTop10Modulo - totalTop10SA)}`);
    
    console.log('\n💡 POSIBLE CAUSA:');
    console.log('El módulo de reservas agrupa por customerName (string)');
    console.log('SuperAdmin agrupa por Cliente.id (relación de BD)');
    console.log('Pueden ser diferentes si hay nombres duplicados o sin Cliente asociado');
  } else {
    console.log('✅ Los números coinciden');
  }

  // 5. Ver reservas sin Cliente asociado
  const sinCliente = reservasHastaHoy.filter(r => !r.clienteId && r.HostTracking?.guestCount > 0);
  console.log(`\n⚠️  Reservas con asistentes pero SIN Cliente asociado: ${sinCliente.length}`);
  
  if (sinCliente.length > 0) {
    const asistentesSinCliente = sinCliente.reduce((sum, r) => sum + (r.HostTracking?.guestCount || 0), 0);
    console.log(`   Total asistentes sin Cliente: ${asistentesSinCliente}`);
    console.log('   Estas reservas NO aparecen en SuperAdmin (requieren Cliente.id)');
    console.log('\n   Primeras 5:');
    for (const r of sinCliente.slice(0, 5)) {
      console.log(`   - ${r.customerName}: ${r.HostTracking?.guestCount} asistentes (${r.status})`);
    }
  }

  await prisma.$disconnect();
}

comparar().catch(console.error);
