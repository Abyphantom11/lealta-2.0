// Script para debuggear el problema específico del middleware
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMiddlewareIssue() {
  console.log('🔍 DEBUG: Simulando consulta del middleware');
  
  try {
    const subdomain = 'casa-sabor-demo';
    
    // Simulamos exactamente la misma consulta que hace el middleware
    console.log(`\n1. Buscando business con subdomain: "${subdomain}"`);
    
    const business = await prisma.business.findFirst({
      where: {
        subdomain: subdomain,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        isActive: true
      }
    });
    
    if (business) {
      console.log('✅ Business encontrado:');
      console.log('   ID:', business.id);
      console.log('   Name:', business.name);
      console.log('   Subdomain:', business.subdomain);
      console.log('   Active:', business.isActive);
    } else {
      console.log('❌ Business NO encontrado');
      
      // Verificar si existe pero está inactivo
      const inactiveBusiness = await prisma.business.findFirst({
        where: {
          subdomain: subdomain
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          isActive: true
        }
      });
      
      if (inactiveBusiness) {
        console.log('⚠️ Business existe pero está INACTIVO:');
        console.log('   ID:', inactiveBusiness.id);
        console.log('   Name:', inactiveBusiness.name);
        console.log('   Active:', inactiveBusiness.isActive);
      } else {
        console.log('❌ Business no existe en absoluto');
      }
    }
    
    // También verificar búsqueda por slug
    console.log(`\n2. Buscando business con slug: "${subdomain}"`);
    
    const businessBySlug = await prisma.business.findFirst({
      where: {
        slug: subdomain,
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
    
    if (businessBySlug) {
      console.log('✅ Business encontrado por slug:');
      console.log('   ID:', businessBySlug.id);
      console.log('   Name:', businessBySlug.name);
      console.log('   Slug:', businessBySlug.slug);
      console.log('   Subdomain:', businessBySlug.subdomain);
    } else {
      console.log('❌ Business NO encontrado por slug');
    }
    
  } catch (error) {
    console.error('❌ Error en consulta:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugMiddlewareIssue().catch(console.error);
