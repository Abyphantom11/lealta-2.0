import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusinessData() {
  console.log('🔍 Verificando negocios en la base de datos...');
  
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log(`📊 Se encontraron ${businesses.length} negocios:`);
    businesses.forEach((business, index) => {
      console.log(`${index + 1}. ID: ${business.id}`);
      console.log(`   Nombre: ${business.name}`);
      console.log(`   Slug: ${business.slug}`);
      console.log(`   Subdominio: ${business.subdomain}`);
      console.log(`   Activo: ${business.isActive}`);
      console.log(`   Creado: ${business.createdAt}`);
      console.log('');
    });

    // Verificar si existe algún negocio
    if (businesses.length === 0) {
      console.log('❌ No hay negocios en la base de datos');
      console.log('💡 Necesitamos crear un negocio por defecto');
      
      // Crear negocio por defecto
      const defaultBusiness = await prisma.business.create({
        data: {
          id: 'default-business',
          name: 'Negocio por Defecto',
          slug: 'default-business',
          subdomain: 'default',
          subscriptionPlan: 'BASIC',
          isActive: true
        }
      });
      
      console.log('✅ Negocio por defecto creado:', defaultBusiness.id);
    } else {
      // Verificar si existe default-business
      const defaultBusiness = businesses.find(b => 
        b.id === 'default-business' || 
        b.slug === 'default-business' || 
        b.subdomain === 'default-business'
      );

      if (defaultBusiness) {
        console.log('✅ Se encontró un negocio que coincide con "default-business"');
        console.log('ID real:', defaultBusiness.id);
      } else {
        console.log('❌ No se encontró "default-business", usando el primer negocio disponible');
        console.log('Primer negocio ID:', businesses[0].id);
        console.log('💡 Actualiza el código para usar este ID o crea default-business');
      }
    }

  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinessData();
