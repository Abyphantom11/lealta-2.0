// Script usando SQL directo
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticarConSQL() {
  console.log('🔍 DIAGNÓSTICO CON SQL DIRECTO\n');
  
  try {
    // Consulta SQL directa para contar promociones por negocio
    const resultados = await prisma.$queryRaw`
      SELECT 
        b.name as business_name,
        b.subdomain,
        b.id as business_id,
        COUNT(p.id) as total_promociones
      FROM "Business" b
      LEFT JOIN "Promotion" p ON b.id = p."businessId"
      WHERE b.name ILIKE '%Casa del Sabor%' 
         OR b.subdomain IN ('casa-sabor-demo', 'lacasadelsabor')
      GROUP BY b.id, b.name, b.subdomain
      ORDER BY total_promociones DESC
    `;

    console.log('📊 RESULTADOS:');
    
    for (const resultado of resultados) {
      console.log(`\n🏢 ${resultado.business_name}`);
      console.log(`   Subdomain: ${resultado.subdomain}`);
      console.log(`   ID: ${resultado.business_id}`);
      console.log(`   📊 Total promociones: ${resultado.total_promociones}`);

      if (resultado.total_promociones > 50) {
        console.log(`   🚨 ALERTA: Muchas promociones detectadas!`);

        // Buscar duplicados con SQL
        const duplicados = await prisma.$queryRaw`
          SELECT 
            title,
            COUNT(*) as duplicates
          FROM "Promotion"
          WHERE "businessId" = ${resultado.business_id}
          GROUP BY title
          HAVING COUNT(*) > 1
          ORDER BY duplicates DESC
          LIMIT 10
        `;

        if (duplicados.length > 0) {
          console.log(`   🔄 Títulos duplicados: ${duplicados.length}`);
          duplicados.forEach(dup => {
            console.log(`     - "${dup.title}" (${dup.duplicates} veces)`);
          });

          // Calcular total a eliminar
          const totalAEliminar = duplicados.reduce((sum, dup) => sum + (dup.duplicates - 1), 0);
          console.log(`   🗑️  Promociones a eliminar: ${totalAEliminar}`);
        }

        // Muestra de promociones recientes
        const recientes = await prisma.$queryRaw`
          SELECT title, "createdAt"
          FROM "Promotion"
          WHERE "businessId" = ${resultado.business_id}
          ORDER BY "createdAt" DESC
          LIMIT 5
        `;

        console.log(`   📝 Promociones recientes:`);
        recientes.forEach((promo, i) => {
          const fecha = new Date(promo.createdAt).toISOString().split('T')[0];
          console.log(`     ${i+1}. "${promo.title}" (${fecha})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔚 Diagnóstico completado');
  }
}

diagnosticarConSQL().catch(console.error);
