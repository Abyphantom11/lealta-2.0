const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClients() {
  try {
    console.log('🔍 Verificando clientes en casa-sabor-demo...');
    
    const clients = await prisma.cliente.findMany({
      where: { 
        businessId: 'cmgf5px5f0000eyy0elci9yds' 
      },
      take: 10,
      orderBy: { registeredAt: 'desc' }
    });
    
    console.log(`📋 Clientes encontrados: ${clients.length}`);
    
    if (clients.length > 0) {
      console.log('\n🧑‍🤝‍🧑 Lista de clientes:');
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.nombre}`);
        console.log(`   📄 Cédula: ${client.cedula}`);
        console.log(`   💰 Puntos: ${client.puntos}`);
        console.log(`   📅 Registro: ${client.registeredAt?.toLocaleDateString() || 'N/A'}`);
        console.log('');
      });
      
      // Mostrar una cédula que no existe para probar clientes nuevos
      console.log('🆕 Para probar cliente nuevo, puedes usar una cédula como: 9999999999');
    } else {
      console.log('❌ No se encontraron clientes. El sistema creará clientes nuevos automáticamente.');
      console.log('🆕 Para probar, puedes usar cualquier cédula como: 1234567890');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClients();
