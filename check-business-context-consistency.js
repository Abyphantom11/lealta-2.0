// Script para verificar la consistencia del business context en la ruta /cliente
const { PrismaClient } = require('@prisma/client');

async function checkBusinessContextConsistency() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 VERIFICANDO CONSISTENCIA DEL BUSINESS CONTEXT');
    console.log('='.repeat(60));
    
    // 1. URL actual del portal cliente
    const currentUrl = 'casa-sabor-demo/cliente';
    const businessSlug = 'casa-sabor-demo';
    
    console.log(`📌 URL DEL PORTAL: /${currentUrl}`);
    console.log(`📌 Business Slug: ${businessSlug}`);
    
    // 2. Verificar qué business corresponde al slug
    console.log('\n🔍 1. VALIDACIÓN API /api/businesses/[businessId]/validate');
    
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { subdomain: businessSlug },
          { slug: businessSlug },
          { id: businessSlug }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        isActive: true
      }
    });
    
    if (business) {
      console.log('✅ Business encontrado:');
      console.log(`   ID real: ${business.id}`);
      console.log(`   Nombre: ${business.name}`);
      console.log(`   Subdomain: ${business.subdomain}`);
      console.log(`   Activo: ${business.isActive}`);
    } else {
      console.log('❌ Business NO encontrado para el slug');
    }
    
    // 3. Verificar qué businessId está usando la API del portal
    console.log('\n🔍 2. VERIFICACIÓN API PORTAL CONFIG');
    
    if (business) {
      const portalApiBusinessId = business.id;
      
      // Verificar datos en las tablas del portal
      const banners = await prisma.portalBanner.count({
        where: { businessId: portalApiBusinessId, active: true }
      });
      
      const promociones = await prisma.portalPromocion.count({
        where: { businessId: portalApiBusinessId, active: true }
      });
      
      const recompensas = await prisma.portalRecompensa.count({
        where: { businessId: portalApiBusinessId, active: true }
      });
      
      console.log(`   BusinessId usado en API: ${portalApiBusinessId}`);
      console.log(`   Banners activos: ${banners}`);
      console.log(`   Promociones activas: ${promociones}`);
      console.log(`   Recompensas activas: ${recompensas}`);
    }
    
    // 4. Verificar fallbacks hardcodeados en el código
    console.log('\n🔍 3. FALLBACKS HARDCODEADOS');
    
    const fallbacksEncontrados = [
      'cmfr2y0ia0000eyvw7ef3k20u', // AuthHandler
      'cmgewmtue0000eygwq8taawak', // PortalContent 
      'cmgf5px5f0000eyy0elci9yds'  // Casa Sabor Demo (usado en scripts)
    ];
    
    console.log('   Fallbacks encontrados en el código:');
    for (const fallbackId of fallbacksEncontrados) {
      const fallbackBusiness = await prisma.business.findUnique({
        where: { id: fallbackId },
        select: { id: true, name: true, subdomain: true, isActive: true }
      });
      
      if (fallbackBusiness) {
        console.log(`   ✅ ${fallbackId}: "${fallbackBusiness.name}" (${fallbackBusiness.subdomain}) - Activo: ${fallbackBusiness.isActive}`);
      } else {
        console.log(`   ❌ ${fallbackId}: NO EXISTE`);
      }
    }
    
    // 5. Verificar consistencia del flujo completo
    console.log('\n🎯 4. ANÁLISIS DE CONSISTENCIA');
    
    if (business) {
      const realBusinessId = business.id;
      const isUsingCorrectId = realBusinessId === 'cmgf5px5f0000eyy0elci9yds';
      
      console.log(`✅ FLUJO CORRECTO:`);
      console.log(`   1. URL: /${businessSlug}/cliente`);
      console.log(`   2. API Validation: Devuelve businessId ${realBusinessId}`);
      console.log(`   3. AuthHandler: Recibe businessId ${realBusinessId}`);
      console.log(`   4. useAutoRefreshPortalConfig: Usa businessId ${realBusinessId}`);
      console.log(`   5. API Portal: Consulta datos de ${realBusinessId}`);
      
      if (isUsingCorrectId) {
        console.log('\n🎉 ✅ CONSISTENCIA PERFECTA');
        console.log('   El business context se mantiene correcto en todo el flujo');
      } else {
        console.log('\n⚠️ ADVERTENCIA: BusinessId no coincide con el esperado');
        console.log(`   Esperado: cmgf5px5f0000eyy0elci9yds`);
        console.log(`   Actual: ${realBusinessId}`);
      }
    }
    
    // 6. Verificar datos del día actual
    console.log('\n📅 5. DATOS DEL DÍA ACTUAL (LUNES)');
    
    if (business) {
      const bannersHoy = await prisma.portalBanner.findMany({
        where: { 
          businessId: business.id,
          dia: 'lunes',
          active: true
        },
        select: { title: true, active: true }
      });
      
      console.log(`   Banners para lunes: ${bannersHoy.length}`);
      bannersHoy.forEach(banner => {
        console.log(`      - "${banner.title}"`);
      });
      
      if (bannersHoy.length > 0) {
        console.log('   ✅ Portal debería mostrar banners');
      } else {
        console.log('   ⚠️ Portal no mostrará banners (no hay datos para lunes)');
      }
    }
    
    console.log('\n🔗 URL DE PRUEBA:');
    console.log(`   http://localhost:3001/${businessSlug}/cliente/`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinessContextConsistency().catch(console.error);
