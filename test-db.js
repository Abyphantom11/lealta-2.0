const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    // Ver todos los clientes
    const allClients = await prisma.cliente.findMany({
      select: {
        id: true,
        nombre: true,
        cedula: true,
        correo: true,
        telefono: true
      },
      take: 5
    });
    
    console.log('Primeros 5 clientes:', JSON.stringify(allClients, null, 2));
    
    // Buscar por cédula específica
    const searchResult = await prisma.cliente.findMany({
      where: {
        cedula: {
          contains: '17620'
        }
      }
    });
    
    console.log('Búsqueda por cédula 17620:', JSON.stringify(searchResult, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
