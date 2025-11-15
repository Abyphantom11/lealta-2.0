/**
 * Script para verificar si el pago de Paddle está en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubscription() {
  try {
    console.log('🔍 Buscando suscripciones de Paddle en la base de datos...\n');

    // Buscar todos los businesses con suscripción
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { subscriptionId: { not: null } },
          { subscriptionStatus: { not: null } },
        ]
      },
      select: {
        id: true,
        name: true,
        subscriptionId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialEndsAt: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        customerId: true,
        createdAt: true,
        User: {
          select: {
            email: true,
            name: true,
          },
          take: 1,
        }
      }
    });

    if (businesses.length === 0) {
      console.log('❌ No se encontraron negocios con suscripción de Paddle.');
      console.log('\n💡 Esto puede significar que:');
      console.log('   1. El webhook de Paddle aún no ha llegado');
      console.log('   2. No hay un webhook configurado');
      console.log('   3. El pago se procesó pero no se guardó en la DB\n');
    } else {
      console.log(`✅ Se encontraron ${businesses.length} negocio(s) con datos de Paddle:\n`);
      
      businesses.forEach((business, index) => {
        console.log(`📊 Negocio #${index + 1}:`);
        console.log(`   Nombre: ${business.name}`);
        console.log(`   ID: ${business.id}`);
        console.log(`   Email: ${business.User[0]?.email || 'N/A'}`);
        console.log(`   Usuario: ${business.User[0]?.name || 'N/A'}`);
        console.log(`   Subscription ID: ${business.subscriptionId || 'N/A'}`);
        console.log(`   Status: ${business.subscriptionStatus || 'N/A'}`);
        console.log(`   Plan: ${business.subscriptionPlan || 'N/A'}`);
        console.log(`   Customer ID: ${business.customerId || 'N/A'}`);
        console.log(`   Trial termina: ${business.trialEndsAt || 'N/A'}`);
        console.log(`   Suscripción inicia: ${business.subscriptionStartDate || 'N/A'}`);
        console.log(`   Suscripción termina: ${business.subscriptionEndDate || 'N/A'}`);
        console.log(`   Creado: ${business.createdAt}`);
        console.log('');
      });
    }

    // Buscar también por email del usuario
    console.log('🔍 Buscando por email abyphntom@gmail.com...\n');
    
    const userBusiness = await prisma.business.findFirst({
      where: {
        users: {
          some: {
            email: 'abyphntom@gmail.com'
          }
        }
      },
      include: {
        User: {
          select: {
            email: true,
            name: true,
          }
        }
      }
    });

    if (userBusiness) {
      console.log('✅ Negocio encontrado:');
      console.log(`   Nombre: ${userBusiness.name}`);
      console.log(`   Subscription ID: ${userBusiness.subscriptionId || '❌ NO REGISTRADO'}`);
      console.log(`   Status: ${userBusiness.subscriptionStatus || '❌ NO REGISTRADO'}`);
      console.log(`   Trial termina: ${userBusiness.trialEndsAt || 'N/A'}`);
      console.log('');

      if (!userBusiness.subscriptionId) {
        console.log('⚠️ El negocio existe pero NO tiene subscriptionId de Paddle.');
        console.log('💡 Esto significa que el webhook aún no ha actualizado la DB.\n');
      }
    } else {
      console.log('❌ No se encontró negocio con ese email.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscription();
