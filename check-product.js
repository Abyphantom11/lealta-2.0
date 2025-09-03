const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProduct() {
  try {
    const products = await prisma.menuProduct.findMany({
      where: {
        nombre: {
          contains: 'coca'
        }
      }
    });
    
    console.log('Productos encontrados:');
    products.forEach(product => {
      console.log({
        id: product.id,
        nombre: product.nombre,
        tipoProducto: product.tipoProducto,
        precio: product.precio,
        precioVaso: product.precioVaso,
        precioBotella: product.precioBotella
      });
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProduct();
