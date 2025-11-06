// Verificar PaymentHistory para La Casa del Sabor
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarPagos() {
  try {
    console.log('💳 Verificando historial de pagos...\n');
    
    const payments = await prisma.paymentHistory.findMany({
      where: {
        businessId: 'cmgf5o37a0000eyhgultn2kbf'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (payments.length === 0) {
      console.log('❌ No se encontraron pagos para La Casa del Sabor');
      return;
    }

    console.log(`✅ Encontrados ${payments.length} pago(s):\n`);
    
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. Pago ${payment.transactionId}`);
      console.log(`   Monto: $${payment.amount} ${payment.currency}`);
      console.log(`   Estado: ${payment.status}`);
      console.log(`   Suscripción: ${payment.subscriptionId || 'N/A'}`);
      console.log(`   Método: ${payment.paymentMethod}`);
      console.log(`   Fecha: ${payment.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPagos();
