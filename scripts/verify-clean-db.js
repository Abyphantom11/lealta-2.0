#!/usr/bin/env node
/**
 * Script para verificar que la base de datos esté limpia
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyCleanDatabase() {
  console.log('🔍 Verificando estado de la base de datos...');

  try {
    // Contar registros en todas las tablas principales
    const counts = {
      businesses: await prisma.business.count(),
      users: await prisma.user.count(),
      clientes: await prisma.cliente.count(),
      consumos: await prisma.consumo.count(),
      tarjetas: await prisma.tarjetaLealtad.count(),
      locations: await prisma.location.count(),
      banners: await prisma.portalBanner.count(),
      promociones: await prisma.portalPromocion.count(),
      recompensas: await prisma.portalRecompensa.count(),
      favoritos: await prisma.portalFavoritoDelDia.count(),
      branding: await prisma.brandingConfig.count(),
    };

    console.log('\n📊 Estado actual de la base de datos:');
    console.log('=====================================');
    
    Object.entries(counts).forEach(([table, count]) => {
      const icon = count === 0 ? '✅' : '⚠️';
      console.log(`${icon} ${table}: ${count} registros`);
    });

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
    if (totalRecords === 0) {
      console.log('\n🎉 ¡Base de datos completamente limpia!');
      console.log('✅ Lista para crear datos de demo frescos');
    } else {
      console.log(`\n⚠️ Base de datos contiene ${totalRecords} registros`);
      console.log('💡 Considera hacer un reset si necesitas empezar limpio');
    }

  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  verifyCleanDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { verifyCleanDatabase };