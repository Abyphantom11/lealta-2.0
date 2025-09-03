const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTipoProducto() {
  try {
    const products = await prisma.menuProduct.findMany({
      select: {
        nombre: true,
        tipoProducto: true
      }
    });
    
    console.log('Productos y sus tipos:');
    products.forEach(product => {
      console.log(`- ${product.nombre}: ${product.tipoProducto}`);
    });

    // Obtener tipos únicos
    const tiposUnicos = [...new Set(products.map(p => p.tipoProducto))];
    console.log('\nTipos únicos encontrados:', tiposUnicos);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTipoProducto();
