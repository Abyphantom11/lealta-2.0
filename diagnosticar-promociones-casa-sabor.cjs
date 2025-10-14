// Script para diagnosticar y limpiar promociones duplicadas
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticarPromociones() {
  console.log('🔍 DIAGNÓSTICO DE PROMOCIONES - Casa del Sabor\n');
  
  try {
    // 1. Verificar el negocio Casa del Sabor
    const casaSabor = await prisma.business.findFirst({
      where: {
        OR: [
          { subdomain: 'casa-sabor-demo' },
          { name: { contains: 'Casa del Sabor', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!casaSabor) {
      console.log('❌ No se encontró el negocio Casa del Sabor');
      return;
    }
    
    console.log(`✅ Negocio encontrado: ${casaSabor.name} (ID: ${casaSabor.id})`);
    
    // 2. Contar promociones totales en la base de datos
    const totalPromociones = await prisma.promotion.count({
      where: {
        businessId: casaSabor.id
      }
    });
    
    console.log(`📊 Total de promociones en BD: ${totalPromociones}`);
    
    if (totalPromociones === 0) {
      console.log('✅ No hay promociones en la base de datos');
      return;
    }
    
    // 3. Obtener muestra de promociones para análisis
    const muestraPromociones = await prisma.promotion.findMany({
      where: {
        businessId: casaSabor.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log('\n📋 Muestra de promociones recientes:');
    muestraPromociones.forEach((promo, index) => {
      console.log(`${index + 1}. "${promo.title}" - Creado: ${promo.createdAt.toISOString()}`);
    });
    
    // 4. Buscar promociones duplicadas por título
    const promocionesDuplicadas = await prisma.promotion.groupBy({
      by: ['title'],
      where: {
        businessId: casaSabor.id
      },
      _count: {
        title: true
      },
      having: {
        title: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    console.log(`\n🔄 Títulos duplicados: ${promocionesDuplicadas.length}`);
    promocionesDuplicadas.forEach(dup => {
      console.log(`  - "${dup.title}": ${dup._count.title} veces`);
    });
    
    // 5. Analizar promociones por fecha de creación
    const promocionePorFecha = await prisma.promotion.groupBy({
      by: ['createdAt'],
      where: {
        businessId: casaSabor.id
      },
      _count: {
        createdAt: true
      },
      orderBy: {
        _count: {
          createdAt: 'desc'
        }
      },
      take: 5
    });
    
    console.log('\n📅 Fechas con más promociones:');
    promocionePorFecha.forEach(fecha => {
      console.log(`  - ${fecha.createdAt.toISOString()}: ${fecha._count.createdAt} promociones`);
    });
    
    return {
      total: totalPromociones,
      duplicadas: promocionesDuplicadas,
      businessId: casaSabor.id
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para limpiar promociones
async function limpiarPromociones(businessId, confirmar = false) {
  if (!confirmar) {
    console.log('\n⚠️ MODO SIMULACIÓN - No se eliminará nada');
    console.log('   Para eliminar realmente, ejecuta: limpiarPromociones(businessId, true)');
  }
  
  try {
    // Estrategia: Mantener solo la promoción más reciente de cada título
    console.log('\n🧹 Iniciando limpieza de promociones...');
    
    // 1. Obtener todas las promociones agrupadas por título
    const promociones = await prisma.promotion.findMany({
      where: {
        businessId: businessId
      },
      orderBy: [
        { title: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    const promocionesAMantener = new Map();
    const promocionesAEliminar = [];
    
    promociones.forEach(promo => {
      if (!promocionesAMantener.has(promo.title)) {
        // Mantener la primera (más reciente debido al orderBy)
        promocionesAMantener.set(promo.title, promo);
      } else {
        // Marcar para eliminación
        promocionesAEliminar.push(promo.id);
      }
    });
    
    console.log(`📊 Promociones únicas a mantener: ${promocionesAMantener.size}`);
    console.log(`🗑️ Promociones duplicadas a eliminar: ${promocionesAEliminar.length}`);
    
    if (confirmar && promocionesAEliminar.length > 0) {
      console.log('\n💥 ELIMINANDO promociones duplicadas...');
      
      const resultado = await prisma.promotion.deleteMany({
        where: {
          id: {
            in: promocionesAEliminar
          }
        }
      });
      
      console.log(`✅ Eliminadas ${resultado.count} promociones duplicadas`);
      
      // Verificar resultado final
      const totalFinal = await prisma.promotion.count({
        where: {
          businessId: businessId
        }
      });
      
      console.log(`📊 Total final de promociones: ${totalFinal}`);
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar diagnóstico
diagnosticarPromociones().then((resultado) => {
  if (resultado && resultado.total > 10) {
    console.log('\n🚨 RECOMENDACIÓN: Ejecutar limpieza de promociones');
    console.log('   El negocio tiene demasiadas promociones, posiblemente duplicadas');
    
    // Si se confirma la limpieza, ejecutar:
    // limpiarPromociones(resultado.businessId, true);
  }
});
