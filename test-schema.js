const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Verificar que podemos crear un producto con los campos nuevos
    const test = await prisma.menuProduct.findFirst();
    console.log('Producto de ejemplo:', test);
    if (test) {
      console.log('Campo disponible:', test.disponible);
      console.log('Campo precioBotella:', test.precioBotella);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
