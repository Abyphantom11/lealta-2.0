const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReservasData() {
  try {
    // Buscar business por slug casa-sabor-demo
    const business = await prisma.business.findFirst({
      where: { 
        OR: [
          { slug: 'casa-sabor-demo' },
          { subdomain: 'casa-sabor-demo' },
          { name: { contains: 'casa', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!business) {
      console.log('❌ No se encontró el business casa-sabor-demo');
      return;
    }
    
    console.log('🏢 Business encontrado:');
    console.log('   ID:', business.id);
    console.log('   Name:', business.name);
    console.log('   Slug:', business.slug);
    console.log('   Subdomain:', business.subdomain);
    
    // Verificar reservas para este business
    const reservas = await prisma.reservation.findMany({
      where: { businessId: business.id },
      include: {
        cliente: true,
        service: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('\n📋 Reservas encontradas:', reservas.length);
    
    if (reservas.length > 0) {
      console.log('\n🔍 Últimas 5 reservas:');
      reservas.slice(0, 5).forEach((reserva, idx) => {
        console.log(`   ${idx + 1}. ID: ${reserva.id}`);
        console.log(`      Cliente: ${reserva.cliente?.nombre || 'N/A'}`);
        console.log(`      Servicio: ${reserva.service?.name || 'N/A'}`);
        console.log(`      Fecha: ${reserva.reservedAt}`);
        console.log(`      Estado: ${reserva.status}`);
        console.log('      ---');
      });
    } else {
      console.log('ℹ️ No hay reservas para este business');
    }
    
    // También verificar clientes
    const clientes = await prisma.cliente.findMany({
      where: { businessId: business.id },
      take: 5
    });
    
    console.log(`\n👥 Clientes encontrados: ${clientes.length}`);
    
    // Verificar servicios
    const servicios = await prisma.service.findMany({
      where: { businessId: business.id },
      take: 5
    });
    
    console.log(`🛍️ Servicios encontrados: ${servicios.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkReservasData();
