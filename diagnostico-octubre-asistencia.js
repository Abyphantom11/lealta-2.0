/**
 * 🔍 DIAGNÓSTICO: Reservas de Octubre sin Asistencia
 * 
 * Investiga por qué las 146 reservas de octubre tienen 0 asistentes reales
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticarOctubre() {
  console.log('🔍 DIAGNÓSTICO DE RESERVAS DE OCTUBRE 2025\n');
  console.log('='.repeat(60));

  try {
    // Buscar reservas de octubre IGUAL que el API de reportes
    const mes = 10; // Octubre
    const año = 2025;
    const fechaInicio = new Date(Date.UTC(año, mes - 1, 1, 0, 0, 0, 0));
    const fechaFin = new Date(Date.UTC(año, mes, 1, 0, 0, 0, 0));

    console.log(`\n📅 PERÍODO DE BÚSQUEDA (UTC):`);
    console.log(`   Inicio: ${fechaInicio.toISOString()}`);
    console.log(`   Fin: ${fechaFin.toISOString()}`);

    const reservas = await prisma.reservation.findMany({
      where: {
        businessId: 'cmhpco1ty0000ey2w42atotkd', // Love Me Sky
        reservedAt: {
          gte: fechaInicio,
          lt: fechaFin
        }
      },
      include: {
        HostTracking: true,
        Cliente: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        reservedAt: 'asc'
      }
    });

    console.log(`\n📊 RESUMEN GENERAL:`);
    console.log(`   Total reservas: ${reservas.length}`);
    console.log(`   Período: 01/10/2025 - 31/10/2025\n`);

    // Análisis por estado
    const porEstado = reservas.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`📋 ESTADOS DE RESERVAS:`);
    Object.entries(porEstado).forEach(([estado, cantidad]) => {
      console.log(`   ${estado}: ${cantidad} reservas`);
    });

    // Análisis de HostTracking
    const conHostTracking = reservas.filter(r => r.HostTracking).length;
    const sinHostTracking = reservas.length - conHostTracking;

    console.log(`\n🎯 HOST TRACKING:`);
    console.log(`   ✅ Con HostTracking: ${conHostTracking}`);
    console.log(`   ❌ Sin HostTracking: ${sinHostTracking}`);

    if (conHostTracking > 0) {
      const asistentes = reservas.reduce((sum, r) => sum + (r.HostTracking?.guestCount || 0), 0);
      console.log(`   👥 Total asistentes: ${asistentes}`);
    }

    // Muestra de primeras 5 reservas
    console.log(`\n📝 MUESTRA DE PRIMERAS 5 RESERVAS:\n`);
    reservas.slice(0, 5).forEach((r, idx) => {
      console.log(`${idx + 1}. Fecha: ${new Date(r.reservedAt).toLocaleDateString('es-ES')}`);
      console.log(`   Cliente: ${r.customerName || r.Cliente?.nombre || 'N/A'}`);
      console.log(`   Estado: ${r.status}`);
      console.log(`   Esperados: ${r.guestCount} personas`);
      console.log(`   HostTracking: ${r.HostTracking ? `✅ ${r.HostTracking.guestCount} asistieron` : '❌ No registrado'}`);
      console.log('');
    });

    // Diagnóstico del problema
    console.log(`\n🔍 DIAGNÓSTICO:`);
    
    if (sinHostTracking === reservas.length) {
      console.log(`   ⚠️ PROBLEMA ENCONTRADO:`);
      console.log(`   Ninguna reserva de octubre tiene HostTracking registrado.`);
      console.log(`\n   💡 POSIBLES CAUSAS:`);
      console.log(`   1. El sistema de escaneo QR no se usó en octubre`);
      console.log(`   2. No se marcó asistencia manualmente`);
      console.log(`   3. Problema técnico en el registro de asistencia`);
      console.log(`\n   ✅ SOLUCIONES:`);
      console.log(`   A) Si las reservas SÍ asistieron:`);
      console.log(`      → Crear registros de HostTracking retroactivos`);
      console.log(`      → Script: crear-hosttracking-octubre.js`);
      console.log(`\n   B) Si NO asistieron:`);
      console.log(`      → Marcar como NO_SHOW las que no llegaron`);
      console.log(`      → Los reportes reflejarán correctamente 0 asistentes`);
    } else if (sinHostTracking > 0) {
      console.log(`   ⚠️ PROBLEMA PARCIAL:`);
      console.log(`   ${sinHostTracking} reservas no tienen HostTracking.`);
      console.log(`   Verifica si estas reservas necesitan registro manual.`);
    } else {
      console.log(`   ✅ Todo normal: Todas las reservas tienen HostTracking.`);
    }

    // Análisis por fecha
    const porFecha = reservas.reduce((acc, r) => {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
      if (!acc[fecha]) {
        acc[fecha] = { total: 0, conTracking: 0 };
      }
      acc[fecha].total++;
      if (r.HostTracking) acc[fecha].conTracking++;
      return acc;
    }, {});

    console.log(`\n📅 RESERVAS POR DÍA (primeros 10):`);
    Object.entries(porFecha)
      .slice(0, 10)
      .forEach(([fecha, data]) => {
        const porcentaje = ((data.conTracking / data.total) * 100).toFixed(0);
        console.log(`   ${fecha}: ${data.total} reservas (${data.conTracking} con tracking - ${porcentaje}%)`);
      });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
diagnosticarOctubre();
