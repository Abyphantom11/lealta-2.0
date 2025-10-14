const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    console.log('🔍 Verificando negocios y clientes...\n');
    
    // 1. Verificar todos los negocios
    const businesses = await prisma.business.findMany();
    console.log('📋 Negocios encontrados:', businesses.length);
    
    businesses.forEach(business => {
      console.log(`  - ${business.name}`);
      console.log(`    ID: ${business.id}`);
      console.log(`    Subdomain: ${business.subdomain}`);
      console.log('');
    });
    
    // 2. Contar clientes por negocio
    console.log('📊 Conteo de clientes por negocio:');
    for (const business of businesses) {
      try {
        const count = await prisma.cliente.count({
          where: { businessId: business.id }
        });
        console.log(`  ${business.name}: ${count} clientes`);
      } catch (error) {
        console.log(`  ${business.name}: Error contando clientes`);
      }
    }
    
    // 3. Verificar el negocio de pruebas específicamente
    console.log('\n🧪 Verificando negocio de pruebas "casa-sabor-demo":');
    const testBusiness = await prisma.business.findFirst({
      where: { subdomain: 'casa-sabor-demo' }
    });
    
    if (testBusiness) {
      console.log('✅ Negocio de pruebas encontrado:', testBusiness.name);
      console.log('   ID:', testBusiness.id);
      
      const testClients = await prisma.cliente.findMany({
        where: { businessId: testBusiness.id },
        select: { nombre: true, cedula: true },
        take: 5
      });
      
      console.log(`   Clientes (mostrando primeros 5 de ${testClients.length}):`);
      testClients.forEach(client => {
        console.log(`     - ${client.nombre} (${client.cedula})`);
      });
    } else {
      console.log('❌ Negocio de pruebas no encontrado');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

checkBusinesses();
