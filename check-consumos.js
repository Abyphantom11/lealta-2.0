const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkConsumos() {
  try {
    console.log('🔍 Revisando estructura de consumos...');
    
    const consumos = await prisma.consumo.findMany({
      take: 3,
      orderBy: { registeredAt: 'desc' }
    });
    
    console.log(`📊 Total de consumos encontrados: ${consumos.length}`);
    
    consumos.forEach((consumo, index) => {
      console.log(`\n=== CONSUMO ${index + 1} ===`);
      console.log('ID:', consumo.id);
      console.log('Fecha:', consumo.registeredAt);
      console.log('BusinessId:', consumo.businessId);
      console.log('Total:', consumo.total);
      console.log('Productos tipo:', typeof consumo.productos);
      console.log('Productos JSON:', JSON.stringify(consumo.productos, null, 2));
      
      if (consumo.productos) {
        console.log('Productos es array:', Array.isArray(consumo.productos));
        if (Array.isArray(consumo.productos)) {
          console.log('Primer producto:', JSON.stringify(consumo.productos[0], null, 2));
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConsumos();
