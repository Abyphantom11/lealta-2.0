// Script corregido para PortalPromocion
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticarPromociones() {
  console.log('🔍 DIAGNÓSTICO DE PORTAL PROMOCIONES\n');
  
  try {
    // Consulta SQL directa para contar promociones por negocio
    const resultados = await prisma.$queryRaw`
      SELECT 
        b.name as business_name,
        b.subdomain,
        b.id as business_id,
        COUNT(p.id) as total_promociones
      FROM "Business" b
      LEFT JOIN "PortalPromocion" p ON b.id = p."businessId"
      WHERE b.name ILIKE '%Casa del Sabor%' 
         OR b.subdomain IN ('casa-sabor-demo', 'lacasadelsabor')
      GROUP BY b.id, b.name, b.subdomain
      ORDER BY total_promociones DESC
    `;

    console.log('📊 RESULTADOS DE PROMOCIONES:');
    
    for (const resultado of resultados) {
      console.log(`\n🏢 ${resultado.business_name}`);
      console.log(`   Subdomain: ${resultado.subdomain}`);
      console.log(`   ID: ${resultado.business_id}`);
      console.log(`   📊 Total promociones: ${Number(resultado.total_promociones)}`);

      const totalPromociones = Number(resultado.total_promociones);

      if (totalPromociones > 20) {
        console.log(`   🚨 ALERTA: ${totalPromociones} promociones detectadas!`);

        // Buscar duplicados con SQL
        const duplicados = await prisma.$queryRaw`
          SELECT 
            title,
            COUNT(*) as duplicates
          FROM "PortalPromocion"
          WHERE "businessId" = ${resultado.business_id}
          GROUP BY title
          HAVING COUNT(*) > 1
          ORDER BY duplicates DESC
          LIMIT 10
        `;

        if (duplicados.length > 0) {
          console.log(`   🔄 Títulos duplicados: ${duplicados.length}`);
          let totalAEliminar = 0;
          
          duplicados.forEach(dup => {
            const cantidad = Number(dup.duplicates);
            console.log(`     - "${dup.title}" (${cantidad} veces)`);
            totalAEliminar += (cantidad - 1);
          });

          console.log(`   🗑️  Promociones duplicadas a eliminar: ${totalAEliminar}`);
          console.log(`   ✅ Promociones únicas a mantener: ${totalPromociones - totalAEliminar}`);

          // Mostrar el plan de limpieza
          if (totalAEliminar > 0) {
            console.log(`\n   📋 PLAN DE LIMPIEZA:`);
            console.log(`      1. Identificar duplicados por título`);
            console.log(`      2. Mantener solo la versión más reciente de cada título`);
            console.log(`      3. Eliminar ${totalAEliminar} promociones duplicadas`);
            console.log(`      4. Resultado: ${totalPromociones - totalAEliminar} promociones únicas`);
          }
        }

        // Muestra de promociones recientes
        const recientes = await prisma.$queryRaw`
          SELECT title, "createdAt", active
          FROM "PortalPromocion"
          WHERE "businessId" = ${resultado.business_id}
          ORDER BY "createdAt" DESC
          LIMIT 8
        `;

        console.log(`   📝 Promociones más recientes:`);
        recientes.forEach((promo, i) => {
          const fecha = new Date(promo.createdAt).toISOString().split('T')[0];
          const estado = promo.active ? '✅' : '❌';
          console.log(`     ${i+1}. "${promo.title}" (${fecha}) ${estado}`);
        });

        // Verificar si hay muchas promociones inactivas
        const inactivas = await prisma.$queryRaw`
          SELECT COUNT(*) as inactivas
          FROM "PortalPromocion"
          WHERE "businessId" = ${resultado.business_id} AND active = false
        `;

        const cantidadInactivas = Number(inactivas[0].inactivas);
        if (cantidadInactivas > 0) {
          console.log(`   💤 Promociones inactivas: ${cantidadInactivas}`);
        }

      } else if (totalPromociones > 0) {
        console.log(`   ✅ Cantidad normal de promociones`);
      } else {
        console.log(`   ⚠️  Sin promociones`);
      }
    }

    // Resumen general
    const totalGeneral = resultados.reduce((sum, r) => sum + Number(r.total_promociones), 0);
    console.log(`\n📊 RESUMEN GENERAL:`);
    console.log(`   Total promociones en todos los negocios Casa del Sabor: ${totalGeneral}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔚 Diagnóstico completado');
  }
}

diagnosticarPromociones().catch(console.error);
