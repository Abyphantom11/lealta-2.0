// Verificar businesses en la DB
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    console.log('🔍 Buscando businesses relacionados con Casa del Sabor...\n');
    
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { subdomain: 'casa-sabor-demo' },
          { subdomain: 'lacasadelsabor' }, 
          { name: { contains: 'Casa', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        isActive: true,
        slug: true
      }
    });

    console.log(`📋 Businesses encontrados: ${businesses.length}\n`);
    
    businesses.forEach(business => {
      console.log(`🏢 ${business.name}`);
      console.log(`   ID: ${business.id}`);
      console.log(`   Subdomain: ${business.subdomain}`);
      console.log(`   Slug: ${business.slug || 'N/A'}`);
      console.log(`   Activo: ${business.isActive ? '✅' : '❌'}`);
      console.log('');
    });

    // Verificar específicamente casa-sabor-demo
    const casaSaborDemo = await prisma.business.findFirst({
      where: { subdomain: 'casa-sabor-demo' }
    });

    if (casaSaborDemo) {
      console.log('✅ casa-sabor-demo encontrado:', casaSaborDemo.name);
    } else {
      console.log('❌ casa-sabor-demo NO encontrado');
      
      // Buscar alternativas
      const alternativas = await prisma.business.findMany({
        where: {
          name: { contains: 'sabor', mode: 'insensitive' }
        },
        select: { name: true, subdomain: true }
      });
      
      console.log('🔍 Alternativas con "sabor":', alternativas);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinesses();
