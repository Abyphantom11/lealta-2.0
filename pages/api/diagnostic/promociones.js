// pages/api/diagnostic/promociones.js
import { prisma } from '../../../src/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('🔍 INICIANDO DIAGNÓSTICO DE PROMOCIONES');

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

    const resultados = [];

    for (const negocio of negocios) {
      console.log(`\n🏢 Analizando: ${negocio.name} (${negocio.subdomain})`);

      try {
        // Contar promociones totales
        const totalPromociones = await prisma.portalPromocion.count({
          where: {
            businessId: negocio.id
          }
        });

        console.log(`  📊 Total promociones: ${totalPromociones}`);

        const resultado = {
          negocio: negocio.name,
          subdomain: negocio.subdomain,
          businessId: negocio.id,
          totalPromociones,
          duplicados: [],
          muestraPromociones: []
        };

        if (totalPromociones > 100) {
          console.log(`  🚨 ALERTA: Demasiadas promociones (${totalPromociones})`);

          // Obtener muestra de promociones
          const promociones = await prisma.portalPromocion.findMany({
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
            take: 10
          });

          resultado.muestraPromociones = promociones.slice(0, 5).map(p => ({
            title: p.title,
            createdAt: p.createdAt
          }));

          // Buscar duplicados por título
          const duplicados = await prisma.portalPromocion.groupBy({
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

          resultado.duplicados = duplicados.map(d => ({
            title: d.title,
            count: d._count.title
          }));

          console.log(`  🔄 Títulos duplicados: ${duplicados.length}`);
        }

        resultados.push(resultado);

      } catch (error) {
        console.log(`  ❌ Error con negocio ${negocio.name}: ${error.message}`);
        resultados.push({
          negocio: negocio.name,
          subdomain: negocio.subdomain,
          businessId: negocio.id,
          error: error.message
        });
      }
    }

    console.log('\n✅ Diagnóstico completado');

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      resultados
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({ 
      error: 'Error en diagnóstico', 
      details: error.message 
    });
  }
}
