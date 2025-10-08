const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function analizarReservasSeptiembre() {
  try {
    console.log('📊 ANÁLISIS DE RETENCIÓN - SEPTIEMBRE 2025\n');
    console.log('═'.repeat(80));

    // Obtener todas las reservas de septiembre
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
            id: true,
            nombre: true,
            cedula: true,
            correo: true,
            telefono: true,
          },
        },
      },
      orderBy: {
        reservedAt: 'desc',
      },
    });

    console.log(`\n📅 Total Reservas Septiembre: ${reservasSeptiembre.length}\n`);

    // CATEGORIZACIÓN DE RESERVAS
    const activas = reservasSeptiembre.filter(r => r.status === 'COMPLETED');
    const caidas = reservasSeptiembre.filter(r => 
      r.status === 'CANCELLED' || r.status === 'NO_SHOW'
    );
    const canceladas = reservasSeptiembre.filter(r => r.status === 'CANCELLED');
    const noShow = reservasSeptiembre.filter(r => r.status === 'NO_SHOW');

    console.log('🎯 CATEGORIZACIÓN DE RESERVAS:');
    console.log('─'.repeat(80));
    console.log(`✅ ACTIVAS (Asistieron):     ${activas.length} (${((activas.length/reservasSeptiembre.length)*100).toFixed(1)}%)`);
    console.log(`❌ CAÍDAS (No asistieron):   ${caidas.length} (${((caidas.length/reservasSeptiembre.length)*100).toFixed(1)}%)`);
    console.log(`   ├─ Canceladas:            ${canceladas.length} (${((canceladas.length/reservasSeptiembre.length)*100).toFixed(1)}%)`);
    console.log(`   └─ No Show:               ${noShow.length} (${((noShow.length/reservasSeptiembre.length)*100).toFixed(1)}%)`);

    // ANÁLISIS POR CLIENTE
    console.log('\n\n👥 ANÁLISIS POR CLIENTE:\n');

    const clientesMap = new Map();

    reservasSeptiembre.forEach(r => {
      if (r.cliente) {
        if (!clientesMap.has(r.clienteId)) {
          clientesMap.set(r.clienteId, {
            id: r.clienteId,
            nombre: r.cliente.nombre,
            cedula: r.cliente.cedula,
            correo: r.cliente.correo,
            telefono: r.cliente.telefono,
            totalReservas: 0,
            activas: 0,
            canceladas: 0,
            noShow: 0,
            caidas: 0,
            invitados: 0,
            ingresos: 0,
            ultimaReserva: r.reservedAt,
          });
        }

        const stats = clientesMap.get(r.clienteId);
        stats.totalReservas++;
        stats.invitados += r.guestCount;
        stats.ingresos += parseFloat(r.paidAmount || 0);

        if (r.status === 'COMPLETED') {
          stats.activas++;
        } else if (r.status === 'CANCELLED') {
          stats.canceladas++;
          stats.caidas++;
        } else if (r.status === 'NO_SHOW') {
          stats.noShow++;
          stats.caidas++;
        }

        if (r.reservedAt > stats.ultimaReserva) {
          stats.ultimaReserva = r.reservedAt;
        }
      }
    });

    const clientesArray = Array.from(clientesMap.values());

    // Calcular tasa de asistencia por cliente
    clientesArray.forEach(c => {
      c.tasaAsistencia = c.totalReservas > 0 
        ? ((c.activas / c.totalReservas) * 100).toFixed(1)
        : 0;
    });

    // 1. CLIENTES VIP (Alta asistencia y alto gasto)
    const clientesVIP = clientesArray
      .filter(c => c.activas >= 5 && c.ingresos >= 400)
      .sort((a, b) => b.ingresos - a.ingresos);

    console.log('🌟 CLIENTES VIP (Alta frecuencia y gasto):');
    console.log('─'.repeat(80));
    console.log('   Estrategia: Programa de fidelización premium, beneficios exclusivos\n');
    
    clientesVIP.slice(0, 5).forEach((c, i) => {
      console.log(`${i + 1}. ${c.nombre}`);
      console.log(`   💰 €${c.ingresos.toFixed(2)} | 📅 ${c.activas} asistencias | 👥 ${c.invitados} invitados`);
      console.log(`   📊 Tasa asistencia: ${c.tasaAsistencia}% | ✉️  ${c.correo}`);
      console.log('');
    });

    // 2. CLIENTES EN RIESGO (Alta tasa de cancelación)
    const clientesRiesgo = clientesArray
      .filter(c => c.totalReservas >= 3 && parseFloat(c.tasaAsistencia) < 60)
      .sort((a, b) => parseFloat(a.tasaAsistencia) - parseFloat(b.tasaAsistencia));

    console.log('\n⚠️  CLIENTES EN RIESGO (Baja tasa de asistencia):');
    console.log('─'.repeat(80));
    console.log('   Estrategia: Recordatorios personalizados, incentivos especiales\n');

    clientesRiesgo.slice(0, 5).forEach((c, i) => {
      console.log(`${i + 1}. ${c.nombre}`);
      console.log(`   📊 Tasa asistencia: ${c.tasaAsistencia}% | 📅 ${c.activas}/${c.totalReservas} reservas`);
      console.log(`   ❌ Caídas: ${c.caidas} (${c.canceladas} canceladas, ${c.noShow} no-show)`);
      console.log(`   📞 ${c.telefono} | ✉️  ${c.correo}`);
      console.log('');
    });

    // 3. CLIENTES INACTIVOS EN OCTUBRE
    const reservasOctubre = await prisma.reservation.findMany({
      where: {
        businessId,
        reservedAt: {
          gte: new Date(2025, 9, 1), // Octubre
        },
      },
      select: {
        clienteId: true,
      },
    });

    const clientesActivosOctubre = new Set(
      reservasOctubre.map(r => r.clienteId).filter(id => id)
    );

    const clientesInactivos = clientesArray
      .filter(c => !clientesActivosOctubre.has(c.id) && c.activas >= 3)
      .sort((a, b) => b.ingresos - a.ingresos);

    console.log('\n🔔 CLIENTES QUE NO HAN VUELTO EN OCTUBRE:');
    console.log('─'.repeat(80));
    console.log('   Estrategia: Campaña de reactivación, ofertas personalizadas\n');

    clientesInactivos.slice(0, 8).forEach((c, i) => {
      const diasDesdeUltima = Math.floor(
        (new Date() - new Date(c.ultimaReserva)) / (1000 * 60 * 60 * 24)
      );
      
      console.log(`${i + 1}. ${c.nombre}`);
      console.log(`   💰 Gastó €${c.ingresos.toFixed(2)} en septiembre | 📅 ${c.activas} asistencias`);
      console.log(`   ⏰ Última reserva: hace ${diasDesdeUltima} días`);
      console.log(`   📞 ${c.telefono} | ✉️  ${c.correo}`);
      console.log('');
    });

    // RESUMEN FINANCIERO
    const totalIngresos = activas.reduce((sum, r) => sum + parseFloat(r.paidAmount || 0), 0);
    const ingresosPerdidos = caidas.reduce((sum, r) => sum + parseFloat(r.totalPrice || 0), 0);

    console.log('\n💰 ANÁLISIS FINANCIERO:');
    console.log('─'.repeat(80));
    console.log(`✅ Ingresos Reales:         €${totalIngresos.toFixed(2)}`);
    console.log(`❌ Ingresos Perdidos:       €${ingresosPerdidos.toFixed(2)}`);
    console.log(`📊 Tasa de Conversión:      ${((activas.length/reservasSeptiembre.length)*100).toFixed(1)}%`);
    console.log(`💡 Potencial de Mejora:     €${(ingresosPerdidos * 0.5).toFixed(2)} (recuperando 50% de caídas)`);

    console.log('\n═'.repeat(80));
    console.log('✨ Análisis completo para estrategias de retención!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analizarReservasSeptiembre();
