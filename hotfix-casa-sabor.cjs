// Hot fix temporal para casa-sabor-demo
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createHotFix() {
  try {
    console.log('🔧 Aplicando hot fix para casa-sabor-demo...\n');
    
    // Verificar el business existe
    const business = await prisma.business.findFirst({
      where: { subdomain: 'casa-sabor-demo' }
    });

    if (!business) {
      console.log('❌ Business casa-sabor-demo no encontrado en la DB');
      return;
    }

    console.log('✅ Business encontrado:', business.name);
    console.log('   ID:', business.id);
    console.log('   Subdomain:', business.subdomain);
    console.log('   IsActive:', business.isActive);

    // Crear un middleware bypass temporal
    const bypassCode = `
// TEMPORAL: Bypass cache para casa-sabor-demo
if (identifier === 'casa-sabor-demo') {
  console.log('🚀 HOTFIX: Bypassing cache for casa-sabor-demo');
  const directBusiness = await prisma.business.findFirst({
    where: { subdomain: 'casa-sabor-demo', isActive: true },
    select: { id: true, name: true, slug: true, subdomain: true, isActive: true }
  });
  if (directBusiness) {
    console.log('✅ HOTFIX: Direct business found:', directBusiness.name);
    return directBusiness;
  }
}
`;

    console.log('\n🔧 Hot fix code to add to middleware:');
    console.log(bypassCode);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createHotFix();
