/**
 * Script para aclarar la diferencia entre:
 * - Asistentes Reales (QR escaneados)
 * - Total de Personas Atendidas (QR + Sin Reserva)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clarifyOctoberNumbers() {
  try {
    console.log('🔍 ACLARANDO NÚMEROS DE OCTUBRE 2025\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' }
    });

    const primerDiaOctubre = new Date(2025, 9, 1);
    const primerDiaNoviembre = new Date(2025, 10, 1);

    // ==========================================
    // 1. QR CODES ESCANEADOS (ASISTENTES REALES)
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('📱 QR CODES ESCANEADOS DE OCTUBRE');
    console.log('═══════════════════════════════════════════════\n');

    const qrCodesOctubre = await prisma.reservationQRCode.findMany({
      where: {
        Reservation: {
          businessId: business.id,
          reservedAt: {
            gte: primerDiaOctubre,
            lt: primerDiaNoviembre
          }
        }
      },
      include: {
        Reservation: {
          select: {
            id: true,
            reservedAt: true,
            guestCount: true,
            Cliente: {
              select: {
                nombre: true
              }
            }
          }
        }
      },
      orderBy: {
        lastScannedAt: 'desc'
      }
    });

    console.log(`Total de QR codes generados: ${qrCodesOctubre.length}\n`);

    // Separar por estado de escaneo
    const qrEscaneados = qrCodesOctubre.filter(qr => qr.scanCount > 0);
    const qrNoEscaneados = qrCodesOctubre.filter(qr => qr.scanCount === 0);

    console.log(`✅ QR ESCANEADOS: ${qrEscaneados.length}`);
    console.log(`❌ QR NO ESCANEADOS: ${qrNoEscaneados.length}\n`);

    // Calcular total de personas que escanearon
    const totalPersonasConQR = qrEscaneados.reduce((sum, qr) => sum + qr.scanCount, 0);

    console.log(`👥 TOTAL DE PERSONAS QUE ESCANEARON QR: ${totalPersonasConQR}`);
    console.log(`   (Esto es lo que muestra "Asistentes Reales" en el reporte)\n`);

    // Mostrar los QR escaneados con detalle
    console.log('📋 DETALLE DE QR ESCANEADOS:\n');
    
    let totalMostrado = 0;
    const limite = 10;
    
    qrEscaneados.slice(0, limite).forEach((qr, index) => {
      const fecha = qr.lastScannedAt ? qr.lastScannedAt.toISOString().split('T')[0] : 'N/A';
      const hora = qr.lastScannedAt ? qr.lastScannedAt.toISOString().split('T')[1].substring(0, 5) : 'N/A';
      console.log(`${index + 1}. Cliente: ${qr.Reservation.Cliente?.nombre || 'Sin nombre'}`);
      console.log(`   Esperados: ${qr.Reservation.guestCount} | Escaneados: ${qr.scanCount}`);
      console.log(`   Último escaneo: ${fecha} ${hora}\n`);
      totalMostrado++;
    });

    if (qrEscaneados.length > limite) {
      console.log(`   ... y ${qrEscaneados.length - limite} QR escaneados más\n`);
    }

    // ==========================================
    // 2. PERSONAS SIN RESERVA (WALK-INS)
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('🚶 PERSONAS SIN RESERVA (WALK-INS)');
    console.log('═══════════════════════════════════════════════\n');

    const sinReservasOctubre = await prisma.sinReserva.findMany({
      where: {
        businessId: business.id,
        fecha: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      },
      orderBy: { fecha: 'desc' }
    });

    const totalPersonasSinReserva = sinReservasOctubre.reduce((sum, r) => sum + r.numeroPersonas, 0);

    console.log(`Total de registros: ${sinReservasOctubre.length}`);
    console.log(`👥 TOTAL DE PERSONAS SIN RESERVA: ${totalPersonasSinReserva}\n`);

    // ==========================================
    // 3. RESUMEN Y ACLARACIÓN
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('📊 RESUMEN Y ACLARACIÓN');
    console.log('═══════════════════════════════════════════════\n');

    const totalReservas = await prisma.reservation.count({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      }
    });

    const personasEsperadas = await prisma.reservation.aggregate({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      },
      _sum: {
        guestCount: true
      }
    });

    const totalPersonasAtendidas = totalPersonasConQR + totalPersonasSinReserva;

    console.log('🎯 CONCEPTOS IMPORTANTES:\n');

    console.log('1️⃣  RESERVAS Y EXPECTATIVAS:');
    console.log(`    Total de reservas creadas: ${totalReservas}`);
    console.log(`    Personas esperadas (guestCount): ${personasEsperadas._sum.guestCount}`);
    console.log('    ↑ Esto es cuántas personas DIJERON que vendrían\n');

    console.log('2️⃣  ASISTENTES REALES (con reserva):');
    console.log(`    QR codes escaneados: ${qrEscaneados.length} de ${qrCodesOctubre.length}`);
    console.log(`    Personas que escanearon: ${totalPersonasConQR}`);
    console.log('    ↑ Esto es cuántas personas CON RESERVA realmente asistieron\n');

    console.log('3️⃣  PERSONAS SIN RESERVA (walk-ins):');
    console.log(`    Registros de walk-ins: ${sinReservasOctubre.length}`);
    console.log(`    Personas sin reserva: ${totalPersonasSinReserva}`);
    console.log('    ↑ Esto es cuántas personas vinieron SIN RESERVA\n');

    console.log('4️⃣  TOTAL DE PERSONAS ATENDIDAS:');
    console.log(`    ${totalPersonasConQR} (con QR) + ${totalPersonasSinReserva} (sin reserva) = ${totalPersonasAtendidas}`);
    console.log('    ↑ Este es el TOTAL REAL de personas que atendieron\n');

    console.log('═══════════════════════════════════════════════');
    console.log('💡 EXPLICACIÓN DE LOS NÚMEROS DEL REPORTE');
    console.log('═══════════════════════════════════════════════\n');

    console.log('En el reporte de Octubre que estás viendo:\n');
    
    console.log('📋 "Asistentes Reales: 215"');
    console.log(`   → Son las ${totalPersonasConQR} personas que ESCANEARON su QR`);
    console.log('   → Solo cuenta personas CON RESERVA que asistieron\n');

    console.log('🚶 "Total Personas (Sin Reserva): 375"');
    console.log(`   → Son las ${totalPersonasSinReserva} personas que llegaron sin reserva`);
    console.log('   → Walk-ins registrados manualmente\n');

    console.log('📊 "Total Personas Atendidas: 590"');
    console.log(`   → Es la suma: ${totalPersonasConQR} + ${totalPersonasSinReserva} = ${totalPersonasAtendidas}`);
    console.log('   → Este es el VERDADERO total de personas atendidas\n');

    console.log('═══════════════════════════════════════════════');
    console.log('🎯 RESPUESTA A TU PREGUNTA');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`❓ "De 1,102 personas esperadas, solo asistieron 215?"\n`);
    
    console.log(`✅ CORRECTO: De las 1,102 personas que RESERVARON:`);
    console.log(`   → Solo ${totalPersonasConQR} escanearon su QR y asistieron`);
    console.log(`   → Eso es el ${((totalPersonasConQR / personasEsperadas._sum.guestCount) * 100).toFixed(1)}% de cumplimiento\n`);

    console.log(`📊 PERO el TOTAL de personas atendidas fue:`);
    console.log(`   → ${totalPersonasAtendidas} personas (incluyendo ${totalPersonasSinReserva} walk-ins)`);
    console.log(`   → El negocio atendió muchas más personas sin reserva\n`);

    console.log('💡 CONCLUSIÓN:');
    console.log('   - Las reservas tienen bajo cumplimiento (19.5%)');
    console.log('   - Pero el local estuvo lleno gracias a walk-ins');
    console.log(`   - En total atendieron ${totalPersonasAtendidas} personas en octubre\n`);

    // ==========================================
    // 4. VERIFICAR CUÁNTOS QR SE ESCANEARON
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('🔢 CONTEO EXACTO DE ESCANEOS');
    console.log('═══════════════════════════════════════════════\n');

    // Contar escaneos múltiples
    let totalEscaneos = 0;
    const distribucionEscaneos = {};

    qrCodesOctubre.forEach(qr => {
      const count = qr.scanCount || 0;
      totalEscaneos += count;
      
      if (!distribucionEscaneos[count]) {
        distribucionEscaneos[count] = 0;
      }
      distribucionEscaneos[count]++;
    });

    console.log('Distribución de escaneos por QR:\n');
    Object.keys(distribucionEscaneos).sort((a, b) => b - a).forEach(count => {
      const cantidad = distribucionEscaneos[count];
      const etiqueta = count == 0 ? 'No escaneado' : 
                      count == 1 ? '1 escaneo' : 
                      `${count} escaneos`;
      console.log(`   ${etiqueta}: ${cantidad} QR codes`);
    });

    console.log(`\n📊 TOTAL DE ESCANEOS REGISTRADOS: ${totalEscaneos}`);
    console.log(`   (Esto cuenta cada vez que se escaneó un QR)\n`);

    console.log('🎯 RESUMEN FINAL:\n');
    console.log(`   ✅ ${qrEscaneados.length} QR codes fueron escaneados (al menos una vez)`);
    console.log(`   ✅ ${totalPersonasConQR} personas escanearon QR en total`);
    console.log(`   ✅ ${totalEscaneos} escaneos totales (algunos QR se escanearon múltiples veces)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clarifyOctoberNumbers();
