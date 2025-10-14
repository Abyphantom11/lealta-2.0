// Script simple para listar business IDs
const { PrismaClient } = require('@prisma/client');
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
    } else {
      console.log('❌ Casa Sabor no encontrado por nombre');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listBusinesses();
