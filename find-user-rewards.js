const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findUserRewards() {
  try {
    console.log('🔍 Buscando todas las recompensas con títulos "dsfsf" y "werwr"...');
    
    // Buscar recompensas por título
    const recompensasDsfsf = await prisma.portalRecompensa.findMany({
      where: {
        title: { contains: 'dsfsf' }
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
    
    const recompensasWerwr = await prisma.portalRecompensa.findMany({
      where: {
        title: { contains: 'werwr' }
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
    
    console.log('\n🎯 Recompensas encontradas con "dsfsf":');
    recompensasDsfsf.forEach(r => {
      console.log(`  - ID: ${r.id}`);
      console.log(`  - Título: ${r.title}`);
      console.log(`  - Puntos: ${r.pointsCost}`);
      console.log(`  - Activo: ${r.active}`);
      console.log(`  - Business ID: ${r.businessId}`);
      console.log(`  - Business: ${r.business.name} (${r.business.slug})`);
      console.log('  ---');
    });
    
    console.log('\n🎯 Recompensas encontradas con "werwr":');
    recompensasWerwr.forEach(r => {
      console.log(`  - ID: ${r.id}`);
      console.log(`  - Título: ${r.title}`);
      console.log(`  - Puntos: ${r.pointsCost}`);
      console.log(`  - Activo: ${r.active}`);
      console.log(`  - Business ID: ${r.businessId}`);
      console.log(`  - Business: ${r.business.name} (${r.business.slug})`);
      console.log('  ---');
    });
    
    // También buscar todos los businesses para ver cuál está siendo usado
    console.log('\n🏢 Todos los businesses en la base de datos:');
    const allBusinesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true
      }
    });
    
    allBusinesses.forEach(b => {
      console.log(`  - ${b.name} (${b.slug})`);
      console.log(`    ID: ${b.id}`);
      console.log(`    Subdomain: ${b.subdomain}`);
      console.log('    ---');
    });
    
  } catch (error) {
    console.error('❌ Error buscando recompensas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findUserRewards();
