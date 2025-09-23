/**
 * 🔍 DIAGNÓSTICO: Verificar estado de ambas bases de datos
 */

import { PrismaClient } from '@prisma/client';

// Base de datos LOCAL (la que usas en desarrollo)
const prismaLocal = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_FSM59yCGwBeE@ep-dark-glitter-adgpeao8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

// Base de datos PRODUCCIÓN (la que está en Vercel)
const prismaProduction = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_XcL6eWBCMz9b@ep-floral-morning-ad47ojau-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

async function diagnosticoDatabases() {
  console.log('🔍 DIAGNÓSTICO DE BASES DE DATOS');
  console.log('=====================================');

  try {
    // Verificar base de datos LOCAL
    console.log('\n📱 BASE DE DATOS LOCAL:');
    const businessesLocal = await prismaLocal.business.count();
    const usersLocal = await prismaLocal.user.count();
    const clientesLocal = await prismaLocal.cliente.count();
    const consumosLocal = await prismaLocal.consumo.count();

    console.log(`   • Businesses: ${businessesLocal}`);
    console.log(`   • Users: ${usersLocal}`);
    console.log(`   • Clientes: ${clientesLocal}`);
    console.log(`   • Consumos: ${consumosLocal}`);

    if (clientesLocal > 0) {
      const clientes = await prismaLocal.cliente.findMany({
        take: 3,
        select: {
          nombre: true,
          cedula: true
        }
      });
      console.log(`   • Clientes registrados:`, clientes);
    }

  } catch (error) {
    console.error('❌ Error en base local:', error.message);
  }

  try {
    // Verificar base de datos PRODUCCIÓN
    console.log('\n🌐 BASE DE DATOS PRODUCCIÓN:');
    const businessesProd = await prismaProduction.business.count();
    const usersProd = await prismaProduction.user.count();
    const clientesProd = await prismaProduction.cliente.count();
    const consumosProd = await prismaProduction.consumo.count();

    console.log(`   • Businesses: ${businessesProd}`);
    console.log(`   • Users: ${usersProd}`);
    console.log(`   • Clientes: ${clientesProd}`);
    console.log(`   • Consumos: ${consumosProd}`);

    if (clientesProd > 0) {
      const clientes = await prismaProduction.cliente.findMany({
        take: 3,
        select: {
          nombre: true,
          cedula: true
        }
      });
      console.log(`   • Clientes registrados:`, clientes);
    }

  } catch (error) {
    console.error('❌ Error en base producción:', error.message);
  }

  console.log('\n🎯 CONCLUSIÓN:');
  console.log('El usuario "yoyo" probablemente está en la base LOCAL.');
  console.log('El dashboard muestra datos de la base PRODUCCIÓN.');
  console.log('Necesitamos poblar la base de PRODUCCIÓN para la demo.');

  await prismaLocal.$disconnect();
  await prismaProduction.$disconnect();
}

diagnosticoDatabases().catch(console.error);
