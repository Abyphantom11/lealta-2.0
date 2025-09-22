/**
 * 🧹 LIMPIEZA DE PORTAL CONFIGS
 * Elimina todos los portal configs existentes para empezar limpio
 */

const { PrismaClient } = require('@prisma/client');

async function cleanupPortalConfigs() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 Iniciando limpieza de Portal Configs...\n');
    
    // 1. Contar configs existentes
    const countBefore = await prisma.portalConfig.count();
    console.log(`📊 Portal Configs encontrados: ${countBefore}`);
    
    if (countBefore === 0) {
      console.log('✅ No hay configs para eliminar');
      return;
    }
    
    // 2. Listar configs existentes (para debug)
    const existingConfigs = await prisma.portalConfig.findMany({
      select: {
        id: true,
        businessId: true,
        business: {
          select: {
            name: true,
            slug: true
          }
        },
        createdAt: true
      }
    });
    
    console.log('\n📋 Configs existentes:');
    existingConfigs.forEach((config, idx) => {
      console.log(`${idx + 1}. ID: ${config.id}`);
      console.log(`   Business: ${config.business?.name} (${config.business?.slug})`);
      console.log(`   Creado: ${config.createdAt}`);
      console.log('');
    });
    
    // 3. Eliminar todos los configs
    console.log('🗑️ Eliminando todos los Portal Configs...');
    const deleteResult = await prisma.portalConfig.deleteMany({});
    
    console.log(`✅ ${deleteResult.count} Portal Configs eliminados`);
    
    // 4. Verificar que se eliminaron
    const countAfter = await prisma.portalConfig.count();
    console.log(`📊 Portal Configs restantes: ${countAfter}`);
    
    if (countAfter === 0) {
      console.log('✅ LIMPIEZA COMPLETADA - Base de datos lista para empezar limpio');
    } else {
      console.log('⚠️ Aún quedan algunos configs');
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupPortalConfigs();
