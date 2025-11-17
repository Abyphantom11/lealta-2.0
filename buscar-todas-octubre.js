/**
 * 🔍 Buscar TODAS las reservas de octubre (sin filtrar por business)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function buscarTodasOctubre() {
  console.log('🔍 BUSCANDO TODAS LAS RESERVAS DE OCTUBRE 2025\n');

  try {
    const mes = 10;
    const año = 2025;
    const fechaInicio = new Date(Date.UTC(año, mes - 1, 1, 0, 0, 0, 0));
    const fechaFin = new Date(Date.UTC(año, mes, 1, 0, 0, 0, 0));

    // Buscar TODAS las reservas de octubre (sin filtro de business)
    const todasReservas = await prisma.reservation.findMany({
      where: {
        reservedAt: {
          gte: fechaInicio,
          lt: fechaFin
        }
      },
      include: {
        Business: {
          select: {
            id: true,
            nombre: true
          }
        },
        HostTracking: true
      }
    });

    console.log(`📊 Total reservas encontradas en octubre: ${todasReservas.length}\n`);

    if (todasReservas.length === 0) {
      console.log('❌ NO SE ENCONTRARON RESERVAS EN OCTUBRE 2025');
      console.log('\n💡 Verifica:');
      console.log('   1. ¿Las reservas están en otro mes?');
      console.log('   2. ¿El campo reservedAt está correcto?');
      console.log('   3. ¿Se crearon en un año diferente?');
      
      // Buscar las primeras 5 reservas sin importar la fecha
      const algunasReservas = await prisma.reservation.findMany({
        take: 5,
        orderBy: {
          reservedAt: 'desc'
        },
        include: {
          Business: {
            select: {
              nombre: true
            }
          }
        }
      });

      console.log('\n📅 ÚLTIMAS 5 RESERVAS EN LA DB (cualquier fecha):');
      algunasReservas.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.Business.nombre} - ${new Date(r.reservedAt).toLocaleDateString('es-ES')} - ${r.guestCount} personas`);
      });

      return;
    }

    // Agrupar por business
    const porBusiness = todasReservas.reduce((acc, r) => {
      const businessNombre = r.Business.nombre;
      if (!acc[businessNombre]) {
        acc[businessNombre] = {
          id: r.Business.id,
          total: 0,
          conTracking: 0
        };
      }
      acc[businessNombre].total++;
      if (r.HostTracking) acc[businessNombre].conTracking++;
      return acc;
    }, {});

    console.log('🏢 RESERVAS POR NEGOCIO:\n');
    Object.entries(porBusiness).forEach(([nombre, data]) => {
      console.log(`   ${nombre}:`);
      console.log(`      ID: ${data.id}`);
      console.log(`      Total: ${data.total} reservas`);
      console.log(`      Con tracking: ${data.conTracking}`);
      console.log(`      Sin tracking: ${data.total - data.conTracking}`);
      console.log('');
    });

    // Análisis de HostTracking
    const conTracking = todasReservas.filter(r => r.HostTracking).length;
    const sinTracking = todasReservas.length - conTracking;

    console.log('📊 RESUMEN GENERAL:');
    console.log(`   ✅ Con HostTracking: ${conTracking}`);
    console.log(`   ❌ Sin HostTracking: ${sinTracking}`);

    if (sinTracking > 0) {
      console.log(`\n⚠️ ${sinTracking} reservas no tienen asistencia registrada`);
      console.log('   Por eso el reporte muestra 0 asistentes reales');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarTodasOctubre();
