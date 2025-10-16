const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBusinesses() {
  console.log('🔍 Verificando businesses y reservas...');
  
  try {
    // 1. Listar todos los businesses
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    console.log('🏢 Businesses encontrados:', businesses);
    
    // 2. Si hay businesses, buscar reservas en cada uno
    for (const business of businesses) {
      console.log(`\n📋 Buscando reservas en ${business.name} (${business.id}):`);
      
      const reservas = await prisma.reservation.findMany({
        where: {
          businessId: business.id
        },
        select: {
          id: true,
          customerName: true,
          reservedAt: true
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`  Total de reservas: ${reservas.length}`);
      
      for (const r of reservas) {
        console.log(`  - ${r.id}: ${r.customerName} - ${r.reservedAt.toISOString().split('T')[0]}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinesses();
