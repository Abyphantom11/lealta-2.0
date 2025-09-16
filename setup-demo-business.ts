// Script para configurar el business demo
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupDemoBusiness() {
  try {
    console.log('🔧 Configurando business demo...');
    
    // Verificar si ya existe
    const existing = await prisma.business.findUnique({
      where: { subdomain: 'demo' }
    });

    if (existing) {
      console.log('✅ Business demo ya existe:', existing);
      return existing;
    }

    // Crear business demo
    const demoBusiness = await prisma.business.create({
      data: {
        id: 'demo',
        name: 'Café Dani Demo',
        slug: 'cafe-dani-demo',
        subdomain: 'demo',
        isActive: true,
        subscriptionPlan: 'PRO',
        settings: {
          allowRegistration: true,
          requireApproval: false
        }
      }
    });

    console.log('✅ Business demo creado exitosamente:', demoBusiness);
    return demoBusiness;

  } catch (error) {
    console.error('❌ Error configurando business demo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDemoBusiness()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default setupDemoBusiness;
