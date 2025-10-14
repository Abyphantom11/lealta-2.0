// Diagnóstico simple usando el setup de Next.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnosticarPromociones() {
  console.log('🔍 DIAGNÓSTICO DE PROMOCIONES\n');
  
  try {
    // 1. Buscar negocios Casa del Sabor
    const negocios = await prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: 'Casa del Sabor', mode: 'insensitive' } },
          { subdomain: 'casa-sabor-demo' },
          { subdomain: 'lacasadelsabor' }
        ]
      }
    });
    
    console.log(`📋 Negocios encontrados: ${negocios.length}`);
    
    for (const negocio of negocios) {
      console.log(`\n🏢 ${negocio.name} (${negocio.subdomain}) - ID: ${negocio.id}`);
      
      try {
        // Contar promociones totales
        const totalPromociones = await prisma.promotion.count({
          where: {
            businessId: negocio.id
          }
        });
        
        console.log(`  📊 Total promociones: ${totalPromociones}`);
        
        if (totalPromociones > 100) {
          console.log(`  🚨 ALERTA: Demasiadas promociones (${totalPromociones})`);
          
          // Obtener muestra para análisis
          const promociones = await prisma.promotion.findMany({
            where: {
              businessId: negocio.id
            },
            select: {
              id: true,
              title: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 20
          });
          
          console.log('  📝 Muestra de promociones recientes:');
          promociones.slice(0, 5).forEach((promo, index) => {
            console.log(`    ${index + 1}. "${promo.title}" (${promo.createdAt.toISOString().split('T')[0]})`);
          });
          
          // Buscar duplicados por título
          const duplicados = await prisma.promotion.groupBy({
            by: ['title'],
            where: {
              businessId: negocio.id
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
          
          console.log(`  🔄 Títulos duplicados: ${duplicados.length}`);
          
          if (duplicados.length > 0) {
            console.log('  📋 Algunos títulos duplicados:');
            duplicados.slice(0, 3).forEach(dup => {
              console.log(`    - "${dup.title}" (${dup._count.title} veces)`);
            });
            
            console.log(`\n  💡 ¿Proceder con limpieza automática? (eliminará duplicados manteniendo el más reciente)`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error consultando promociones: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar diagnóstico
diagnosticarPromociones().catch(console.error);
