// Script simple para diagnosticar promociones
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticarSimple() {
  console.log('🔍 DIAGNÓSTICO SIMPLE DE PROMOCIONES\n');
  
  try {
    // 1. Buscar todos los negocios Casa del Sabor
    const negocios = await prisma.business.findMany({
      where: {
        OR: [
          { subdomain: 'casa-sabor-demo' },
          { subdomain: 'casasabordemo' },
          { name: { contains: 'Casa del Sabor', mode: 'insensitive' } },
          { name: { contains: 'Casa', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`📋 Negocios encontrados: ${negocios.length}`);
    negocios.forEach(negocio => {
      console.log(`  - ${negocio.name} (${negocio.subdomain}) - ID: ${negocio.id}`);
    });
    
    // 2. Para cada negocio, contar promociones
    for (const negocio of negocios) {
      console.log(`\n🔍 Analizando: ${negocio.name}`);
      
      try {
        // Contar promociones usando findMany y length
        const promociones = await prisma.promotion.findMany({
          where: {
            businessId: negocio.id
          },
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        });
        
        console.log(`  📊 Promociones: ${promociones.length}`);
        
        if (promociones.length > 100) {
          console.log(`  🚨 ALERTA: Demasiadas promociones (${promociones.length})`);
          
          // Mostrar muestra de títulos
          const muestra = promociones.slice(0, 5);
          console.log('  📋 Muestra de títulos:');
          muestra.forEach((promo, index) => {
            console.log(`    ${index + 1}. "${promo.title}"`);
          });
          
          // Verificar si son duplicados
          const titulos = promociones.map(p => p.title);
          const titulosUnicos = [...new Set(titulos)];
          console.log(`  🔄 Títulos únicos: ${titulosUnicos.length}`);
          console.log(`  🔄 Duplicados: ${promociones.length - titulosUnicos.length}`);
          
          return { 
            negocio, 
            total: promociones.length, 
            unicos: titulosUnicos.length,
            promociones: promociones
          };
        }
        
      } catch (error) {
        console.log(`  ❌ Error consultando promociones: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para eliminar promociones duplicadas
async function eliminarDuplicadas(businessId, promociones) {
  console.log('\n🧹 ELIMINANDO PROMOCIONES DUPLICADAS...');
  
  try {
    // Agrupar por título y mantener solo la más reciente
    const promocionesUnicas = new Map();
    
    promociones.forEach(promo => {
      const existing = promocionesUnicas.get(promo.title);
      if (!existing || promo.createdAt > existing.createdAt) {
        promocionesUnicas.set(promo.title, promo);
      }
    });
    
    const promocionesAMantener = Array.from(promocionesUnicas.values()).map(p => p.id);
    const promocionesAEliminar = promociones
      .filter(p => !promocionesAMantener.includes(p.id))
      .map(p => p.id);
    
    console.log(`📊 A mantener: ${promocionesAMantener.length}`);
    console.log(`🗑️ A eliminar: ${promocionesAEliminar.length}`);
    
    if (promocionesAEliminar.length > 0) {
      console.log('\n💥 Ejecutando eliminación...');
      
      // Eliminar en lotes para evitar problemas de memoria
      const batchSize = 100;
      let eliminadas = 0;
      
      for (let i = 0; i < promocionesAEliminar.length; i += batchSize) {
        const batch = promocionesAEliminar.slice(i, i + batchSize);
        
        await prisma.promotion.deleteMany({
          where: {
            id: {
              in: batch
            }
          }
        });
        
        eliminadas += batch.length;
        console.log(`  ✅ Eliminadas ${eliminadas}/${promocionesAEliminar.length} promociones`);
      }
      
      console.log(`\n🎉 Limpieza completada! Eliminadas ${eliminadas} promociones duplicadas`);
    }
    
  } catch (error) {
    console.error('❌ Error eliminando:', error);
  }
}

// Ejecutar diagnóstico
diagnosticarSimple().then((resultado) => {
  if (resultado && resultado.total > 100) {
    console.log('\n❓ ¿Quieres eliminar las promociones duplicadas? (y/n)');
    console.log('   Para confirmar, ejecuta manualmente:');
    console.log(`   eliminarDuplicadas("${resultado.negocio.id}", promociones)`);
    
    // Exportar función para uso manual
    global.eliminarDuplicadas = eliminarDuplicadas;
    global.resultadoDiagnostico = resultado;
  }
});
