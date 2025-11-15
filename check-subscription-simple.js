/**
 * Script simple para verificar suscripciones de Paddle
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando suscripciones de Paddle...\n');

  // Buscar por email específico
  const user = await prisma.user.findFirst({
    where: { email: 'abyphntom@gmail.com' },
    include: {
      business: true
    }
  });

  if (!user) {
    console.log('❌ No se encontró usuario con email: abyphntom@gmail.com\n');
    return;
  }

  console.log('✅ Usuario encontrado:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Nombre: ${user.name}`);
  console.log(`   Business ID: ${user.businessId}\n`);

  if (user.business) {
    console.log('📊 Datos del Negocio:');
    console.log(`   Nombre: ${user.business.name}`);
    console.log(`   Subscription ID: ${user.business.subscriptionId || '❌ NO CONFIGURADO'}`);
    console.log(`   Subscription Status: ${user.business.subscriptionStatus || '❌ NO CONFIGURADO'}`);
    console.log(`   Plan: ${user.business.subscriptionPlan}`);
    console.log(`   Customer ID: ${user.business.customerId || 'N/A'}`);
    console.log(`   Trial termina: ${user.business.trialEndsAt}`);
    console.log(`   Suscripción inicia: ${user.business.subscriptionStartDate || 'N/A'}`);
    console.log(`   Suscripción termina: ${user.business.subscriptionEndDate || 'N/A'}`);
    console.log('');

    if (!user.business.subscriptionId) {
      console.log('⚠️  EL PAGO NO ESTÁ REGISTRADO EN LA BASE DE DATOS');
      console.log('💡 Esto significa que el webhook de Paddle NO ha actualizado la DB.\n');
      console.log('📝 Para registrar el pago manualmente, necesitas:');
      console.log('   1. El Subscription ID de Paddle (sub_xxx)');
      console.log('   2. Configurar el webhook de Paddle');
      console.log('   3. O actualizar manualmente la DB\n');
    } else {
      console.log('✅ PAGO REGISTRADO CORRECTAMENTE EN LA DB\n');
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
