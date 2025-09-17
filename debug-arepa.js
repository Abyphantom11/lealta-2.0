/**
 * Script de debug para verificar el business "arepa"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBusiness() {
  console.log('🔍 Verificando business "arepa"...\n');

  try {
    // 1. Buscar por diferentes campos
    const byId = await prisma.business.findFirst({
      where: { id: 'arepa', isActive: true }
    });
    
    const bySlug = await prisma.business.findFirst({
      where: { slug: 'arepa', isActive: true }
    });
    
    const bySubdomain = await prisma.business.findFirst({
      where: { subdomain: 'arepa', isActive: true }
    });

    console.log('📊 Resultados de búsqueda:');
    console.log('Por ID:', byId ? '✅ Encontrado' : '❌ No encontrado');
    console.log('Por slug:', bySlug ? '✅ Encontrado' : '❌ No encontrado');
    console.log('Por subdomain:', bySubdomain ? '✅ Encontrado' : '❌ No encontrado');

    // 2. Mostrar todos los businesses activos
    console.log('\n📋 Todos los businesses activos:');
    const allBusinesses = await prisma.business.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true
      }
    });

    allBusinesses.forEach(business => {
      console.log(`- ID: ${business.id} | Slug: ${business.slug} | Subdomain: ${business.subdomain} | Nombre: ${business.name}`);
    });

    // 3. Simular la búsqueda del middleware
    console.log('\n🧪 Simulando búsqueda del middleware para "arepa":');
    const middlewareSearch = await prisma.business.findFirst({
      where: {
        OR: [
          { id: 'arepa' },
          { slug: 'arepa' },
          { subdomain: 'arepa' }
        ],
        isActive: true
      }
    });

    console.log('Resultado middleware:', middlewareSearch ? '✅ Encontrado' : '❌ No encontrado');
    if (middlewareSearch) {
      console.log('Detalles:', {
        id: middlewareSearch.id,
        name: middlewareSearch.name,
        slug: middlewareSearch.slug,
        subdomain: middlewareSearch.subdomain
      });
    }

    // 4. Verificar usuarios asociados
    console.log('\n👥 Usuarios asociados al business "arepa":');
    const users = await prisma.user.findMany({
      where: {
        business: {
          OR: [
            { id: 'arepa' },
            { slug: 'arepa' },
            { subdomain: 'arepa' }
          ]
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            subdomain: true
          }
        }
      }
    });

    if (users.length > 0) {
      users.forEach(user => {
        console.log(`- Usuario: ${user.email} | Rol: ${user.role} | Business: ${user.business.slug || user.business.subdomain}`);
      });
    } else {
      console.log('No hay usuarios asociados al business "arepa"');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugBusiness();
