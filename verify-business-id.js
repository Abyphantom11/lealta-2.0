const { PrismaClient } = require('@prisma/client');

async function verifyBusinessId() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando businessId problemático...');
    
    // Verificar si el businessId problemático existe
    const problemBusiness = await prisma.business.findUnique({
      where: { id: 'cmgf5px5f0000eyy0elci9yds' }
    });
    
    console.log('❌ BusinessId cmgf5px5f0000eyy0elci9yds existe:', !!problemBusiness);
    
    if (problemBusiness) {
      console.log('Datos del business problemático:', {
        name: problemBusiness.name,
        slug: problemBusiness.slug,
        subdomain: problemBusiness.subdomain
      });
    }
    
    console.log('\n🔍 Verificando el business correcto...');
    
    // Verificar el business que SÍ existe
    const correctBusiness = await prisma.business.findUnique({
      where: { id: 'cmgf5o37a0000eyhgultn2kbf' }
    });
    
    console.log('✅ BusinessId cmgf5o37a0000eyhgultn2kbf existe:', !!correctBusiness);
    
    if (correctBusiness) {
      console.log('Datos del business correcto:', {
        name: correctBusiness.name,
        slug: correctBusiness.slug,
        subdomain: correctBusiness.subdomain
      });
    }
    
    console.log('\n� Buscando por slug casa-sabor-demo...');
    
    // Buscar business por slug
    const businessBySlug = await prisma.business.findFirst({
      where: { 
        OR: [
          { slug: 'casa-sabor-demo' },
          { slug: 'la-casa-del-sabor' },
          { subdomain: 'casa-sabor-demo' },
          { subdomain: 'lacasadelsabor' }
        ]
      }
    });
    
    if (businessBySlug) {
      console.log('✅ Business encontrado por slug/subdomain:', {
        id: businessBySlug.id,
        name: businessBySlug.name,
        slug: businessBySlug.slug,
        subdomain: businessBySlug.subdomain
      });
    } else {
      console.log('❌ No se encontró business con ninguna variación del slug');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBusinessId();
