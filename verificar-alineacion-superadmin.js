const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script de verificación: Comprobar que SuperAdmin ahora muestra los mismos datos que Reservas
 */

async function verificar() {
  console.log('✅ VERIFICACIÓN POST-CAMBIOS\n');
  console.log('='.repeat(70));

  const now = new Date();
  const añoActual = now.getFullYear();
  const mesActual = now.getMonth() + 1;
  
  const fechaInicio = new Date(Date.UTC(añoActual, mesActual - 1, 1, 0, 0, 0, 0));
  const fechaFin = new Date(Date.UTC(añoActual, mesActual, 1, 0, 0, 0, 0));

  console.log('\n📅 PERIODO: Noviembre 2025');
  console.log(`Fecha inicio: ${fechaInicio.toISOString()}`);
  console.log(`Fecha fin: ${fechaFin.toISOString()}`);

  // 1. CÁLCULO DEL MÓDULO DE RESERVAS (referencia)
  console.log('\n' + '='.repeat(70));
  console.log('📊 MÓDULO DE RESERVAS (Referencia)');
  console.log('='.repeat(70));

  const reservasModulo = await prisma.reservation.findMany({
    where: {
      reservedAt: { gte: fechaInicio, lt: fechaFin }
    },
    include: {
      HostTracking: { select: { guestCount: true } }
    }
  });

  const hoyDate = new Date();
  hoyDate.setHours(23, 59, 59, 999);
  
  const reservasHastaHoy = reservasModulo.filter(r => new Date(r.reservedAt) <= hoyDate);
  const totalAsistentesModulo = reservasHastaHoy.reduce((acc, r) => 
    acc + (r.HostTracking?.guestCount || 0), 0
  );

  console.log(`Total reservas del mes: ${reservasModulo.length}`);
  console.log(`Reservas hasta hoy: ${reservasHastaHoy.length}`);
  console.log(`Total asistentes (HostTracking.guestCount): ${totalAsistentesModulo}`);

  // 2. CÁLCULO DE SUPERADMIN (con nueva lógica)
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUPERADMIN (Nueva Lógica - Alineada)');
  console.log('='.repeat(70));

  const reservasSuperAdmin = await prisma.reservation.findMany({
    where: {
      reservedAt: { gte: fechaInicio, lt: fechaFin }
    },
    include: {
      Cliente: { select: { id: true, nombre: true, cedula: true } },
      HostTracking: { select: { guestCount: true } }
    }
  });

  const clientesMap = new Map();

  for (const reserva of reservasSuperAdmin) {
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
      
      // ✅ NUEVA LÓGICA: Solo CHECKED_IN con HostTracking.guestCount > 0
      if (reserva.status === 'CHECKED_IN') {
        const asistentesReales = reserva.HostTracking?.guestCount || 0;
        
        if (asistentesReales > 0) {
          cliente.totalAsistentes += asistentesReales;
          cliente.reservasConAsistencia++;
        }
      }
    }
  }

  const clientes = Array.from(clientesMap.values());
  const totalAsistentesSA = clientes.reduce((sum, c) => sum + c.totalAsistentes, 0);
  const totalReservasConAsistenciaSA = clientes.reduce((sum, c) => sum + c.reservasConAsistencia, 0);
  const totalReservasSA = clientes.reduce((sum, c) => sum + c.totalReservas, 0);

  console.log(`Total clientes con reservas: ${clientes.length}`);
  console.log(`Total asistentes (SOLO HostTracking.guestCount): ${totalAsistentesSA}`);
  console.log(`Total reservas con asistencia: ${totalReservasConAsistenciaSA}`);
  console.log(`Total reservas: ${totalReservasSA}`);

  // Top 10 clientes
  const top10 = clientes
    .sort((a, b) => b.totalAsistentes - a.totalAsistentes)
    .slice(0, 10);

  console.log('\n🏆 Top 10 Clientes por Asistentes:');
  for (let i = 0; i < top10.length; i++) {
    const c = top10[i];
    console.log(`  ${i+1}. ${c.nombre}: ${c.totalAsistentes} asistentes, ${c.reservasConAsistencia} reservas con asistencia`);
  }

  // Sumar totales de Top 10 (lo que mostrará el widget)
  const top10TotalAsistentes = top10.reduce((sum, c) => sum + c.totalAsistentes, 0);
  const top10TotalReservasConAsistencia = top10.reduce((sum, c) => sum + c.reservasConAsistencia, 0);
  const top10TotalReservas = top10.reduce((sum, c) => sum + c.totalReservas, 0);

  console.log('\n📊 TOTALES DEL WIDGET (Top 10):');
  console.log(`  - Total Asistentes: ${top10TotalAsistentes}`);
  console.log(`  - Con Asistencia: ${top10TotalReservasConAsistencia}`);
  console.log(`  - Reservas: ${top10TotalReservas}`);

  // 3. COMPARACIÓN
  console.log('\n' + '='.repeat(70));
  console.log('✅ COMPARACIÓN FINAL');
  console.log('='.repeat(70));

  const diferencia = Math.abs(totalAsistentesModulo - totalAsistentesSA);
  const porcentajeDiferencia = ((diferencia / totalAsistentesModulo) * 100).toFixed(2);

  console.log('\n📈 Total Asistentes del Mes:');
  console.log(`  Módulo Reservas: ${totalAsistentesModulo}`);
  console.log(`  SuperAdmin: ${totalAsistentesSA}`);
  console.log(`  Diferencia: ${diferencia} (${porcentajeDiferencia}%)`);

  if (diferencia === 0) {
    console.log('\n✅ ¡PERFECTO! Los números ahora coinciden exactamente.');
    console.log('SuperAdmin está alineado con el Módulo de Reservas.');
  } else {
    console.log('\n⚠️  Hay una pequeña diferencia:');
    console.log('Posibles causas: filtrado de fechas o estados adicionales.');
  }

  console.log('\n📌 NOTA IMPORTANTE:');
  console.log('El widget en SuperAdmin muestra SOLO los Top 10 clientes.');
  console.log(`Widget mostrará: ${top10TotalAsistentes} asistentes (Top 10)`);
  console.log(`Total del mes: ${totalAsistentesSA} asistentes (Todos los clientes)`);
  console.log(`Diferencia: ${totalAsistentesSA - top10TotalAsistentes} asistentes (otros clientes)`);

  await prisma.$disconnect();
}

verificar().catch(console.error);
