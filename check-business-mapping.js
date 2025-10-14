// Script para verificar qué businessId corresponde al slug "casa-sabor-demo"
const { PrismaClient } = require('@prisma/client');

async function checkBusinessIdMapping() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 VERIFICANDO MAPPING DE BUSINESS ID');
    console.log('='.repeat(50));
    
    // 1. Buscar por subdomain casa-sabor-demo
    console.log('📋 1. Buscando business con subdomain "casa-sabor-demo"...');
    
    const businessBySubdomain = await prisma.business.findFirst({
      where: { 
        subdomain: 'casa-sabor-demo'
      },
      select: { 
        id: true, 
        name: true, 
        subdomain: true,
        customDomain: true,
        isActive: true
      }
    });
    
    if (businessBySubdomain) {
      console.log('✅ Encontrado por subdomain:');
      console.log(`   ID: ${businessBySubdomain.id}`);
      console.log(`   Name: ${businessBySubdomain.name}`);
      console.log(`   Subdomain: ${businessBySubdomain.subdomain}`);
      console.log(`   Active: ${businessBySubdomain.isActive}`);
    }
    
    // 2. Buscar ambos businessId para ver cuál existe
    console.log('\n📋 2. Verificando los dos businessId...');
    
    const businessId1 = 'cmgf5px5f0000eyy0elci9yds'; // Usado en la API
    const businessId2 = 'cmgh621rd0012lb0aixrzpvrw'; // Que tiene los datos
    
    const business1 = await prisma.business.findUnique({
      where: { id: businessId1 },
      select: { 
        id: true, 
        name: true, 
        subdomain: true,
        customDomain: true,
        isActive: true
      }
    });
    
    const business2 = await prisma.business.findUnique({
      where: { id: businessId2 },
      select: { 
        id: true, 
        name: true, 
        subdomain: true,
        customDomain: true,
        isActive: true
      }
    });
    
    console.log(`\n   BusinessId 1 (${businessId1}):`);
    if (business1) {
      console.log(`   ✅ Existe - Name: "${business1.name}" | Subdomain: "${business1.subdomain}" | Active: ${business1.isActive}`);
    } else {
      console.log(`   ❌ NO existe`);
    }
    
    console.log(`\n   BusinessId 2 (${businessId2}):`);
    if (business2) {
      console.log(`   ✅ Existe - Name: "${business2.name}" | Subdomain: "${business2.subdomain}" | Active: ${business2.isActive}`);
    } else {
      console.log(`   ❌ NO existe`);
    }
    
    // 3. Contar datos en cada businessId
    console.log('\n📊 3. Contando datos de portal por businessId...');
    
    if (business1) {
      const banners1 = await prisma.portalBanner.count({
        where: { businessId: businessId1 }
      });
      const promos1 = await prisma.portalPromocion.count({
        where: { businessId: businessId1 }
      });
      console.log(`   ${businessId1}: ${banners1} banners, ${promos1} promociones`);
    }
    
    if (business2) {
      const banners2 = await prisma.portalBanner.count({
        where: { businessId: businessId2 }
      });
      const promos2 = await prisma.portalPromocion.count({
        where: { businessId: businessId2 }
      });
      console.log(`   ${businessId2}: ${banners2} banners, ${promos2} promociones`);
    }
    
    // 4. CONCLUSIÓN
    console.log('\n🎯 ANÁLISIS:');
    
    if (businessBySubdomain) {
      const correctId = businessBySubdomain.id;
      console.log(`✅ El businessId CORRECTO para "casa-sabor-demo" es: ${correctId}`);
      
      if (correctId === businessId2) {
        console.log('🎯 TUS DATOS están en el businessId CORRECTO');
        console.log('❌ Pero la API del portal está consultando el businessId INCORRECTO');
        console.log('💡 SOLUCIÓN: Actualizar la API para usar el businessId correcto');
      } else if (correctId === businessId1) {
        console.log('🎯 La API está usando el businessId CORRECTO');
        console.log('❌ Pero tus datos están en el businessId INCORRECTO');
        console.log('💡 SOLUCIÓN: Mover los datos al businessId correcto');
      }
    } else {
      console.log('❌ NO se encontró business con subdomain "casa-sabor-demo"');
      console.log('💡 Verificar la configuración de subdomain');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinessIdMapping().catch(console.error);
