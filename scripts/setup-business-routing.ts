// Script para configurar subdomains en la base de datos
// Ejecutar: npx ts-node scripts/setup-business-routing.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupBusinessRouting() {
  try {
    console.log('🔧 Configurando routing de negocios...');

    // Obtener todos los negocios
    const businesses = await prisma.business.findMany();
    
    console.log(`📊 Encontrados ${businesses.length} negocios:`);
    businesses.forEach(business => {
      console.log(`  - ${business.id}: ${business.name} (subdomain: ${business.subdomain})`);
    });

    // Si el negocio principal no tiene subdomain, configurarlo
    const mainBusiness = businesses.find(b => b.id === 'business_1');
    
    if (mainBusiness && !mainBusiness.subdomain) {
      console.log('🔧 Configurando subdomain para business_1...');
      
      await prisma.business.update({
        where: { id: 'business_1' },
        data: {
          subdomain: 'demo',
          slug: 'demo-business'
        }
      });
      
      console.log('✅ Subdomain configurado: demo');
    }

    // Crear negocio de ejemplo si no existe
    const demoCount = await prisma.business.count();
    
    if (demoCount === 0) {
      console.log('🏪 Creando negocio de ejemplo...');
      
      await prisma.business.create({
        data: {
          id: 'business_1',
          name: 'Café Central Demo',
          subdomain: 'demo',
          slug: 'demo-business',
          isActive: true,
          settings: {
            contactEmail: 'demo@cafecentral.com',
            phone: '555-0123'
          }
        }
      });
      
      console.log('✅ Negocio demo creado');
    }

    // Verificar configuración final
    const updatedBusinesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        slug: true,
        isActive: true
      }
    });

    console.log('\n🎯 Configuración final de negocios:');
    updatedBusinesses.forEach(business => {
      const status = business.isActive ? '✅' : '❌';
      console.log(`  ${status} ${business.subdomain} -> ${business.name} (${business.id})`);
      console.log(`      URL: /${business.subdomain}/admin`);
    });

    console.log('\n🚀 Routing configurado correctamente!');
    console.log('📝 URLs disponibles:');
    console.log('   - /demo/admin     (Panel de administración)');
    console.log('   - /demo/staff     (Panel de staff)');  
    console.log('   - /demo/cliente   (Portal cliente)');

  } catch (error) {
    console.error('❌ Error configurando business routing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupBusinessRouting();
}

export default setupBusinessRouting;
