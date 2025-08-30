const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Conectando a la base de datos...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        businessId: true,
        business: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log('Usuarios disponibles:');
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos. Necesitas crear uno.');
    } else {
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, BusinessID: ${user.businessId}, Business: ${user.business?.name || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
