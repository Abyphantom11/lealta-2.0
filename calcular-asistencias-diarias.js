/**
 * CÁLCULO CORRECTO: Sumar asistencias de CADA DÍA
 * Usando HostTracking que registra las asistencias diarias
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calcularAsistenciasDiarias() {
  try {
    console.log('🎯 CALCULANDO ASISTENCIAS SUMANDO CADA DÍA\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' }
    });

    const primerDiaOctubre = new Date(2025, 9, 1);
    const primerDiaNoviembre = new Date(2025, 10, 1);

    // ==========================================
    // BUSCAR EN TODAS LAS TABLAS POSIBLES
    // ==========================================

    console.log('🔍 Buscando registros de asistencias en HostTracking...\n');
    
    const hostTrackings = await prisma.hostTracking.findMany({
      where: {
        businessId: business.id,
        reservationDate: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      },
      orderBy: {
        reservationDate: 'asc'
      }
    });

    console.log(`Registros en HostTracking: ${hostTrackings.length}\n`);

    if (hostTrackings.length > 0) {
      // Agrupar por día
      const asistenciasPorDia = {};
      
      for (const tracking of hostTrackings) {
        const fecha = tracking.reservationDate.toISOString().split('T')[0];
        
        if (!asistenciasPorDia[fecha]) {
          asistenciasPorDia[fecha] = {
            registros: 0,
            personas: 0
          };
        }
        
        asistenciasPorDia[fecha].registros++;
        asistenciasPorDia[fecha].personas += tracking.guestCount;
      }

      console.log('═══════════════════════════════════════════════');
      console.log('📊 ASISTENCIAS POR DÍA (HostTracking)');
      console.log('═══════════════════════════════════════════════\n');

      let totalAsistencias = 0;
      const fechas = Object.keys(asistenciasPorDia).sort();

      for (const fecha of fechas) {
        const data = asistenciasPorDia[fecha];
        console.log(`📅 ${fecha}: ${data.personas} personas (${data.registros} registros)`);
        totalAsistencias += data.personas;
      }

      console.log('\n─────────────────────────────────────────────────');
      console.log(`✨ TOTAL DE ASISTENCIAS: ${totalAsistencias}`);
      console.log('─────────────────────────────────────────────────\n');
    }

    // ==========================================
    // TAMBIÉN BUSCAR EN GuestConsumo (consumos)
    // ==========================================
    console.log('\n🔍 Buscando en GuestConsumo...\n');

    const guestConsumos = await prisma.guestConsumo.findMany({
      where: {
        businessId: business.id,
        registeredAt: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      }
    });

    console.log(`Registros en GuestConsumo: ${guestConsumos.length}\n`);

    // ==========================================
    // TAMBIÉN BUSCAR EN Visita
    // ==========================================
    console.log('🔍 Buscando en Visita...\n');

    const visitas = await prisma.visita.findMany({
      where: {
        businessId: business.id,
        timestamp: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      }
    });

    console.log(`Registros en Visita: ${visitas.length}\n`);

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('🎯 RESUMEN DE TABLAS CON ASISTENCIAS');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`📋 HostTracking: ${hostTrackings.length} registros`);
    console.log(`📋 GuestConsumo: ${guestConsumos.length} registros`);
    console.log(`📋 Visita: ${visitas.length} registros`);
    console.log(`📋 ReservationQRCode: 27 QR escaneados (215 personas)`);
    console.log(`📋 SinReserva: 149 registros (375 personas)\n`);

    console.log('💡 ¿Cuál tabla tiene las asistencias diarias que mencionas?\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calcularAsistenciasDiarias();
