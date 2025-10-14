const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    console.log('🔍 Checking existing businesses...');
    
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true
      }
    });
    
    console.log(`📊 Found ${businesses.length} businesses:`);
    businesses.forEach(business => {
      console.log(`  - ${business.name} (ID: ${business.id}, Slug: ${business.slug}, Active: ${business.isActive})`);
    });
    
    if (businesses.length === 0) {
      console.log('🛠️ No businesses found. Creating a demo business...');
      
      const demoBusiness = await prisma.business.create({
        data: {
          name: 'Demo Business',
          slug: 'demo',
          subdomain: 'demo',
          isActive: true,
          description: 'Business de prueba para desarrollo',
          logo: 'https://via.placeholder.com/200',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF'
        }
      });
      
      console.log('✅ Demo business created:', demoBusiness);
    }
    
  } catch (error) {
    console.error('❌ Error checking businesses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinesses();
