// Script para encontrar y eliminar la promoción problemática
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Función para procesar una configuración individual
async function processConfig(config) {
  console.log(`\n📁 Config ID: ${config.id}, BusinessId: ${config.businessId}`);
  
  if (!config.promociones || !Array.isArray(config.promociones)) {
    console.log('   ℹ️ Sin promociones en esta configuración');
    return false;
  }

  console.log(`   🎯 Promociones: ${config.promociones.length}`);
  
  // Mostrar promociones y detectar problemática
  const hasProblematic = config.promociones.some((promo, index) => {
    console.log(`     ${index + 1}. "${promo.titulo}" - ${promo.descripcion}`);
    if (promo.titulo === '2x1 en Cócteles') {
      console.log('     ❌ ENCONTRADA PROMOCIÓN PROBLEMÁTICA');
      return true;
    }
    return false;
  });

  return hasProblematic ? await cleanPromotions(config) : false;
}

// Función para limpiar promociones
async function cleanPromotions(config) {
  const cleanPromos = config.promociones.filter(promo => 
    promo.titulo !== '2x1 en Cócteles'
  );

  console.log(`\n🧹 Limpiando promociones... ${config.promociones.length} → ${cleanPromos.length}`);
  
  await prisma.portalConfig.update({
    where: { id: config.id },
    data: { promociones: cleanPromos }
  });
  
  console.log('✅ Promoción eliminada de la base de datos');
  return true;
}

// Función para verificación final
async function verifyCleanup() {
  console.log('\n🔍 Verificación final...');
  
  const finalConfigs = await prisma.portalConfig.findMany();
  
  for (const config of finalConfigs) {
    if (config.promociones && Array.isArray(config.promociones)) {
      const hasProblematic = config.promociones.some(promo => 
        promo.titulo === '2x1 en Cócteles'
      );
      if (hasProblematic) {
        console.log(`❌ Promoción problemática TODAVÍA EXISTE en config ${config.id}`);
        return false;
      }
    }
  }
  
  console.log('✅ Promoción "2x1 en Cócteles" completamente eliminada');
  return true;
}

async function findAndCleanPromo() {
  try {
    console.log('🔍 Buscando promoción "2x1 en Cócteles"...\n');

    const allConfigs = await prisma.portalConfig.findMany();
    console.log(`📊 Configuraciones encontradas: ${allConfigs.length}`);

    // Procesar cada configuración
    for (const config of allConfigs) {
      await processConfig(config);
    }

    // Verificar limpieza
    await verifyCleanup();

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAndCleanPromo();
