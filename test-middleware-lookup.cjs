// Test del middleware subdomain
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBusinessLookup() {
  try {
    console.log('🔍 Testing business lookup for "casa-sabor-demo"...\n');
    
    // Test 1: Direct database query
    console.log('1️⃣ Testing direct database query...');
    const directQuery = await prisma.business.findFirst({
      where: { 
        OR: [
          { subdomain: 'casa-sabor-demo' },
          { slug: 'casa-sabor-demo' }
        ],
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true
      }
    });

    if (directQuery) {
      console.log('✅ Direct query SUCCESS:', directQuery);
    } else {
      console.log('❌ Direct query FAILED - No business found');
    }

    // Test 2: Check isActive field specifically
    console.log('\n2️⃣ Testing isActive field...');
    const allMatches = await prisma.business.findMany({
      where: { 
        OR: [
          { subdomain: 'casa-sabor-demo' },
          { slug: 'casa-sabor-demo' }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true
      }
    });

    console.log('All matches (including inactive):', allMatches);

    // Test 3: Simulate extractBusinessFromUrl
    console.log('\n3️⃣ Testing URL extraction...');
    const pathname = '/casa-sabor-demo/cliente';
    const pathSegments = pathname.split('/').filter(Boolean);
    const potentialSubdomain = pathSegments[0];
    
    console.log('Pathname:', pathname);
    console.log('Path segments:', pathSegments);
    console.log('Potential subdomain:', potentialSubdomain);
    
    // Validar formato de subdomain
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    const isValidFormat = subdomainRegex.test(potentialSubdomain);
    console.log('Valid subdomain format:', isValidFormat);

    if (isValidFormat) {
      const business = await prisma.business.findFirst({
        where: { 
          OR: [
            { subdomain: potentialSubdomain },
            { slug: potentialSubdomain }
          ],
          isActive: true 
        }
      });
      
      console.log('Business found with extracted subdomain:', business ? '✅ YES' : '❌ NO');
      if (business) {
        console.log('Business details:', {
          id: business.id,
          name: business.name,
          subdomain: business.subdomain,
          isActive: business.isActive
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBusinessLookup();
