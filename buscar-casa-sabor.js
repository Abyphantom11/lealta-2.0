// Buscar business "La casa del sabor" en la base de datos
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function buscarBusiness() {
  try {
    console.log('🔍 Buscando "La casa del sabor"...\n');
    
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: 'casa', mode: 'insensitive' } },
          { name: { contains: 'sabor', mode: 'insensitive' } },
        ],
      },
      include: {
        User: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (businesses.length === 0) {
      console.log('❌ No se encontró ningún business con ese nombre');
      return;
    }

    console.log(`✅ Encontrados ${businesses.length} business(es):\n`);
    
    businesses.forEach((business, index) => {
      console.log(`${index + 1}. ${business.name}`);
      console.log(`   ID: ${business.id}`);
      console.log(`   Usuarios: ${business.User?.length || 0}`);
      if (business.User && business.User.length > 0) {
        business.User.forEach(user => {
          console.log(`   - ${user.name || 'N/A'} (${user.email || 'N/A'})`);
        });
      }
      console.log(`   Plan actual: ${business.planId || 'Sin plan'}`);
      console.log(`   Suscripción: ${business.subscriptionId || 'No tiene'}`);
      console.log(`   Estado: ${business.subscriptionStatus || 'Sin suscripción'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarBusiness();
