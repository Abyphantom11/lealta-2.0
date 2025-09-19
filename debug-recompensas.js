const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugRecompensas() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🔍 Depurando recompensas en PostgreSQL...');
    
    // Verificar datos en PostgreSQL
    const recompensasDB = await prisma.portalRecompensa.findMany({
      where: { businessId }
    });
    
    console.log(`\n📊 Recompensas en la base de datos: ${recompensasDB.length}`);
    recompensasDB.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     ID: ${r.id}`);
      console.log(`     Activo: ${r.active}`);
      console.log(`     Puntos: ${r.pointsCost}`);
      console.log(`     Business: ${r.businessId}`);
      console.log('');
    });
    
    // Verificar si hay algún filtro que las esté excluyendo
    const recompensasActivas = await prisma.portalRecompensa.findMany({
      where: { 
        businessId,
        active: true
      }
    });
    
    console.log(`\n🎯 Recompensas activas: ${recompensasActivas.length}`);
    
    // Verificar todas las recompensas sin filtros
    const todasRecompensas = await prisma.portalRecompensa.findMany();
    console.log(`\n📋 Total de recompensas en toda la BD: ${todasRecompensas.length}`);
    todasRecompensas.forEach(r => {
      console.log(`  - ${r.title} (business: ${r.businessId}, activo: ${r.active})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRecompensas();
