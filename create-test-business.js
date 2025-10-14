const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestBusiness() {
  try {
    console.log('🛠️ Creating test business...');
    
    // Verificar si ya existe
    const existing = await prisma.business.findUnique({
      where: { slug: 'test' }
    });
    
    if (existing) {
      console.log('✅ Test business already exists:', existing.id);
      return existing;
    }
    
    const testBusiness = await prisma.business.create({
      data: {
        name: 'Test Business',
        slug: 'test',
        subdomain: 'test',
        isActive: true
      }
    });
    
    console.log('✅ Test business created:', testBusiness);
    return testBusiness;
    
  } catch (error) {
    console.error('❌ Error creating test business:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBusiness();
