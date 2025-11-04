const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarShareLinks() {
  try {
    console.log('🔍 Verificando QRShareLinks antiguos...\n');

    // Obtener todos los shareLinks
    const allShareLinks = await prisma.qRShareLink.findMany({
      include: {
        Reservation: {
          select: {
            id: true,
            reservedAt: true,
            customerName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Total QRShareLinks: ${allShareLinks.length}\n`);

    // Separar por mes
    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    
    const shareLinksOctubre = allShareLinks.filter(link => {
      const fechaReserva = new Date(link.Reservation.reservedAt);
      return fechaReserva < inicioMesActual;
    });

    const shareLinksNoviembre = allShareLinks.filter(link => {
      const fechaReserva = new Date(link.Reservation.reservedAt);
      return fechaReserva >= inicioMesActual;
    });

    console.log(`📅 QRShareLinks de OCTUBRE (antes del ${inicioMesActual.toLocaleDateString('es-ES')}): ${shareLinksOctubre.length}`);
    console.log(`📅 QRShareLinks de NOVIEMBRE (desde el ${inicioMesActual.toLocaleDateString('es-ES')}): ${shareLinksNoviembre.length}\n`);

    if (shareLinksOctubre.length > 0) {
      console.log('🔍 Detalles de ShareLinks de octubre:\n');
      shareLinksOctubre.forEach((link, index) => {
        const fechaReserva = new Date(link.Reservation.reservedAt);
        console.log(`${index + 1}. ShareID: ${link.shareId}`);
        console.log(`   Cliente: ${link.Reservation.customerName}`);
        console.log(`   Fecha Reserva: ${fechaReserva.toLocaleDateString('es-ES')}`);
        console.log(`   Vistas: ${link.views}`);
        console.log(`   Creado: ${new Date(link.createdAt).toLocaleDateString('es-ES')}`);
        console.log('');
      });

      console.log('\n⚠️ PROBLEMA IDENTIFICADO:');
      console.log(`Hay ${shareLinksOctubre.length} links compartidos de octubre que siguen activos.`);
      console.log('Cuando alguien accede a estos links, puede ver el QR de reservas antiguas.');
      console.log('\n💡 SOLUCIÓN:');
      console.log('El script de limpieza debe borrar también los QRShareLinks de meses anteriores.');
    } else {
      console.log('✅ No hay QRShareLinks antiguos. Todo limpio.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarShareLinks();
