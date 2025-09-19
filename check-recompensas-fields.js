const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecompensasFields() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🔍 Verificando campos de recompensas...');
    
    const recompensas = await prisma.portalRecompensa.findMany({
      where: { businessId }
    });
    
    recompensas.forEach(r => {
      console.log(`\n📋 Recompensa: ${r.title}`);
      console.log(`   - unlimited: ${r.unlimited}`);
      console.log(`   - stock: ${r.stock}`);
      console.log(`   - active: ${r.active}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecompensasFields();
