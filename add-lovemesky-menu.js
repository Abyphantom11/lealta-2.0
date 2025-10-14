#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ID del business Love Me Sky
const LOVE_ME_SKY_ID = 'cmgh621rd0012lb0aixrzpvrw';

// Datos del menú
const menuData = {
  'ENTRADAS': [
    {
      nombre: 'CROQUETAS VEGETARIANAS',
      precio: 7.99,
      descripcion: 'A base de espinaca y hongos, cubiertas de panko, mayonesa de alioli y perejil.'
    },
    {
      nombre: 'SLIDERS DE POLLO FRITO',
      precio: 13.99,
      descripcion: 'Pollo frito estilo coreano entre pancitos brioche, con ensalada de col y miel de sambal.'
    },
    {
      nombre: 'TUNA TARTAR',
      precio: 14.99,
      descripcion: 'Fresco atún rojo aromatizado con jengibre, aceite de sésamo, soya, ralladura de limón y semillas de sésamo. Acompañado de chips de plátano verde y mousse de aguacate.'
    },
    {
      nombre: 'DUMPLINGS DE ASADO DE TIRA',
      precio: 14.99,
      descripcion: 'Rellenos de tira de asado braseado, bañados en demi-glace con aceite de trufas blancas y manzanas verdes picadas.'
    },
    {
      nombre: 'CAMARONES TEMPURA',
      precio: 16.00,
      descripcion: 'Pinchitos de camarones rebozados, bañados en miel picante de maracuyá. Acompañados de mayonesa de wasabi y soya.'
    },
    {
      nombre: 'SAMOSAS DE CAMARÓN',
      precio: 11.99,
      descripcion: 'Crujientes empanaditas rellenas de sofrito de camarón, bañadas en miel de naranja y caso tostado.'
    },
    {
      nombre: 'CEVICHE DE MARISCOS',
      precio: 17.99,
      descripcion: 'Pesca blanca, camarón y pulpo sobre una base de curry amarillo y leche de coco, con un toque de naranja y aguacate.'
    }
  ],
  'PRINCIPALES': [
    {
      nombre: 'PANCETA DE CERDO',
      precio: 16.99,
      descripcion: 'Jugosa y crocante panceta de cerdo bañada en salsa Jus lié aromatizada con mostaza Dijon, sobre cremoso de zapallo y cebollitas encurtidas.'
    },
    {
      nombre: 'POLLO FRITO',
      precio: 18.99,
      descripcion: 'Pollo crocante deshuesado, mayonesa de chipotle, miel picante de maracuyá, alioli y dip de ají.'
    },
    {
      nombre: 'LOMO SALTADO',
      precio: 18.99,
      descripcion: 'Lomo fino de res, cocinado al fuego con pisco, cebolla, tomate, ají amarillo y cilantro. Sobre una base de papitas rústicas crocantes.'
    },
    {
      nombre: 'PULPO A LA PARRILLA',
      precio: 21.00,
      descripcion: 'Pulpo marinado en ají panal, hash de plátano maduro y chorizo español, cebolla, frijol negro, cilantro, alioli de ajo y toques cítricos.'
    },
    {
      nombre: 'PULPO GRILLADO',
      precio: 21.99,
      descripcion: 'Tiernos tentáculos de pulpo asado al grill en aromas de ají panal y especias ecuatorianas, sobre majado de zapallo asado en morrones y sal prieta manabita.'
    },
    {
      nombre: 'TOSAMI DE ATÚN ROJO',
      precio: 15.99,
      descripcion: 'Atún rojo sellado con soya y jengibre, acompañado de láminas de aguacate y base de puré de papas y ají. Bañado en salsa ponzu.'
    },
    {
      nombre: 'JUCY LUCY BURGER',
      precio: 16.99,
      descripcion: 'Hamburguesa 80% de res y 20% de cerdo rellena de queso cheddar fundido, cebolla caramelizada, tomate, salsa especial de la casa y pan brioche.'
    },
    {
      nombre: 'TACOS DE COCHINITA PIBIL',
      precio: 14.99,
      descripcion: 'Carne de cerdo adobada lentamente en naranja agria y achiote, servidas sobre tortillas de maíz, acompañada de cebollitas encurtidas, hierbitas y aguacate.'
    },
    {
      nombre: 'TACOS CRISPY SHRIMP',
      precio: 14.99,
      descripcion: 'Camarones crocantes servidos sobre tortillas de maíz, verduras, aguacate, miel picante de maracuyá y salsas sriracha al coronar.'
    }
  ],
  'POSTRES': [
    {
      nombre: 'CRÈME BRÛLÉE',
      precio: 5.99,
      descripcion: 'Clásico creme brûlée al estilo de la casa aromatizado con vainilla.'
    },
    {
      nombre: 'COCO KISS',
      precio: 5.99,
      descripcion: 'Cremoso de coco bañado en caramelo con coulis de frutos rojos.'
    },
    {
      nombre: 'MOUSSE DE CHOCOLATE',
      precio: 6.99,
      descripcion: 'Espuma de chocolate de Manabí al 70% con toffee de naranja, crumble de almendras y salsa de licor de café, terminados con frutos rojos de temporada.'
    }
  ]
};

async function main() {
  try {
    console.log('🍽️ Agregando menú a Love Me Sky...\n');

    // Verificar que el business existe
    const business = await prisma.business.findUnique({
      where: { id: LOVE_ME_SKY_ID }
    });

    if (!business) {
      console.error('❌ Business Love Me Sky no encontrado');
      return;
    }

    console.log(`✅ Business encontrado: ${business.name}`);

    // Limpiar menú existente (opcional)
    console.log('\n🧹 Limpiando menú existente...');
    await prisma.menuProduct.deleteMany({
      where: {
        category: {
          businessId: LOVE_ME_SKY_ID
        }
      }
    });

    await prisma.menuCategory.deleteMany({
      where: { businessId: LOVE_ME_SKY_ID }
    });

    console.log('✅ Menú anterior eliminado');

    let categoryOrder = 1;
    let totalProducts = 0;

    // Crear categorías y productos
    for (const [categoryName, products] of Object.entries(menuData)) {
      console.log(`\n📂 Creando categoría: ${categoryName}`);
      
      // Crear categoría
      const category = await prisma.menuCategory.create({
        data: {
          businessId: LOVE_ME_SKY_ID,
          nombre: categoryName,
          descripcion: `Sección de ${categoryName.toLowerCase()}`,
          orden: categoryOrder,
          activo: true
        }
      });

      console.log(`✅ Categoría "${categoryName}" creada con ID: ${category.id}`);

      // Crear productos para esta categoría
      let productOrder = 1;
      for (const product of products) {
        console.log(`   📦 Agregando: ${product.nombre} - $${product.precio}`);
        
        await prisma.menuProduct.create({
          data: {
            categoryId: category.id,
            nombre: product.nombre,
            descripcion: product.descripcion,
            precio: product.precio,
            tipoProducto: 'simple',
            disponible: true,
            destacado: false,
            orden: productOrder
          }
        });

        productOrder++;
        totalProducts++;
      }

      console.log(`✅ ${products.length} productos agregados a ${categoryName}`);
      categoryOrder++;
    }

    console.log(`\n🎉 ¡Menú agregado exitosamente!`);
    console.log(`📊 Resumen:`);
    console.log(`   • ${Object.keys(menuData).length} categorías creadas`);
    console.log(`   • ${totalProducts} productos agregados`);
    
    // Mostrar resumen por categoría
    for (const [categoryName, products] of Object.entries(menuData)) {
      console.log(`   • ${categoryName}: ${products.length} productos`);
    }

  } catch (error) {
    console.error('❌ Error agregando menú:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
