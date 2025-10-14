const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeTestBusinessClients() {
  try {
    console.log('🔍 Analizando todos los clientes del negocio de pruebas...\n');
    
    const testBusiness = await prisma.business.findFirst({
      where: { subdomain: 'casa-sabor-demo' }
    });
    
    if (!testBusiness) {
      console.log('❌ Negocio de pruebas no encontrado');
      return;
    }
    
    console.log(`📋 Negocio: ${testBusiness.name} (ID: ${testBusiness.id})`);
    
    // Obtener TODOS los clientes del negocio de pruebas
    const allClients = await prisma.cliente.findMany({
      where: { businessId: testBusiness.id },
      select: { 
        nombre: true, 
        cedula: true, 
        registeredAt: true,
        correo: true,
        telefono: true,
        puntos: true,
        totalVisitas: true
      },
      orderBy: { registeredAt: 'desc' }
    });
    
    console.log(`\n📊 Total de clientes: ${allClients.length}\n`);
    
    console.log('📝 Lista completa de clientes:');
    allClients.forEach((client, index) => {
      const date = client.registeredAt ? client.registeredAt.toLocaleDateString() : 'N/A';
      console.log(`${index + 1}. ${client.nombre} (${client.cedula})`);
      console.log(`   📅 Registrado: ${date}`);
      console.log(`   📧 Email: ${client.correo || 'N/A'}`);
      console.log(`   📞 Teléfono: ${client.telefono || 'N/A'}`);
      console.log(`   💰 Puntos: ${client.puntos}`);
      console.log(`   🏪 Visitas: ${client.totalVisitas}`);
      console.log('');
    });
    
    // Analizar patrones de nombres para detectar datos reales vs datos de prueba
    console.log('🕵️ Análisis de patrones:');
    
    const spanishTestNames = allClients.filter(c => 
      c.cedula.includes('A') || c.cedula.includes('B') || c.cedula.includes('C') || 
      c.cedula.includes('D') || c.cedula.includes('E') || c.cedula.includes('J')
    );
    
    const ecuadorianIds = allClients.filter(c => 
      /^\d{10}$/.test(c.cedula) && !c.cedula.includes('123456789')
    );
    
    const expressClients = allClients.filter(c => 
      c.nombre.toLowerCase().includes('express') || c.cedula === 'EXPRESS'
    );
    
    console.log(`  📋 Nombres con formato español (datos de prueba): ${spanishTestNames.length}`);
    console.log(`  🇪🇨 Cédulas ecuatorianas reales: ${ecuadorianIds.length}`);
    console.log(`  ⚡ Clientes Express: ${expressClients.length}`);
    
    if (ecuadorianIds.length > 0) {
      console.log('\n🇪🇨 Clientes con cédulas ecuatorianas (posibles datos reales):');
      ecuadorianIds.forEach(client => {
        const date = client.registeredAt ? client.registeredAt.toLocaleDateString() : 'N/A';
        console.log(`  - ${client.nombre} (${client.cedula}) - ${date}`);
      });
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

analyzeTestBusinessClients();
