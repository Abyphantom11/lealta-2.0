const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMenu() {
  try {
    // Buscar todos los businesses
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        slug: true,
      },
    });

    console.log('\n📋 Businesses encontrados:');
    for (const business of businesses) {
      console.log(`\n  🏢 ${business.name}`);
      console.log(`     ID: ${business.id}`);
      console.log(`     Subdomain: ${business.subdomain}`);
      console.log(`     Slug: ${business.slug}`);

      // Contar categorías y productos
      const categorias = await prisma.menuCategory.count({
        where: { businessId: business.id },
      });

      const productos = await prisma.menuProduct.count({
        where: {
          category: {
            businessId: business.id,
          },
        },
      });

      console.log(`     📂 Categorías: ${categorias}`);
      console.log(`     🍽️ Productos: ${productos}`);
    }

    // Buscar el business de casasabordemo específicamente
    console.log('\n🔍 Buscando casasabordemo específicamente...');
    const casasabor = await prisma.business.findFirst({
      where: {
        subdomain: 'casasabordemo',
      },
      include: {
        menuCategories: {
          include: {
            productos: true,
          },
        },
      },
    });

    if (casasabor) {
      console.log('\n✅ Business casasabordemo encontrado:');
      console.log(`   ID: ${casasabor.id}`);
      console.log(`   Name: ${casasabor.name}`);
      console.log(`   Categorías: ${casasabor.menuCategories.length}`);
      
      for (const cat of casasabor.menuCategories) {
        console.log(`\n   📂 ${cat.nombre} (${cat.productos.length} productos)`);
        for (const prod of cat.productos) {
          console.log(`      - ${prod.nombre}: $${prod.precio}`);
        }
      }
    } else {
      console.log('❌ No se encontró business con subdomain casasabordemo');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMenu();
