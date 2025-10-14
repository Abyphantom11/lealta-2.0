const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugClientLookup() {
  try {
    // Simular la búsqueda que hace el API
    const cedula = '1762075776'; // Cédula que usaste antes
    
    console.log(`🔍 Buscando cliente con cédula: ${cedula}\n`);
    
    // Buscar en todos los negocios
    console.log('📋 Búsqueda por negocio:');
    const businesses = await prisma.business.findMany();
    
    for (const business of businesses) {
      const cliente = await prisma.cliente.findFirst({
        where: { 
          cedula: cedula,
          businessId: business.id
        }
      });
      
      if (cliente) {
        console.log(`✅ ENCONTRADO en ${business.name} (${business.subdomain}):`);
        console.log(`   Cliente: ${cliente.nombre}`);
        console.log(`   Business ID: ${cliente.businessId}`);
        console.log(`   Puntos: ${cliente.puntos}`);
      } else {
        console.log(`❌ NO encontrado en ${business.name} (${business.subdomain})`);
      }
    }
    
    // Mostrar qué BusinessId usa cada negocio
    console.log('\n🏢 IDs de negocios:');
    businesses.forEach(b => {
      console.log(`   ${b.name}: ${b.id} (${b.subdomain})`);
    });
    
    // Simular búsqueda con fallback como en el API
    console.log('\n🔧 Simulando búsqueda del API:');
    
    // Buscar con casa-sabor-demo (negocio de pruebas)
    const clienteDemo = await prisma.cliente.findFirst({
      where: { 
        cedula: cedula,
        businessId: 'cmgf5px5f0000eyy0elci9yds' // casa-sabor-demo
      }
    });
    
    if (clienteDemo) {
      console.log('✅ Encontrado con businessId casa-sabor-demo');
    } else {
      console.log('❌ NO encontrado con businessId casa-sabor-demo');
    }
    
    // Buscar con lacasadelsabor (negocio real)
    const clienteReal = await prisma.cliente.findFirst({
      where: { 
        cedula: cedula,
        businessId: 'cmgf5o37a0000eyhgultn2kbf' // lacasadelsabor
      }
    });
    
    if (clienteReal) {
      console.log('✅ Encontrado con businessId lacasadelsabor');
    } else {
      console.log('❌ NO encontrado con businessId lacasadelsabor');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

debugClientLookup();
