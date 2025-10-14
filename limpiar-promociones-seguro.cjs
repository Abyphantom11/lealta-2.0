// Script de limpieza de promociones duplicadas
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function limpiarPromocionesSeguro() {
  console.log('🧹 LIMPIEZA SEGURA DE PROMOCIONES DUPLICADAS\n');
  
  try {
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa del Sabor - Demo
    
    console.log('🔍 Analizando duplicados...');
    
    // 1. Encontrar todos los títulos duplicados
    const duplicados = await prisma.$queryRaw`
      SELECT 
        title,
        COUNT(*) as cantidad
      FROM "PortalPromocion"
      WHERE "businessId" = ${businessId}
      GROUP BY title
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC
    `;
    
    console.log(`📋 Títulos duplicados encontrados: ${duplicados.length}`);
    
    let totalEliminados = 0;
    
    for (const duplicado of duplicados) {
      const titulo = duplicado.title;
      const cantidad = Number(duplicado.cantidad);
      
      console.log(`\n🔄 Procesando: "${titulo}" (${cantidad} copias)`);
      
      // 2. Obtener todas las promociones de este título ordenadas por fecha (más reciente primero)
      const promociones = await prisma.portalPromocion.findMany({
        where: {
          businessId: businessId,
          title: titulo
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (promociones.length > 1) {
        // Mantener solo la primera (más reciente) y eliminar el resto
        const aMantener = promociones[0];
        const aEliminar = promociones.slice(1);
        
        console.log(`   ✅ Manteniendo: ID ${aMantener.id} (${aMantener.createdAt.toISOString()})`);
        console.log(`   🗑️  Eliminando: ${aEliminar.length} copias`);
        
        // Eliminar en lotes para evitar problemas de memoria
        const batchSize = 100;
        for (let i = 0; i < aEliminar.length; i += batchSize) {
          const batch = aEliminar.slice(i, i + batchSize);
          const ids = batch.map(p => p.id);
          
          const resultado = await prisma.portalPromocion.deleteMany({
            where: {
              id: {
                in: ids
              }
            }
          });
          
          totalEliminados += resultado.count;
          console.log(`     📦 Lote eliminado: ${resultado.count} promociones`);
        }
        
        console.log(`   ✅ Completado para "${titulo}"`);
      }
    }
    
    // 3. Verificar resultado final
    const totalFinal = await prisma.portalPromocion.count({
      where: {
        businessId: businessId
      }
    });
    
    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`   🗑️  Total eliminado: ${totalEliminados} promociones`);
    console.log(`   ✅ Total restante: ${totalFinal} promociones`);
    console.log(`   📈 Reducción: ${((totalEliminados / (totalEliminados + totalFinal)) * 100).toFixed(1)}%`);
    
    // 4. Mostrar promociones finales
    const promocionesFinal = await prisma.portalPromocion.findMany({
      where: {
        businessId: businessId
      },
      select: {
        title: true,
        createdAt: true,
        active: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📝 PROMOCIONES FINALES:`);
    promocionesFinal.forEach((promo, i) => {
      const fecha = promo.createdAt.toISOString().split('T')[0];
      const estado = promo.active ? '✅' : '❌';
      console.log(`   ${i+1}. "${promo.title}" (${fecha}) ${estado}`);
    });
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔚 Limpieza completada');
  }
}

// Ejecutar con confirmación de seguridad
console.log('⚠️  ADVERTENCIA: Este script eliminará promociones duplicadas.');
console.log('   Solo mantendrá la versión más reciente de cada título.');
console.log('   Proceder en 3 segundos...\n');

setTimeout(() => {
  limpiarPromocionesSeguro().catch(console.error);
}, 3000);
