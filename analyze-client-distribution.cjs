const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeClients() {
  try {
    console.log('🔍 Analizando distribución de clientes por negocio...\n');
    
    // Obtener todos los negocios
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true, subdomain: true }
    });
    
    console.log('📋 Negocios registrados:');
    businesses.forEach(b => {
      console.log(`  - ${b.name} (ID: ${b.id}, Subdomain: ${b.subdomain})`);
    });
    
    console.log('\n📊 Distribución de clientes:');
    
    for (const business of businesses) {
      const clientCount = await prisma.cliente.count({
        where: { businessId: business.id }
      });
      
      console.log(`  ${business.name}: ${clientCount} clientes`);
      
      if (clientCount > 0) {
        const sampleClients = await prisma.cliente.findMany({
          where: { businessId: business.id },
          select: { nombre: true, cedula: true },
          take: 3
        });
        
        const examples = sampleClients.map(c => `${c.nombre} (${c.cedula})`).join(', ');
        console.log(`    Ejemplos: ${examples}`);
      }
    }
    
    // Verificar si hay clientes sin businessId o con businessId inválido
    const orphanClients = await prisma.cliente.findMany({
      where: {
        OR: [
          { businessId: null },
          { businessId: '' },
          { 
            businessId: {
              notIn: businesses.map(b => b.id)
            }
          }
        ]
      },
      select: { nombre: true, cedula: true, businessId: true }
    });
    
    if (orphanClients.length > 0) {
      console.log(`\n⚠️  Clientes huérfanos encontrados (${orphanClients.length}):`);
      orphanClients.forEach(c => {
        console.log(`  - ${c.nombre} (${c.cedula}) -> businessId: ${c.businessId || 'NULL'}`);
      });
    }
    
    // Verificar específicamente el negocio de pruebas
    console.log('\n🧪 Análisis específico del negocio de pruebas:');
    const testBusiness = businesses.find(b => b.subdomain.includes('demo') || b.subdomain.includes('test'));
    if (testBusiness) {
      console.log(`Negocio de pruebas: ${testBusiness.name} (${testBusiness.id})`);
      
      const testClients = await prisma.cliente.findMany({
        where: { businessId: testBusiness.id },
        select: { nombre: true, cedula: true, registeredAt: true },
        orderBy: { registeredAt: 'desc' },
        take: 10
      });
      
      console.log(`Clientes recientes en ${testBusiness.name}:`);
      testClients.forEach(c => {
        const date = c.registeredAt ? c.registeredAt.toLocaleDateString() : 'N/A';
        console.log(`  - ${c.nombre} (${c.cedula}) - Registrado: ${date}`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

analyzeClients();
