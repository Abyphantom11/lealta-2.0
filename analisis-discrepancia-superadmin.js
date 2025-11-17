const { PrismaClient, Temporal } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script para analizar las discrepancias entre:
 * - Módulo de Reservas: 280 asistentes, 44 reservas
 * - SuperAdmin: 235 invitados, 24 asistencias, 44 reservas
 */

async function analizar() {
  console.log('🔍 ANÁLISIS DE DISCREPANCIAS SUPERADMIN vs RESERVAS\n');
  console.log('='.repeat(70));

  // 1. Obtener fecha actual y rango del mes
  const now = new Date();
  const añoActual = now.getFullYear();
  const mesActual = now.getMonth() + 1; // getMonth() retorna 0-11
  
  const fechaInicio = new Date(Date.UTC(añoActual, mesActual - 1, 1, 0, 0, 0, 0));
  const fechaFin = new Date(Date.UTC(añoActual, mesActual, 1, 0, 0, 0, 0));

  console.log('\n📅 RANGO DE FECHAS');
  console.log('Mes actual:', mesActual, añoActual);
  console.log('Fecha inicio:', fechaInicio.toISOString());
  console.log('Fecha fin:', fechaFin.toISOString());

  // 2. SIMULAR CÁLCULO DEL MÓDULO DE RESERVAS
  console.log('\n' + '='.repeat(70));
  console.log('📊 CÁLCULO DEL MÓDULO DE RESERVAS (/api/reservas)');
  console.log('='.repeat(70));

  const reservasModulo = await prisma.reservation.findMany({
    where: {
      reservedAt: {
        gte: fechaInicio,
        lt: fechaFin
      }
    },
    include: {
      HostTracking: {
        select: {
          guestCount: true
        }
      }
    }
  });

  const totalReservas = reservasModulo.length;
  
  // El módulo de reservas filtra hasta HOY
  const hoyDate = new Date();
  hoyDate.setHours(23, 59, 59, 999);
  
  const reservasHastaHoy = reservasModulo.filter(r => {
    const fechaReserva = new Date(r.reservedAt);
    return fechaReserva <= hoyDate;
  });

  // Calcular asistentes usando HostTracking.guestCount
  const totalAsistentes = reservasHastaHoy.reduce((acc, r) => {
    const asistentesReales = r.HostTracking?.guestCount || 0;
    return acc + asistentesReales;
  }, 0);

  console.log(`Total reservas del mes: ${totalReservas}`);
  console.log(`Reservas hasta hoy: ${reservasHastaHoy.length}`);
  console.log(`Total asistentes (HostTracking.guestCount): ${totalAsistentes}`);

  // Detalle de reservas con asistentes
  const conAsistentes = reservasHastaHoy.filter(r => r.HostTracking?.guestCount > 0);
  console.log(`\nReservas con asistentes registrados: ${conAsistentes.length}`);
  if (conAsistentes.length > 0) {
    console.log('Primeras 10:');
    conAsistentes.slice(0, 10).forEach(r => {
      console.log(`  - ${r.customerName}: ${r.HostTracking?.guestCount} asistentes (${r.status})`);
    });
  }

  // 3. SIMULAR CÁLCULO DE SUPERADMIN (/api/superadmin/top-clientes-reservas)
  console.log('\n' + '='.repeat(70));
  console.log('📊 CÁLCULO DE SUPERADMIN (top-clientes-reservas)');
  console.log('='.repeat(70));

  const reservasSuperAdmin = await prisma.reservation.findMany({
    where: {
      reservedAt: {
        gte: fechaInicio,
        lt: fechaFin
      }
    },
    include: {
      Cliente: {
        select: {
          id: true,
          nombre: true,
          cedula: true
        }
      },
      HostTracking: {
        select: {
          guestCount: true
        }
      }
    }
  });

  // Agrupar por cliente
  const clientesMap = new Map();
  let totalInvitadosSA = 0;
  let totalAsistenciasSA = 0;

  reservasSuperAdmin.forEach(reserva => {
    if (reserva.Cliente) {
      const clienteId = reserva.Cliente.id;
      
      if (!clientesMap.has(clienteId)) {
        clientesMap.set(clienteId, {
          id: reserva.Cliente.id,
          nombre: reserva.Cliente.nombre,
          cedula: reserva.Cliente.cedula,
          totalReservas: 0,
          totalInvitados: 0,
          asistencias: 0
        });
      }

      const cliente = clientesMap.get(clienteId);
      cliente.totalReservas++;
      
      // ✅ Lógica actual de SuperAdmin
      if (reserva.status === 'COMPLETED' || reserva.status === 'CONFIRMED' || reserva.status === 'CHECKED_IN') {
        const invitadosParaContar = (reserva.HostTracking?.guestCount && reserva.HostTracking.guestCount > 0)
          ? reserva.HostTracking.guestCount 
          : reserva.guestCount;
        
        cliente.totalInvitados += invitadosParaContar;
        cliente.asistencias++;
      }
    }
  });

  // Sumar totales
  const clientes = Array.from(clientesMap.values());
  clientes.forEach(c => {
    totalInvitadosSA += c.totalInvitados;
    totalAsistenciasSA += c.asistencias;
  });

  console.log(`Total clientes con reservas: ${clientes.length}`);
  console.log(`Total invitados (según lógica SuperAdmin): ${totalInvitadosSA}`);
  console.log(`Total asistencias (reservas COMPLETED/CONFIRMED/CHECKED_IN): ${totalAsistenciasSA}`);

  // Top 10 clientes
  const top10 = clientes.sort((a, b) => b.totalInvitados - a.totalInvitados).slice(0, 10);
  console.log('\nTop 10 clientes:');
  top10.forEach((c, i) => {
    console.log(`  ${i+1}. ${c.nombre}: ${c.totalInvitados} invitados, ${c.asistencias} asistencias`);
  });

  // 4. ANÁLISIS DETALLADO DE ESTADOS
  console.log('\n' + '='.repeat(70));
  console.log('📋 ANÁLISIS POR ESTADOS');
  console.log('='.repeat(70));

  const porEstado = {};
  reservasSuperAdmin.forEach(r => {
    if (!porEstado[r.status]) {
      porEstado[r.status] = {
        count: 0,
        conHostTracking: 0,
        guestCountReserva: 0,
        guestCountHostTracking: 0
      };
    }
    porEstado[r.status].count++;
    porEstado[r.status].guestCountReserva += r.guestCount;
    
    if (r.HostTracking) {
      porEstado[r.status].conHostTracking++;
      porEstado[r.status].guestCountHostTracking += (r.HostTracking.guestCount || 0);
    }
  });

  console.log('\nDesglose por estado:');
  Object.keys(porEstado).sort().forEach(estado => {
    const data = porEstado[estado];
    console.log(`\n${estado}:`);
    console.log(`  - Cantidad: ${data.count} reservas`);
    console.log(`  - Con HostTracking: ${data.conHostTracking}`);
    console.log(`  - guestCount (Reservation): ${data.guestCountReserva}`);
    console.log(`  - guestCount (HostTracking): ${data.guestCountHostTracking}`);
  });

  // 5. IDENTIFICAR LA DISCREPANCIA
  console.log('\n' + '='.repeat(70));
  console.log('🔎 IDENTIFICACIÓN DE DISCREPANCIAS');
  console.log('='.repeat(70));

  console.log('\nMódulo de Reservas:');
  console.log(`  - Reservas: ${totalReservas}`);
  console.log(`  - Asistentes: ${totalAsistentes} (solo HostTracking.guestCount)`);

  console.log('\nSuperAdmin:');
  console.log(`  - Reservas: ${clientes.reduce((acc, c) => acc + c.totalReservas, 0)}`);
  console.log(`  - Invitados: ${totalInvitadosSA} (HostTracking o Reservation.guestCount)`);
  console.log(`  - Asistencias: ${totalAsistenciasSA} (count de reservas COMPLETED/CONFIRMED/CHECKED_IN)`);

  console.log('\n⚠️  PROBLEMA DETECTADO:');
  console.log('El módulo de reservas muestra "Total Asistentes" usando SOLO HostTracking.guestCount');
  console.log('SuperAdmin suma "Invitados" usando HostTracking.guestCount cuando existe, sino Reservation.guestCount');
  console.log('\n💡 SOLUCIÓN:');
  console.log('SuperAdmin debería mostrar solo HostTracking.guestCount para ser consistente con Reservas');

  await prisma.$disconnect();
}

analizar().catch(console.error);
