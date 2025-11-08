const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarPromocionesActivo() {
  try {
    console.log('🔍 Verificando estado "active" de promociones\n');
    
    const business = await prisma.business.findFirst({
      where: { name: 'Demo Lealta' }
    });
    
    if (!business) {
      console.log('❌ No se encontró Demo Lealta');
      return;
    }
    
    console.log(`📊 Negocio: ${business.name}\n`);
    
    // Obtener TODAS las promociones (sin filtrar por active)
    const todasPromociones = await prisma.portalPromocion.findMany({
      where: { businessId: business.id },
      orderBy: { orden: 'asc' }
    });
    
    console.log(`📋 Total de promociones: ${todasPromociones.length}\n`);
    
    todasPromociones.forEach((promo, index) => {
      console.log(`${index + 1}. ${promo.title}`);
      console.log(`   ID: ${promo.id}`);
      console.log(`   Día: ${promo.dia}`);
      console.log(`   Active: ${promo.active}`);
      console.log(`   Descuento: ${promo.discount}`);
      console.log('');
    });
    
    // Contar activas vs inactivas
    const activas = todasPromociones.filter(p => p.active);
    const inactivas = todasPromociones.filter(p => !p.active);
    
    console.log(`✅ Activas: ${activas.length}`);
    console.log(`❌ Inactivas: ${inactivas.length}\n`);
    
    if (inactivas.length > 0) {
      console.log('🔧 ¿Quieres activar todas las promociones? (Solo para Demo)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPromocionesActivo();
