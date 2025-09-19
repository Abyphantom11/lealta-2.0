const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingPromociones() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🔄 Actualizando promociones existentes...');
    
    // Obtener promociones sin campo dia
    const promociones = await prisma.portalPromocion.findMany({
      where: { 
        businessId,
        dia: null
      }
    });
    
    console.log(`📊 Promociones a actualizar: ${promociones.length}`);
    
    for (const promo of promociones) {
      console.log(`🔧 Actualizando promoción: ${promo.title}`);
      
      await prisma.portalPromocion.update({
        where: { id: promo.id },
        data: { 
          dia: 'viernes' // Asignar viernes como día por defecto
        }
      });
      
      console.log(`✅ ${promo.title} ahora está asignada a viernes`);
    }
    
    console.log('\n🎉 ¡Todas las promociones han sido actualizadas!');
    
    // Verificar el resultado
    const promocionesActualizadas = await prisma.portalPromocion.findMany({
      where: { businessId }
    });
    
    console.log('\n📋 Estado final:');
    promocionesActualizadas.forEach(p => {
      console.log(`  - ${p.title}: ${p.dia}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingPromociones();
