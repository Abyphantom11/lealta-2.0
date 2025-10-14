// Script para diagnóstico usando la configuración existente
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function diagnosticarPromociones() {
  console.log('🔍 DIAGNÓSTICO DE PROMOCIONES CASA DEL SABOR\n');
  
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
      console.log(`\n🏢 ${negocio.name}`);
      console.log(`   Subdomain: ${negocio.subdomain}`);
      console.log(`   ID: ${negocio.id}`);

      try {
        // Contar promociones
        const totalPromociones = await prisma.promotion.count({
          where: {
            businessId: negocio.id
          }
        });

        console.log(`   📊 Total promociones: ${totalPromociones}`);

        if (totalPromociones > 50) {
          console.log(`   🚨 ALERTA: Muchas promociones detectadas!`);
          
          // Obtener muestra reciente
          const muestraReciente = await prisma.promotion.findMany({
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
            take: 5
          });

          console.log(`   📝 Promociones más recientes:`);
          muestraReciente.forEach((promo, i) => {
            const fecha = promo.createdAt.toISOString().split('T')[0];
            console.log(`     ${i+1}. "${promo.title}" (${fecha})`);
          });

          // Buscar patrones de duplicados
          const promosTitulos = await prisma.promotion.findMany({
            where: {
              businessId: negocio.id
            },
            select: {
              title: true
            }
          });

          // Contar manualmente duplicados
          const conteoTitulos = {};
          promosTitulos.forEach(p => {
            if (conteoTitulos[p.title]) {
              conteoTitulos[p.title]++;
            } else {
              conteoTitulos[p.title] = 1;
            }
          });

          const duplicados = Object.entries(conteoTitulos)
            .filter(([titulo, count]) => count > 1)
            .sort((a, b) => b[1] - a[1]);

          if (duplicados.length > 0) {
            console.log(`   🔄 Duplicados encontrados: ${duplicados.length} títulos`);
            console.log(`   📋 Top duplicados:`);
            duplicados.slice(0, 3).forEach(([titulo, count]) => {
              console.log(`     - "${titulo}" (${count} veces)`);
            });

            // Calcular total de promociones duplicadas a eliminar
            const totalDuplicados = duplicados.reduce((sum, [_, count]) => sum + (count - 1), 0);
            console.log(`   🗑️  Promociones a eliminar: ${totalDuplicados}`);
            console.log(`   ✅ Promociones a mantener: ${totalPromociones - totalDuplicados}`);
          }
        }

      } catch (promoError) {
        console.log(`   ❌ Error al analizar promociones: ${promoError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔚 Diagnóstico completado');
  }
}

// Ejecutar
diagnosticarPromociones().catch(console.error);
