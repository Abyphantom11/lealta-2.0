const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testClienteRoute() {
  console.log('🔍 Debugging /casa-sabor-demo/cliente route issue...\n');
  
  try {
    // 1. Test regex extraction
    const pathname = '/casa-sabor-demo/cliente';
    const regex = /^\/([^/]+)\/cliente/;
    const match = regex.exec(pathname);
    const businessId = match ? match[1] : null;
    
    console.log(`📊 Pathname: ${pathname}`);
    console.log(`📊 Regex match result:`, match);
    console.log(`📊 BusinessId extraído: ${businessId}\n`);
    
    if (!businessId) {
      console.log('❌ No se pudo extraer businessId');
      return;
    }
    
    // 2. Test database query exactly as middleware does
    console.log('🔍 Testing exact middleware query...');
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: businessId },
          { slug: businessId },
          { subdomain: businessId }
        ],
        isActive: true
      }
    });
    
    console.log('📋 Query result:', business ? {
      id: business.id,
      name: business.name,
      slug: business.slug,
      subdomain: business.subdomain,
      isActive: business.isActive
    } : 'NO ENCONTRADO');
    
    if (!business) {
      console.log('\n❌ Esta es la razón del error "Negocio no encontrado o inactivo"');
      
      // Let's check if business exists without isActive filter
      const businessAnyState = await prisma.business.findFirst({
        where: {
          OR: [
            { id: businessId },
            { slug: businessId },
            { subdomain: businessId }
          ]
        }
      });
      
      console.log('\n🔍 Business sin filtro isActive:', businessAnyState ? {
        id: businessAnyState.id,
        name: businessAnyState.name,
        slug: businessAnyState.slug,
        subdomain: businessAnyState.subdomain,
        isActive: businessAnyState.isActive
      } : 'NO ENCONTRADO');
      
    } else {
      console.log('\n✅ Business encontrado correctamente - el middleware debería funcionar');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testClienteRoute();
