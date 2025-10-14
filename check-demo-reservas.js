const { PrismaClient } = require('@prisma/client');

async function checkDemoBusinessReservas() {
  const prisma = new PrismaClient();
  
  try {
    const demoBusinessId = 'cmgf5px5f0000eyy0elci9yds'; // La Casa del Sabor - Demo
    
    console.log('🔍 Verificando reservas para business Demo:', demoBusinessId);
    
    // Contar reservas
    const reservasCount = await prisma.reserva.count({
      where: { businessId: demoBusinessId }
    });
    
    console.log('📊 Total reservas:', reservasCount);
    
    if (reservasCount > 0) {
      // Obtener algunas reservas para verificar
      const reservas = await prisma.reserva.findMany({
        where: { businessId: demoBusinessId },
        take: 5,
        select: {
          id: true,
          clientName: true,
          date: true,
          time: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('📋 Últimas 5 reservas:');
      reservas.forEach(r => {
        console.log(`   - ${r.clientName} | ${r.date} ${r.time} | ${r.status}`);
      });
    }
    
    // Verificar clientes
    const clientsCount = await prisma.client.count({
      where: { businessId: demoBusinessId }
    });
    
    console.log('👥 Total clientes:', clientsCount);
    
    // Verificar business existe y su configuración
    const business = await prisma.business.findUnique({
      where: { id: demoBusinessId },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        active: true
      }
    });
    
    console.log('🏢 Business details:', business);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDemoBusinessReservas();
