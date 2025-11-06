const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarComprobantesOctubre() {
  try {
    console.log('🔍 VERIFICANDO COMPROBANTES EN OCTUBRE 2025\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' },
    });

    const reservations = await prisma.reservation.findMany({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
          lt: new Date('2025-11-01T00:00:00.000Z'),
        },
      },
      orderBy: {
        reservedAt: 'asc',
      },
    });

    console.log(`📊 Total reservas en octubre: ${reservations.length}\n`);

    // Verificar diferentes campos relacionados con pagos
    const conIsPaid = reservations.filter(r => r.isPaid === true);
    const conPaymentReference = reservations.filter(r => r.paymentReference);
    const conPaidAmount = reservations.filter(r => r.paidAmount && r.paidAmount > 0);
    const conTotalPrice = reservations.filter(r => r.totalPrice && r.totalPrice > 0);

    console.log('📊 ANÁLISIS DE CAMPOS DE PAGO:');
    console.log(`  isPaid = true: ${conIsPaid.length}`);
    console.log(`  paymentReference con valor: ${conPaymentReference.length}`);
    console.log(`  paidAmount > 0: ${conPaidAmount.length}`);
    console.log(`  totalPrice > 0: ${conTotalPrice.length}\n`);

    // Verificar metadata
    console.log('📊 ANÁLISIS DE METADATA:');
    let conMetadata = 0;
    let metadataConComprobante = 0;
    let ejemplosMetadata = [];

    for (const r of reservations) {
      if (r.metadata && typeof r.metadata === 'object') {
        conMetadata++;
        const meta = r.metadata;
        
        // Buscar campos relacionados con comprobante
        if (meta.comprobanteUrl || meta.comprobanteSubido || meta.comprobante) {
          metadataConComprobante++;
          const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
          ejemplosMetadata.push({
            id: r.id.slice(0, 8),
            fecha,
            cliente: r.customerName,
            metadata: meta,
          });
        }
      }
    }

    console.log(`  Reservas con metadata: ${conMetadata}`);
    console.log(`  Metadata con comprobante: ${metadataConComprobante}\n`);

    if (ejemplosMetadata.length > 0) {
      console.log('📋 EJEMPLOS DE METADATA CON COMPROBANTE:');
      for (const ejemplo of ejemplosMetadata.slice(0, 10)) {
        console.log(`\n  📝 ${ejemplo.id} | ${ejemplo.fecha} | ${ejemplo.cliente}`);
        console.log(`     Metadata:`, JSON.stringify(ejemplo.metadata, null, 2));
      }
    }

    // Buscar en notes (notas internas)
    console.log('\n📊 ANÁLISIS DE NOTES:');
    const conNotes = reservations.filter(r => r.notes);
    const notesConPago = reservations.filter(r => 
      r.notes && (
        r.notes.toLowerCase().includes('pago') ||
        r.notes.toLowerCase().includes('comprobante') ||
        r.notes.toLowerCase().includes('pagó')
      )
    );

    console.log(`  Reservas con notes: ${conNotes.length}`);
    console.log(`  Notes mencionan pago: ${notesConPago.length}`);

    if (notesConPago.length > 0) {
      console.log('\n  Ejemplos:');
      for (const r of notesConPago.slice(0, 5)) {
        const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
        console.log(`    - ${r.id.slice(0, 8)} | ${fecha} | "${r.notes}"`);
      }
    }

    // Verificar todos los campos de la reserva para encontrar comprobantes
    console.log('\n📊 BUSCANDO EN TODOS LOS CAMPOS:');
    const reservaEjemplo = reservations.find(r => r.customerName === 'DIEGO VILLACRES EN...' || r.customerName?.includes('DIEGO VILLACRES'));
    
    if (reservaEjemplo) {
      console.log('\n  Reserva de ejemplo (DIEGO VILLACRES):');
      console.log('  Campos:', Object.keys(reservaEjemplo));
      console.log('  isPaid:', reservaEjemplo.isPaid);
      console.log('  paymentReference:', reservaEjemplo.paymentReference);
      console.log('  paidAmount:', reservaEjemplo.paidAmount);
      console.log('  totalPrice:', reservaEjemplo.totalPrice);
      console.log('  metadata:', reservaEjemplo.metadata);
      console.log('  notes:', reservaEjemplo.notes);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarComprobantesOctubre();
