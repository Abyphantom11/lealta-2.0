// Script simple para listar business IDs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listBusinesses() {
  try {
    console.log('🏢 Listando todos los business en la BD...\n');
    
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true
      },
      take: 10
    });
    
    console.log(`Total businesses encontrados: ${businesses.length}\n`);
    
    businesses.forEach((business, i) => {
      console.log(`${i + 1}. ID: ${business.id}`);
      console.log(`   Nombre: ${business.name || 'Sin nombre'}\n`);
    });
    
    // Verificar si casa-sabor-demo existe
    const casaSabor = businesses.find(b => b.name?.toLowerCase().includes('casa') || b.name?.toLowerCase().includes('sabor'));
    if (casaSabor) {
      console.log(`✅ Casa Sabor encontrado: ${casaSabor.id}`);
      
      // Verificar promociones para este business
      const promociones = await prisma.portalPromocion.findMany({
        where: { businessId: casaSabor.id }
      });
      console.log(`🔥 Promociones para Casa Sabor: ${promociones.length}`);
      
    } else {
      console.log('❌ Casa Sabor no encontrado por nombre');
      
      // Si no encontramos por nombre, usar el ID que hemos estado usando
      const testBusinessId = 'cmfqhepmq0000ey4slyms4knv';
      console.log(`\n🧪 Probando con businessId: ${testBusinessId}`);
      
      const promociones = await prisma.portalPromocion.findMany({
        where: { businessId: testBusinessId }
      });
      console.log(`🔥 Promociones encontradas: ${promociones.length}`);
      
      if (promociones.length > 0) {
        console.log('📋 Promociones:');
        promociones.forEach((promo, i) => {
          console.log(`   ${i + 1}. ${promo.title} - ${promo.active ? 'activa' : 'inactiva'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listBusinesses();
