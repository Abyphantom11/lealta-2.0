const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true
      }
    });
    console.log('Businesses encontrados:', JSON.stringify(businesses, null, 2));
    
    // También verificar usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        businessId: true,
        business: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });
    console.log('Usuarios encontrados:', JSON.stringify(users, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinesses();
