#!/usr/bin/env node
/**
 * Script para resetear la base de datos de producción de forma segura
 * ⚠️ USAR CON EXTREMA PRECAUCIÓN - BORRA TODOS LOS DATOS
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetProductionDatabase() {
  console.log('⚠️  RESETEO DE BASE DE DATOS DE PRODUCCIÓN');
  console.log('==========================================');
  console.log('🚨 ADVERTENCIA: Esto borrará TODOS los datos');
  console.log('🔍 Verificando conexión...');

  try {
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos');

    // Mostrar estado actual
    const counts = {
      businesses: await prisma.business.count(),
      users: await prisma.user.count(),
      clientes: await prisma.cliente.count(),
      consumos: await prisma.consumo.count(),
      tarjetas: await prisma.tarjetaLealtad.count(),
    };

    console.log('\n📊 Estado actual:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} registros`);
    });

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
    if (totalRecords === 0) {
      console.log('\n✅ La base de datos ya está limpia');
      return;
    }

    console.log(`\n🗑️  Iniciando borrado de ${totalRecords} registros...`);

    // Borrar en orden correcto (respetando foreign keys)
    console.log('🔄 Borrando consumos...');
    await prisma.consumo.deleteMany({});

    console.log('🔄 Borrando tarjetas de lealtad...');
    await prisma.tarjetaLealtad.deleteMany({});

    console.log('🔄 Borrando historial de canjes...');
    await prisma.historialCanje.deleteMany({});

    console.log('🔄 Borrando visitas...');
    await prisma.visita.deleteMany({});

    console.log('🔄 Borrando visit logs...');
    await prisma.visitLog.deleteMany({});

    console.log('🔄 Borrando clientes...');
    await prisma.cliente.deleteMany({});

    console.log('🔄 Borrando configuración del portal...');
    await prisma.portalBanner.deleteMany({});
    await prisma.portalPromocion.deleteMany({});
    await prisma.portalRecompensa.deleteMany({});
    await prisma.portalFavoritoDelDia.deleteMany({});
    await prisma.portalTarjetasConfig.deleteMany({});

    console.log('🔄 Borrando configuración de branding...');
    await prisma.brandingConfig.deleteMany({});

    console.log('🔄 Borrando menú...');
    await prisma.menuProduct.deleteMany({});
    await prisma.menuCategory.deleteMany({});

    console.log('🔄 Borrando goals...');
    await prisma.businessGoals.deleteMany({});

    console.log('🔄 Borrando usuarios...');
    await prisma.user.deleteMany({});

    console.log('🔄 Borrando ubicaciones...');
    await prisma.location.deleteMany({});

    console.log('🔄 Borrando businesses...');
    await prisma.business.deleteMany({});

    console.log('\n✅ ¡Base de datos completamente limpia!');
    console.log('🎯 Lista para crear datos frescos de presentación');

    // Verificar que esté limpia
    const finalCounts = {
      businesses: await prisma.business.count(),
      users: await prisma.user.count(),
      clientes: await prisma.cliente.count(),
      consumos: await prisma.consumo.count(),
      tarjetas: await prisma.tarjetaLealtad.count(),
    };

    const finalTotal = Object.values(finalCounts).reduce((sum, count) => sum + count, 0);
    
    if (finalTotal === 0) {
      console.log('\n🎉 Verificación exitosa: 0 registros restantes');
    } else {
      console.log(`\n⚠️ Advertencia: Aún quedan ${finalTotal} registros`);
    }

  } catch (error) {
    console.error('❌ Error durante el reseteo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  resetProductionDatabase()
    .then(() => {
      console.log('\n🚀 Reseteo completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error durante reseteo:', error);
      process.exit(1);
    });
}

module.exports = { resetProductionDatabase };